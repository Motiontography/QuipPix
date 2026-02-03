import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { generateRoutes } from './routes/generate';
import { statusRoutes } from './routes/status';
import { healthRoutes } from './routes/health';
import { startCleanupScheduler, stopCleanupScheduler } from './jobs/queue';

async function start() {
  const app = Fastify({
    logger: false, // We use our own pino logger
    bodyLimit: 25 * 1024 * 1024, // 25MB
  });

  // Plugins
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  await app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB per file
      files: 1,
    },
  });

  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
  });

  // Routes
  await app.register(healthRoutes);
  await app.register(generateRoutes);
  await app.register(statusRoutes);

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({ error: error.message, url: request.url }, 'Unhandled error');

    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'rate_limit',
        message: 'Too many requests. Please wait a moment and try again.',
      });
    }

    return reply.status(error.statusCode ?? 500).send({
      error: 'internal_error',
      message:
        config.server.env === 'production'
          ? 'An unexpected error occurred'
          : error.message,
    });
  });

  // Start server
  startCleanupScheduler();

  try {
    await app.listen({ port: config.server.port, host: config.server.host });
    logger.info(
      { port: config.server.port, env: config.server.env },
      'QuipPix API server started',
    );
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    stopCleanupScheduler();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
