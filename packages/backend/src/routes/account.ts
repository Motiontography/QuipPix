import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDb } from '../db';
import { getJobsByUser, deleteJobsByUser } from '../db/repositories/jobRepository';
import { deleteObject } from '../services/storage';
import { logger } from '../utils/logger';

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  /**
   * DELETE /account
   * Deletes all user data. Requires valid JWT auth.
   */
  app.delete('/account', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId;

    if (!userId) {
      return reply.status(401).send({
        error: 'unauthorized',
        message: 'Authentication required to delete account',
      });
    }

    const db = getDb();

    // Get user's jobs to clean up S3 objects
    const userJobs = getJobsByUser(userId);

    // Delete S3 objects (best-effort, don't block on failures)
    for (const job of userJobs) {
      try {
        if (job.input_key) await deleteObject(job.input_key);
        if (job.result_key) await deleteObject(job.result_key);
      } catch {
        // Continue — S3 cleanup is best-effort
      }
    }

    // Cascade delete in transaction
    const deleteAll = db.transaction(() => {
      // Jobs
      deleteJobsByUser(userId);

      // Entitlements
      db.prepare('DELETE FROM user_entitlements WHERE app_user_id = ?').run(userId);

      // Device tokens
      db.prepare('DELETE FROM device_tokens WHERE app_user_id = ?').run(userId);

      // User record
      const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);

      return result.changes;
    });

    const deleted = deleteAll();

    if (deleted === 0) {
      return reply.status(404).send({
        error: 'not_found',
        message: 'Account not found',
      });
    }

    logger.info({ userId, jobsDeleted: userJobs.length }, 'Account deleted');

    return reply.status(200).send({ deleted: true });
  });
}
