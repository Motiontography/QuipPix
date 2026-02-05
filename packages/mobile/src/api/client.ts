import { GenerateParams, JobStatusResponse, BatchStatusResponse, ChallengeResponse, RemixTemplate, RemixResponse } from '../types';
import { compressForUpload } from '../services/imageCompressor';

// Use Railway backend for both dev and production.
// localhost won't work on a physical device — it refers to the phone itself.
const API_BASE = 'https://quippix-production.up.railway.app';

class ApiClient {
  private baseUrl: string;
  private tier: 'free' | 'pro' = 'free';
  private authToken: string | null = null;
  private adminKey: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Update tier based on current entitlement — called from useProStore */
  setTier(tier: 'free' | 'pro'): void {
    this.tier = tier;
  }

  /** Set admin key for dev mode tier bypass */
  setAdminKey(key: string | null): void {
    this.adminKey = key;
  }

  /** Set JWT auth token — called from auth service */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /** Get the base URL for direct fetch calls */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** Wrapper that auto-injects tier and auth headers */
  private async request(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (!headers.has('X-QuipPix-Tier')) {
      headers.set('X-QuipPix-Tier', this.tier);
    }
    if (this.adminKey) {
      headers.set('X-Admin-Key', this.adminKey);
    }
    if (this.authToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }
    // When body is FormData, remove any explicit Content-Type so React Native
    // auto-generates the correct multipart boundary.
    if (init?.body instanceof FormData) {
      headers.delete('Content-Type');
    }
    return fetch(url, { ...init, headers });
  }

  /**
   * POST /generate
   * Uploads image + params, returns jobId
   */
  async generate(
    imageUri: string,
    params: GenerateParams,
  ): Promise<{ jobId: string }> {
    const compressedUri = await compressForUpload(imageUri);
    const formData = new FormData();

    // Append compressed image file
    formData.append('image', {
      uri: compressedUri,
      type: 'image/png',
      name: 'photo.png',
    } as any);

    // Append params as JSON string
    formData.append('params', JSON.stringify(params));

    // Do NOT set Content-Type manually — React Native must auto-set it
    // with the multipart boundary. Setting it explicitly breaks the upload.
    const res = await this.request(`${this.baseUrl}/generate`, {
      method: 'POST',
      body: formData,
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
    const res = await this.request(`${this.baseUrl}/status/${jobId}`);

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
    await this.request(`${this.baseUrl}/job/${jobId}`, { method: 'DELETE' });
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

    for (let i = 0; i < imageUris.length; i++) {
      const compressed = await compressForUpload(imageUris[i]);
      formData.append(`image_${i}`, {
        uri: compressed,
        type: 'image/png',
        name: `photo_${i}.png`,
      } as any);
    }

    formData.append('params', JSON.stringify(params));

    const res = await this.request(`${this.baseUrl}/batch-generate`, {
      method: 'POST',
      body: formData,
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
    const res = await this.request(`${this.baseUrl}/batch-status/${batchId}`);

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
    const res = await this.request(`${this.baseUrl}/challenge/today`);

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
    const res = await this.request(`${this.baseUrl}/challenge/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, jobId }),
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to submit challenge');
    }

    return res.json();
  }

  /**
   * POST /remix
   * Creates a remix short code from style template
   */
  async createRemix(template: RemixTemplate): Promise<{ code: string; url: string }> {
    const res = await this.request(`${this.baseUrl}/remix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to create remix link');
    }

    return res.json();
  }

  /**
   * GET /remix/:code
   * Retrieves remix template by short code
   */
  async getRemix(code: string): Promise<RemixResponse> {
    const res = await this.request(`${this.baseUrl}/remix/${code}`);

    if (!res.ok) {
      throw new ApiError(res.status, 'Remix not found or expired');
    }

    return res.json();
  }

  /**
   * POST /validate-receipt
   * Server-side entitlement verification via RevenueCat
   */
  async validateReceipt(
    appUserId: string,
  ): Promise<{ proActive: boolean; proType: string | null; expiresAt: string | null }> {
    const res = await this.request(`${this.baseUrl}/validate-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appUserId }),
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to validate receipt');
    }

    return res.json();
  }

  /**
   * POST /events
   * Send analytics events batch
   */
  async sendEvents(events: { event: string; properties?: Record<string, string | number | boolean>; timestamp: string }[]): Promise<{ received: number }> {
    const res = await this.request(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to send analytics events');
    }

    return res.json();
  }

  /**
   * DELETE /account
   * Permanently deletes all user data
   */
  async deleteAccount(): Promise<{ deleted: boolean }> {
    const res = await this.request(`${this.baseUrl}/account`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to delete account');
    }

    return res.json();
  }

  /**
   * POST /devices/register
   * Register device push token
   */
  async registerDevice(params: {
    deviceId: string;
    appUserId: string;
    platform: 'ios' | 'android';
    pushToken: string;
  }): Promise<{ success: boolean }> {
    const res = await this.request(`${this.baseUrl}/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to register device');
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
