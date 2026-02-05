import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { resolveStoragePath } from '../services/storage';
import fs from 'fs';

export async function fileRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /files/:prefix/:filename
   * Serves generated images from local storage.
   * Keys look like "inputs/uuid.png" or "results/jobid.png"
   */
  app.get<{ Params: { prefix: string; filename: string } }>(
    '/files/:prefix/:filename',
    async (
      request: FastifyRequest<{ Params: { prefix: string; filename: string } }>,
      reply: FastifyReply,
    ) => {
      const { prefix, filename } = request.params;

      // Only allow known prefixes
      if (prefix !== 'inputs' && prefix !== 'results') {
        return reply.status(404).send({ error: 'Not found' });
      }

      // Only allow .png files
      if (!filename.endsWith('.png')) {
        return reply.status(404).send({ error: 'Not found' });
      }

      const key = `${prefix}/${filename}`;
      const filePath = resolveStoragePath(key);

      if (!filePath) {
        return reply.status(404).send({ error: 'File not found' });
      }

      const stream = fs.createReadStream(filePath);
      return reply
        .type('image/png')
        .header('Cache-Control', 'private, max-age=3600')
        .send(stream);
    },
  );
}
