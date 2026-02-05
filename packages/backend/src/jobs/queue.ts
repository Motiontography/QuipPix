import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config';
import { logger } from '../utils/logger';
import { imageEngine } from '../adapters/imageEngine';
import { composePrompt } from '../services/promptComposer';
import { getRecipe } from '../services/styleRecipes';
import { moderatePrompt, checkProviderFlags } from '../services/moderation';
import { getObjectBuffer, uploadResult, deleteObject } from '../services/storage';
import { GenerateRequest, ImageEngineRequest, JobStatus, JobStatusResponse } from '../types';
import { Tier, OutputSize } from '../services/tierConfig';
import {
  createJob,
  getJobEntry,
  updateJobStatus,
  updateJobProgress,
  setJobResultKey as dbSetJobResultKey,
  getJobStatus as dbGetJobStatus,
  getJobResultKey as dbGetJobResultKey,
  getJobInputKey as dbGetJobInputKey,
  deleteJobRecord as dbDeleteJobRecord,
  createBatch as dbCreateBatch,
  getBatchJobIds as dbGetBatchJobIds,
  getBatchCreatedAt as dbGetBatchCreatedAt,
} from '../db/repositories/jobRepository';
import { createRedisConnection } from '../lib/redisConnection';

// ─── Redis connection ────────────────────────────────────────────────
const connection = createRedisConnection();

// ─── Re-export DB-backed job/batch functions ─────────────────────────
export function getJobStatus(jobId: string): JobStatusResponse | null {
  return dbGetJobStatus(jobId);
}

export function setJobResultUrl(jobId: string, url: string): void {
  dbSetJobResultKey(jobId, url);
}

export function getJobResultKey(jobId: string): string | undefined {
  return dbGetJobResultKey(jobId);
}

export function getJobInputKey(jobId: string): string | undefined {
  return dbGetJobInputKey(jobId);
}

export function deleteJobRecord(jobId: string): boolean {
  return dbDeleteJobRecord(jobId);
}

export function createBatch(batchId: string, jobIds: string[]): void {
  dbCreateBatch(batchId, jobIds);
}

export function getBatchJobIds(batchId: string): string[] | undefined {
  return dbGetBatchJobIds(batchId);
}

export function getBatchCreatedAt(batchId: string): string | undefined {
  return dbGetBatchCreatedAt(batchId);
}

// ─── Queue ───────────────────────────────────────────────────────────
export const generateQueue = new Queue('generate', { connection });

export interface GenerateJobData {
  jobId: string;
  inputKey: string;
  request: GenerateRequest;
  tier: Tier;
  outputSize: OutputSize;
}

export function enqueueGenerate(
  jobId: string,
  inputKey: string,
  request: GenerateRequest,
  tier: Tier = 'free',
  outputSize: OutputSize = '1024x1024',
  userId?: string,
): void {
  createJob(jobId, inputKey, userId);

  generateQueue.add('generate', { jobId, inputKey, request, tier, outputSize } as GenerateJobData, {
    priority: tier === 'pro' ? 1 : 5,
    attempts: 1, // Retries handled inside adapter
    removeOnComplete: 100,
    removeOnFail: 100,
  });

  logger.info({ jobId, tier, priority: tier === 'pro' ? 1 : 5 }, 'Job enqueued');
}

// ─── Worker ──────────────────────────────────────────────────────────
export const generateWorker = new Worker<GenerateJobData>(
  'generate',
  async (job: Job<GenerateJobData>) => {
    const { jobId, inputKey, request, outputSize } = job.data;
    const entry = getJobEntry(jobId);
    if (!entry) throw new Error(`No job entry for ${jobId}`);

    try {
      updateJobStatus(jobId, 'running', 10);

      // 1. Compose prompt
      const { systemPrompt, userPrompt } = composePrompt(
        request.styleId,
        request.sliders,
        request.toggles,
        request.userPrompt,
        request.styleOptions,
        request.proSliders,
      );
      updateJobProgress(jobId, 20);

      // 2. Pre-generation moderation
      const modCheck = moderatePrompt(userPrompt);
      if (!modCheck.allowed) {
        updateJobStatus(jobId, 'failed', 100, modCheck.reason);
        return;
      }
      updateJobProgress(jobId, 30);

      // 3. Fetch input image from S3
      const imageBuffer = await getObjectBuffer(inputKey);
      updateJobProgress(jobId, 40);

      // 4. Get recipe output requirements
      const recipe = getRecipe(request.styleId);

      // 5. Call OpenAI GPT Image Model
      const resolvedSize = outputSize || recipe.outputRequirements.defaultSize;
      const engineRequest: ImageEngineRequest = {
        model: config.imageEngine.model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        image: imageBuffer,
        size: resolvedSize,
        quality: 'high',
        inputFidelity: 'high',
      };
      updateJobProgress(jobId, 50);

      const result = await imageEngine.generate(engineRequest);
      updateJobProgress(jobId, 80);

      // 6. Post-generation moderation
      const postCheck = checkProviderFlags(result.moderationFlags);
      if (!postCheck.allowed) {
        updateJobStatus(jobId, 'failed', 100, postCheck.reason);
        return;
      }

      // 7. Upload result
      if (!result.imageData && result.imageUrl) {
        // Fetch from URL if engine returned URL instead of base64
        const urlRes = await fetch(result.imageUrl);
        result.imageData = Buffer.from(await urlRes.arrayBuffer());
      }

      if (!result.imageData) {
        throw new Error('No image data in engine response');
      }

      const resultKey = await uploadResult(result.imageData, jobId);
      dbSetJobResultKey(jobId, resultKey);
      updateJobStatus(jobId, 'done', 100);

      logger.info({ jobId, resultKey }, 'Job completed');
    } catch (err: any) {
      updateJobStatus(jobId, 'failed', 100, err.message || 'Unknown error');
      logger.error({ jobId, error: err.message }, 'Job failed');
    }
  },
  {
    connection,
    concurrency: 3,
  },
);

generateWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.data?.jobId, error: err.message }, 'Worker job failed');
});

// ─── TTL cleanup scheduler ──────────────────────────────────────────
import { cleanupExpired } from '../services/storage';
import { cleanupExpiredRemixes } from '../db/repositories/remixRepository';

let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupScheduler(): void {
  // Run every 10 minutes
  cleanupInterval = setInterval(async () => {
    try {
      await cleanupExpired();
      cleanupExpiredRemixes();
    } catch (err: any) {
      logger.error({ error: err.message }, 'TTL cleanup failed');
    }
  }, 10 * 60 * 1000);

  // Initial cleanup on start
  cleanupExpired().catch(() => {});
}

export function stopCleanupScheduler(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
