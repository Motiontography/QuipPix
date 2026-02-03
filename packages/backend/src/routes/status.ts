import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getJobStatus, getJobResultKey, deleteJobRecord, getJobInputKey } from '../jobs/queue';
import { getSignedDownloadUrl, deleteObject } from '../services/storage';
import { logger } from '../utils/logger';

export async function statusRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /status/:jobId
   * Returns: job status + signed result URL when done
   */
  app.get<{ Params: { jobId: string } }>(
    '/status/:jobId',
    async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
      const { jobId } = request.params;

      const status = getJobStatus(jobId);
      if (!status) {
        return reply.status(404).send({ error: 'Job not found' });
      }

      // If done, attach signed URL
      if (status.status === 'done') {
        const resultKey = getJobResultKey(jobId);
        if (resultKey) {
          try {
            status.resultUrl = await getSignedDownloadUrl(resultKey);
          } catch (err: any) {
            logger.warn({ jobId, error: err.message }, 'Failed to generate signed URL');
          }
        }
      }

      return reply.send(status);
    },
  );

  /**
   * DELETE /job/:jobId
   * Allows early deletion of job data (input + result)
   */
  app.delete<{ Params: { jobId: string } }>(
    '/job/:jobId',
    async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
      const { jobId } = request.params;

      const inputKey = getJobInputKey(jobId);
      const resultKey = getJobResultKey(jobId);

      const deletions: Promise<void>[] = [];
      if (inputKey) deletions.push(deleteObject(inputKey));
      if (resultKey) deletions.push(deleteObject(resultKey));

      await Promise.allSettled(deletions);
      deleteJobRecord(jobId);

      logger.info({ jobId }, 'Job data deleted');
      return reply.status(204).send();
    },
  );
}
