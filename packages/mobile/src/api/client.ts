import { GenerateParams, JobStatusResponse } from '../types';

const API_BASE = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.quippix.app'; // Replace with production URL

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * POST /generate
   * Uploads image + params, returns jobId
   */
  async generate(
    imageUri: string,
    params: GenerateParams,
    tier: 'free' | 'pro' = 'free',
  ): Promise<{ jobId: string }> {
    const formData = new FormData();

    // Append image file
    formData.append('image', {
      uri: imageUri,
      type: 'image/png',
      name: 'photo.png',
    } as any);

    // Append params as JSON string
    formData.append('params', JSON.stringify(params));

    const res = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-QuipPix-Tier': tier,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(res.status, body.error || body.message || 'Generation failed', body);
    }

    return res.json();
  }

  /**
   * GET /status/:jobId
   * Polls job status
   */
  async getStatus(jobId: string): Promise<JobStatusResponse> {
    const res = await fetch(`${this.baseUrl}/status/${jobId}`);

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to get job status');
    }

    return res.json();
  }

  /**
   * DELETE /job/:jobId
   * Optional early deletion
   */
  async deleteJob(jobId: string): Promise<void> {
    await fetch(`${this.baseUrl}/job/${jobId}`, { method: 'DELETE' });
  }

  /**
   * Poll status until done/failed
   */
  async pollUntilDone(
    jobId: string,
    onProgress: (status: JobStatusResponse) => void,
    intervalMs: number = 2000,
    timeoutMs: number = 180_000,
  ): Promise<JobStatusResponse> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const status = await this.getStatus(jobId);
      onProgress(status);

      if (status.status === 'done' || status.status === 'failed') {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new ApiError(408, 'Generation timed out');
  }
}

export class ApiError extends Error {
  status: number;
  body?: any;

  constructor(status: number, message: string, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export const api = new ApiClient(API_BASE);
