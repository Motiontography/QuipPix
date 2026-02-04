import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { nanoid } from 'nanoid';
import { BatchGenerateRequest, BatchJobStatus, BatchStatus, BatchStatusResponse } from '../types';
import { stripExif, validateImage } from '../utils/exif';
import { uploadInput, getSignedDownloadUrl } from '../services/storage';
import {
  enqueueGenerate,
  createBatch,
  getBatchJobIds,
  getBatchCreatedAt,
  getJobStatus,
  getJobResultKey,
} from '../jobs/queue';
import { tierGate } from '../middleware/tierGate';
import { perUserRateLimit } from '../middleware/perUserRateLimit';
import { isStyleAllowed, isSizeAllowed, OutputSize } from '../services/tierConfig';
import { moderatePrompt } from '../services/moderation';
import { config } from '../config';
import { logger } from '../utils/logger';

export async function batchRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /batch-generate
   * Pro-only. Accepts multipart: image_0..image_9 + params JSON
   * Returns: { batchId, jobIds }
   */
  app.post('/batch-generate', { preHandler: [tierGate, perUserRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    // Pro-only gate
    if (request.tier !== 'pro') {
      return reply.status(403).send({
        error: 'pro_required',
        message: 'Batch processing requires QuipPix Pro',
      });
    }

    const parts = request.parts();
    const imageBuffers: Map<string, Buffer> = new Map();
    let params: any = {};

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname.startsWith('image_')) {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        imageBuffers.set(part.fieldname, Buffer.concat(chunks));
      } else if (part.type === 'field' && part.fieldname === 'params') {
        try {
          params = JSON.parse(part.value as string);
        } catch {
          return reply.status(400).send({ error: 'Invalid JSON in params field' });
        }
      }
    }

    // Validate image count
    if (imageBuffers.size === 0) {
      return reply.status(400).send({ error: 'No images provided' });
    }

    if (imageBuffers.size > config.batch.maxBatchSize) {
      return reply.status(400).send({
        error: 'too_many_images',
        message: `Maximum ${config.batch.maxBatchSize} images per batch`,
      });
    }

    // Parse and validate params
    const parseResult = BatchGenerateRequest.safeParse(params);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid parameters',
        details: parseResult.error.flatten(),
      });
    }
    const genRequest = parseResult.data;

    // Tier gating: style
    if (!isStyleAllowed(genRequest.styleId, request.tier)) {
      return reply.status(403).send({
        error: 'pro_required',
        message: `Style "${genRequest.styleId}" requires QuipPix Pro`,
      });
    }

    // Tier gating: output size
    const outputSize = (genRequest.outputSize ?? '1024x1024') as OutputSize;
    if (!isSizeAllowed(outputSize, request.tier)) {
      return reply.status(403).send({
        error: 'pro_required',
        message: `Output size "${outputSize}" requires QuipPix Pro`,
      });
    }

    // Quick pre-moderation on user prompt
    if (genRequest.userPrompt) {
      const modCheck = moderatePrompt(genRequest.userPrompt);
      if (!modCheck.allowed) {
        return reply.status(422).send({
          error: 'content_policy',
          message: modCheck.reason,
        });
      }
    }

    // Validate all images upfront (fail-fast)
    const sortedKeys = [...imageBuffers.keys()].sort();
    for (const key of sortedKeys) {
      try {
        await validateImage(imageBuffers.get(key)!);
      } catch (err: any) {
        return reply.status(400).send({
          error: 'invalid_image',
          message: `${key}: ${err.message}`,
        });
      }
    }

    // Process each image: strip EXIF, upload, enqueue
    const batchId = nanoid(12);
    const jobIds: string[] = [];

    for (const key of sortedKeys) {
      const cleanImage = await stripExif(imageBuffers.get(key)!);
      const inputKey = await uploadInput(cleanImage);
      const jobId = nanoid(12);
      enqueueGenerate(jobId, inputKey, genRequest, request.tier, outputSize);
      jobIds.push(jobId);
    }

    createBatch(batchId, jobIds);

    logger.info(
      { batchId, jobCount: jobIds.length, styleId: genRequest.styleId },
      'Batch generation request accepted',
    );

    return reply.status(202).send({ batchId, jobIds });
  });

  /**
   * GET /batch-status/:batchId
   * Returns aggregated batch status with per-job details
   */
  app.get<{ Params: { batchId: string } }>(
    '/batch-status/:batchId',
    async (request: FastifyRequest<{ Params: { batchId: string } }>, reply: FastifyReply) => {
      const { batchId } = request.params;

      const jobIds = getBatchJobIds(batchId);
      if (!jobIds) {
        return reply.status(404).send({ error: 'Batch not found' });
      }

      const createdAt = getBatchCreatedAt(batchId) ?? new Date().toISOString();
      const jobs: BatchJobStatus[] = [];
      let completedJobs = 0;
      let failedJobs = 0;
      let totalProgress = 0;

      for (const jobId of jobIds) {
        const jobStatus = getJobStatus(jobId);
        if (!jobStatus) {
          jobs.push({ jobId, status: 'queued', progress: 0 });
          continue;
        }

        const entry: BatchJobStatus = {
          jobId,
          status: jobStatus.status,
          progress: jobStatus.progress,
          error: jobStatus.error,
        };

        // Attach signed URL for completed jobs
        if (jobStatus.status === 'done') {
          completedJobs++;
          const resultKey = getJobResultKey(jobId);
          if (resultKey) {
            try {
              entry.resultUrl = await getSignedDownloadUrl(resultKey);
            } catch (err: any) {
              logger.warn({ jobId, error: err.message }, 'Failed to generate signed URL for batch job');
            }
          }
        } else if (jobStatus.status === 'failed') {
          failedJobs++;
        }

        totalProgress += jobStatus.progress;
        jobs.push(entry);
      }

      const totalJobs = jobIds.length;
      const overallProgress = totalJobs > 0 ? Math.round(totalProgress / totalJobs) : 0;

      // Determine batch status
      let status: BatchStatus = 'processing';
      const finishedJobs = completedJobs + failedJobs;
      if (finishedJobs === totalJobs) {
        status = failedJobs > 0 ? 'partial_failure' : 'done';
      }

      const response: BatchStatusResponse = {
        batchId,
        status,
        totalJobs,
        completedJobs,
        failedJobs,
        overallProgress,
        jobs,
        createdAt,
      };

      return reply.send(response);
    },
  );
}
