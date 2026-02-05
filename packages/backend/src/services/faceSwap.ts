import Replicate from 'replicate';
import { config } from '../config';
import { logger } from '../utils/logger';

// ─── Timeout for Replicate API calls (60 seconds) ────────────────────
const REPLICATE_TIMEOUT_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms / 1000}s`)), ms),
    ),
  ]);
}

// ─── Eligible styles for face-swap (photorealistic only) ─────────────
const FACE_SWAP_ELIGIBLE_STYLES = new Set([
  'pro-headshot',
  'insta-glam',
  'motiontography-ethereal',
  'motiontography-golden',
  'motiontography-dramatic',
  'editorial-fashion',
  'dreamy-portrait',
]);

export function isFaceSwapEligible(styleId: string): boolean {
  return FACE_SWAP_ELIGIBLE_STYLES.has(styleId);
}

// ─── Lazy-init Replicate client ──────────────────────────────────────
let replicateClient: Replicate | null = null;

function getReplicate(): Replicate {
  if (!replicateClient) {
    if (!config.replicate.apiToken) {
      throw new Error('REPLICATE_API_TOKEN not set');
    }
    replicateClient = new Replicate({ auth: config.replicate.apiToken });
  }
  return replicateClient;
}

function bufferToDataUri(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString('base64')}`;
}

// ─── Face-swap: swap user's real face onto the styled image ──────────
export async function swapFace(
  sourceImage: Buffer,
  styledImage: Buffer,
): Promise<Buffer | null> {
  try {
    const replicate = getReplicate();
    const model = config.replicate.faceSwapModel;
    const sourceUri = bufferToDataUri(sourceImage);
    const styledUri = bufferToDataUri(styledImage);

    logger.info({ model }, 'Starting face-swap');

    let input: Record<string, unknown>;

    if (model.includes('easel')) {
      // easel/advanced-face-swap uses different param names
      input = {
        swap_image: sourceUri,
        target_image: styledUri,
      };
    } else {
      // codeplugtech/face-swap (default)
      input = {
        swap_image: sourceUri,
        input_image: styledUri,
      };
    }

    const output = await withTimeout(
      replicate.run(model as `${string}/${string}`, { input }),
      REPLICATE_TIMEOUT_MS,
      'Face-swap',
    );

    // replicate.run returns a FileOutput (ReadableStream) or a string URL
    let resultBuffer: Buffer;

    if (output && typeof output === 'object' && 'url' in (output as any)) {
      // FileOutput — fetch the URL
      const url = (output as any).url as string;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch face-swap result: ${res.status}`);
      resultBuffer = Buffer.from(await res.arrayBuffer());
    } else if (typeof output === 'string') {
      // URL string returned directly
      const res = await fetch(output);
      if (!res.ok) throw new Error(`Failed to fetch face-swap result: ${res.status}`);
      resultBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      throw new Error('Unexpected Replicate output format');
    }

    logger.info({ model, size: resultBuffer.length }, 'Face-swap completed');
    return resultBuffer;
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Face-swap failed — using original image');
    return null;
  }
}

// ─── Face enhancement: polish with CodeFormer ────────────────────────
export async function enhanceFace(image: Buffer): Promise<Buffer | null> {
  try {
    const replicate = getReplicate();
    const model = config.replicate.faceEnhanceModel;
    const imageUri = bufferToDataUri(image);

    logger.info({ model }, 'Starting face enhancement');

    const output = await withTimeout(
      replicate.run(model as `${string}/${string}`, {
        input: {
          image: imageUri,
          codeformer_fidelity: 0.7,
          face_upsample: true,
          background_enhance: false,
          upscale: 1,
        },
      }),
      REPLICATE_TIMEOUT_MS,
      'Face-enhance',
    );

    let resultBuffer: Buffer;

    if (output && typeof output === 'object' && 'url' in (output as any)) {
      const url = (output as any).url as string;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch enhancement result: ${res.status}`);
      resultBuffer = Buffer.from(await res.arrayBuffer());
    } else if (typeof output === 'string') {
      const res = await fetch(output);
      if (!res.ok) throw new Error(`Failed to fetch enhancement result: ${res.status}`);
      resultBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      throw new Error('Unexpected Replicate output format');
    }

    logger.info({ model, size: resultBuffer.length }, 'Face enhancement completed');
    return resultBuffer;
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Face enhancement failed — using original image');
    return null;
  }
}
