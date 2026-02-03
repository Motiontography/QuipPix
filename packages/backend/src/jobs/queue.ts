import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { imageEngine } from '../adapters/imageEngine';
import { composePrompt } from '../services/promptComposer';
import { getRecipe } from '../services/styleRecipes';
import { moderatePrompt, checkProviderFlags } from '../services/moderation';
import { getObjectBuffer, uploadResult, deleteObject } from '../services/storage';
import { GenerateRequest, ImageEngineRequest, JobStatus, JobStatusResponse } from '../types';
import { Tier, OutputSize } from '../services/tierConfig';

// ─── Redis connection ────────────────────────────────────────────────
const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

// ─── In-memory job status store (swap for Redis hash in production) ──
const jobStore = new Map<
  string,
  {
    status: JobStatus;
    progress: number;
    resultKey?: string;
    inputKey: string;
    error?: string;
    createdAt: string;
  }
>();

export function getJobStatus(jobId: string): JobStatusResponse | null {
  const entry = jobStore.get(jobId);
  if (!entry) return null;
  return {
    jobId,
    status: entry.status,
    progress: entry.progress,
    error: entry.error,
    createdAt: entry.createdAt,
  };
}

export function setJobResultUrl(jobId: string, url: string): void {
  const entry = jobStore.get(jobId);
  if (entry) entry.resultKey = url;
}

export function getJobResultKey(jobId: string): string | undefined {
  return jobStore.get(jobId)?.resultKey;
}

export function getJobInputKey(jobId: string): string | undefined {
  return jobStore.get(jobId)?.inputKey;
}

export function deleteJobRecord(jobId: string): boolean {
  return jobStore.delete(jobId);
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
): void {
  jobStore.set(jobId, {
    status: 'queued',
    progress: 0,
    inputKey,
    createdAt: new Date().toISOString(),
  });

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
    const entry = jobStore.get(jobId);
    if (!entry) throw new Error(`No job entry for ${jobId}`);

    try {
      entry.status = 'running';
      entry.progress = 10;

      // 1. Compose prompt
      const { systemPrompt, userPrompt } = composePrompt(
        request.styleId,
        request.sliders,
        request.toggles,
        request.userPrompt,
        request.styleOptions,
        request.proSliders,
      );
      entry.progress = 20;

      // 2. Pre-generation moderation
      const modCheck = moderatePrompt(userPrompt);
      if (!modCheck.allowed) {
        entry.status = 'failed';
        entry.error = modCheck.reason;
        entry.progress = 100;
        return;
      }
      entry.progress = 30;

      // 3. Fetch input image from S3
      const imageBuffer = await getObjectBuffer(inputKey);
      entry.progress = 40;

      // 4. Get recipe output requirements
      const recipe = getRecipe(request.styleId);

      // 5. Call ChatGPT 5.2 Image Mode
      const resolvedSize = outputSize || recipe.outputRequirements.defaultSize;
      const engineRequest: ImageEngineRequest = {
        model: config.imageEngine.model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        image: imageBuffer,
        size: resolvedSize,
        quality: 'hd',
        responseFormat: 'b64_json',
      };
      entry.progress = 50;

      const result = await imageEngine.generate(engineRequest);
      entry.progress = 80;

      // 6. Post-generation moderation
      const postCheck = checkProviderFlags(result.moderationFlags);
      if (!postCheck.allowed) {
        entry.status = 'failed';
        entry.error = postCheck.reason;
        entry.progress = 100;
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
      entry.resultKey = resultKey;
      entry.status = 'done';
      entry.progress = 100;

      logger.info({ jobId, resultKey }, 'Job completed');
    } catch (err: any) {
      entry.status = 'failed';
      entry.error = err.message || 'Unknown error';
      entry.progress = 100;
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

// ─── Batch store ────────────────────────────────────────────────────
const batchStore = new Map<
  string,
  { jobIds: string[]; createdAt: string }
>();

export function createBatch(batchId: string, jobIds: string[]): void {
  batchStore.set(batchId, {
    jobIds,
    createdAt: new Date().toISOString(),
  });
}

export function getBatchJobIds(batchId: string): string[] | undefined {
  return batchStore.get(batchId)?.jobIds;
}

export function getBatchCreatedAt(batchId: string): string | undefined {
  return batchStore.get(batchId)?.createdAt;
}

// ─── TTL cleanup scheduler ──────────────────────────────────────────
import { cleanupExpired } from '../services/storage';

let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupScheduler(): void {
  // Run every 10 minutes
  cleanupInterval = setInterval(async () => {
    try {
      await cleanupExpired();
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
