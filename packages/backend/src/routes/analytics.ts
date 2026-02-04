import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { insertEvents } from '../db/repositories/analyticsRepository';
import { logger } from '../utils/logger';

const EventSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  timestamp: z.string().min(1),
});

const EventBatchBody = z.object({
  events: z.array(EventSchema).min(1).max(100),
});

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /events
   * Receive a batch of analytics events from the mobile client
   */
  app.post('/events', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = EventBatchBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    insertEvents(parsed.data.events);

    logger.debug({ count: parsed.data.events.length }, 'Analytics events received');

    return reply.status(201).send({ received: parsed.data.events.length });
  });
}
