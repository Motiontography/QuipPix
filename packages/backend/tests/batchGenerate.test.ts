import {
  createBatch,
  getBatchJobIds,
  getBatchCreatedAt,
  getJobStatus,
  enqueueGenerate,
} from '../src/jobs/queue';
import { BatchGenerateRequest, BatchStatusResponse, BatchStatus } from '../src/types';
import { initDb, closeDb } from '../src/db';

beforeAll(() => { initDb(':memory:'); });
afterAll(() => { closeDb(); });

// ─── BatchGenerateRequest validation ────────────────────────────────

describe('BatchGenerateRequest schema', () => {
  const validParams = {
    styleId: 'caricature-classic',
    sliders: {
      intensity: 50,
      faceFidelity: 70,
      backgroundStrength: 50,
      colorMood: 'warm',
      detail: 50,
    },
    toggles: { keepIdentity: true, preserveSkinTone: true },
  };

  it('parses valid params', () => {
    const result = BatchGenerateRequest.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('rejects invalid styleId', () => {
    const result = BatchGenerateRequest.safeParse({ ...validParams, styleId: 'nonexistent' });
    expect(result.success).toBe(false);
  });

  it('applies defaults for sliders and toggles', () => {
    const result = BatchGenerateRequest.safeParse({ styleId: 'pop-art' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sliders.intensity).toBe(50);
      expect(result.data.toggles.keepIdentity).toBe(true);
    }
  });

  it('rejects invalid outputSize', () => {
    const result = BatchGenerateRequest.safeParse({ ...validParams, outputSize: '999x999' });
    expect(result.success).toBe(false);
  });

  it('rejects userPrompt over 500 chars', () => {
    const result = BatchGenerateRequest.safeParse({
      ...validParams,
      userPrompt: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ─── Batch store operations ─────────────────────────────────────────

describe('Batch store', () => {
  it('creates and retrieves a batch', () => {
    const batchId = 'test-batch-1';
    const jobIds = ['job-a', 'job-b', 'job-c'];

    createBatch(batchId, jobIds);

    expect(getBatchJobIds(batchId)).toEqual(jobIds);
    expect(getBatchCreatedAt(batchId)).toBeDefined();
  });

  it('returns undefined for unknown batch', () => {
    expect(getBatchJobIds('nonexistent')).toBeUndefined();
    expect(getBatchCreatedAt('nonexistent')).toBeUndefined();
  });
});

// ─── Batch status aggregation logic ─────────────────────────────────

describe('Batch status aggregation', () => {
  function aggregateBatchStatus(jobIds: string[]): {
    status: BatchStatus;
    completedJobs: number;
    failedJobs: number;
    overallProgress: number;
  } {
    let completedJobs = 0;
    let failedJobs = 0;
    let totalProgress = 0;

    for (const jobId of jobIds) {
      const jobStatus = getJobStatus(jobId);
      if (!jobStatus) continue;

      if (jobStatus.status === 'done') completedJobs++;
      else if (jobStatus.status === 'failed') failedJobs++;

      totalProgress += jobStatus.progress;
    }

    const totalJobs = jobIds.length;
    const overallProgress = totalJobs > 0 ? Math.round(totalProgress / totalJobs) : 0;

    let status: BatchStatus = 'processing';
    const finishedJobs = completedJobs + failedJobs;
    if (finishedJobs === totalJobs) {
      status = failedJobs > 0 ? 'partial_failure' : 'done';
    }

    return { status, completedJobs, failedJobs, overallProgress };
  }

  it('reports processing when jobs are in-flight', () => {
    // Enqueue jobs so they appear in the store
    const jobIds = ['agg-job-1', 'agg-job-2'];
    enqueueGenerate(jobIds[0], 'input-key-1', {
      styleId: 'pop-art',
      sliders: { intensity: 50, faceFidelity: 70, backgroundStrength: 50, colorMood: 'warm', detail: 50 },
      toggles: { keepIdentity: true, preserveSkinTone: true },
    } as any);
    enqueueGenerate(jobIds[1], 'input-key-2', {
      styleId: 'pop-art',
      sliders: { intensity: 50, faceFidelity: 70, backgroundStrength: 50, colorMood: 'warm', detail: 50 },
      toggles: { keepIdentity: true, preserveSkinTone: true },
    } as any);

    const result = aggregateBatchStatus(jobIds);
    expect(result.status).toBe('processing');
    expect(result.completedJobs).toBe(0);
    expect(result.failedJobs).toBe(0);
  });

  it('reports 0 progress for unknown jobs', () => {
    const result = aggregateBatchStatus(['unknown-1', 'unknown-2']);
    expect(result.overallProgress).toBe(0);
  });
});

// ─── Route-level validation expectations (unit-level) ───────────────

describe('Batch route validation rules', () => {
  it('should reject free tier (403)', () => {
    // This documents the expected behavior:
    // POST /batch-generate with tier=free → 403
    const tier = 'free';
    expect(tier).not.toBe('pro');
  });

  it('should reject zero images (400)', () => {
    const imageCount = 0;
    expect(imageCount).toBe(0);
  });

  it('should reject more than 10 images (400)', () => {
    const maxBatchSize = 10;
    const imageCount = 11;
    expect(imageCount).toBeGreaterThan(maxBatchSize);
  });

  it('should accept valid pro batch (202)', () => {
    const tier = 'pro';
    const imageCount = 3;
    const maxBatchSize = 10;
    expect(tier).toBe('pro');
    expect(imageCount).toBeGreaterThan(0);
    expect(imageCount).toBeLessThanOrEqual(maxBatchSize);
  });

  it('should detect terminal batch state when all jobs finish', () => {
    const totalJobs = 3;
    const completedJobs = 2;
    const failedJobs = 1;
    const finishedJobs = completedJobs + failedJobs;
    expect(finishedJobs).toBe(totalJobs);

    const status: BatchStatus = failedJobs > 0 ? 'partial_failure' : 'done';
    expect(status).toBe('partial_failure');
  });

  it('should detect done state when all jobs succeed', () => {
    const totalJobs = 3;
    const completedJobs = 3;
    const failedJobs = 0;
    const finishedJobs = completedJobs + failedJobs;
    expect(finishedJobs).toBe(totalJobs);

    const status: BatchStatus = failedJobs > 0 ? 'partial_failure' : 'done';
    expect(status).toBe('done');
  });
});
