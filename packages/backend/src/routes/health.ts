import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'quippix-api',
    timestamp: new Date().toISOString(),
  }));
}
