/**
 * ChatGPT 5.2 Image Mode — Adapter
 *
 * This adapter wraps the ChatGPT 5.2 Image Mode API (the "Image Engine").
 * It follows a clean interface so swapping endpoints requires only config changes.
 *
 * ─── API CONTRACT TODO ───────────────────────────────────────────────
 * The adapter is implemented against the OpenAI images API shape.
 * When the exact ChatGPT 5.2 Image Mode endpoint contract is finalized:
 *   1. Update `IMAGE_ENGINE_BASE_URL` in .env
 *   2. Update `IMAGE_ENGINE_MODEL` in .env (currently "gpt-5.2")
 *   3. Adjust request body fields in `callImageEngine()` if schema differs
 *   4. Adjust response parsing in `parseResponse()` if schema differs
 * All other code remains unchanged.
 * ─────────────────────────────────────────────────────────────────────
 */

import { config } from '../config';
import { ImageEngineRequest, ImageEngineResponse, ModerationFlags } from '../types';
import { logger } from '../utils/logger';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

interface OpenAIImageResponse {
  created: number;
  data: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  // Moderation signals (may be present in ChatGPT 5.2 Image Mode)
  moderation?: {
    flagged: boolean;
    categories: string[];
    message?: string;
  };
}

export class ImageEngineAdapter {
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = config.imageEngine.baseUrl;
    this.apiKey = config.imageEngine.apiKey;
    this.model = config.imageEngine.model;
    this.timeoutMs = config.imageEngine.timeoutMs;
  }

  async generate(request: ImageEngineRequest): Promise<ImageEngineResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.callImageEngine(request);
        return this.parseResponse(response);
      } catch (err: any) {
        lastError = err;
        const isRetryable = this.isRetryableError(err);

        logger.warn(
          { attempt, maxRetries: MAX_RETRIES, retryable: isRetryable, error: err.message },
          'Image engine call failed',
        );

        if (!isRetryable || attempt === MAX_RETRIES) {
          break;
        }

        const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
        await this.sleep(delayMs);
      }
    }

    throw new Error(`Image engine failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  private async callImageEngine(request: ImageEngineRequest): Promise<OpenAIImageResponse> {
    const formData = new FormData();

    // Image as file blob
    // Node.js FormData/Blob types diverge from browser — runtime behavior is correct
    const fd = formData as any;
    const BlobCtor = Blob as any;
    fd.append('image', new BlobCtor([request.image], { type: 'image/png' }), 'input.png');

    if (request.mask) {
      fd.append('mask', new BlobCtor([request.mask], { type: 'image/png' }), 'mask.png');
    }

    formData.append('model', request.model || this.model);
    formData.append('prompt', request.prompt);
    formData.append('size', request.size);
    formData.append('quality', request.quality);
    formData.append('response_format', request.responseFormat);
    formData.append('n', '1');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => 'no body');
        throw new ImageEngineError(
          `Image engine returned ${res.status}: ${body}`,
          res.status,
        );
      }

      return (await res.json()) as OpenAIImageResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseResponse(raw: OpenAIImageResponse): ImageEngineResponse {
    const item = raw.data?.[0];
    if (!item) {
      throw new Error('Image engine returned empty data array');
    }

    const moderationFlags: ModerationFlags = raw.moderation
      ? {
          flagged: raw.moderation.flagged,
          categories: raw.moderation.categories,
          message: raw.moderation.message,
        }
      : { flagged: false, categories: [] };

    let imageData: Buffer | null = null;
    if (item.b64_json) {
      imageData = Buffer.from(item.b64_json, 'base64');
    }

    return {
      imageData,
      imageUrl: item.url ?? null,
      revisedPrompt: item.revised_prompt ?? '',
      moderationFlags,
    };
  }

  private isRetryableError(err: any): boolean {
    if (err instanceof ImageEngineError) {
      // Retry on 429 (rate limit), 500, 502, 503, 504
      return [429, 500, 502, 503, 504].includes(err.statusCode);
    }
    // Retry on network/timeout errors
    if (err.name === 'AbortError') return true;
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') return true;
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

class ImageEngineError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ImageEngineError';
    this.statusCode = statusCode;
  }
}

// Singleton
export const imageEngine = new ImageEngineAdapter();
