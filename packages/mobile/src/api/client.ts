import { GenerateParams, JobStatusResponse, BatchStatusResponse, ChallengeResponse } from '../types';

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
   * POST /batch-generate
   * Uploads multiple images + shared params, returns batchId + jobIds
   */
  async batchGenerate(
    imageUris: string[],
    params: GenerateParams,
  ): Promise<{ batchId: string; jobIds: string[] }> {
    const formData = new FormData();

    imageUris.forEach((uri, i) => {
      formData.append(`image_${i}`, {
        uri,
        type: 'image/png',
        name: `photo_${i}.png`,
      } as any);
    });

    formData.append('params', JSON.stringify(params));

    const res = await fetch(`${this.baseUrl}/batch-generate`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-QuipPix-Tier': 'pro',
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(res.status, body.error || body.message || 'Batch generation failed', body);
    }

    return res.json();
  }

  /**
   * GET /batch-status/:batchId
   * Returns aggregated batch status
   */
  async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
    const res = await fetch(`${this.baseUrl}/batch-status/${batchId}`);

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to get batch status');
    }

    return res.json();
  }

  /**
   * Poll batch status until done/partial_failure
   */
  async pollBatchUntilDone(
    batchId: string,
    onProgress: (status: BatchStatusResponse) => void,
    intervalMs: number = 2500,
    timeoutMs: number = 300_000,
  ): Promise<BatchStatusResponse> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const status = await this.getBatchStatus(batchId);
      onProgress(status);

      if (status.status === 'done' || status.status === 'partial_failure') {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new ApiError(408, 'Batch generation timed out');
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

  /**
   * GET /challenge/today
   * Returns today's daily challenge
   */
  async getTodayChallenge(): Promise<ChallengeResponse> {
    const res = await fetch(`${this.baseUrl}/challenge/today`);

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to get daily challenge');
    }

    return res.json();
  }

  /**
   * POST /challenge/submit
   * Records a challenge submission
   */
  async submitChallenge(
    challengeId: string,
    jobId: string,
  ): Promise<{ success: boolean; totalSubmissions: number }> {
    const res = await fetch(`${this.baseUrl}/challenge/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, jobId }),
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to submit challenge');
    }

    return res.json();
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
