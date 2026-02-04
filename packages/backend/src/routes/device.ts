import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { registerDevice, removeDevice } from '../db/repositories/deviceRepository';
import { logger } from '../utils/logger';

const RegisterDeviceBody = z.object({
  deviceId: z.string().min(1).max(200),
  appUserId: z.string().min(1).max(200),
  platform: z.enum(['ios', 'android']),
  pushToken: z.string().min(1).max(500),
});

export async function deviceRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /devices/register
   * Store or update a device push token
   */
  app.post('/devices/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = RegisterDeviceBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const now = new Date().toISOString();
    registerDevice({
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    });

    logger.info(
      { deviceId: parsed.data.deviceId, platform: parsed.data.platform },
      'Device registered',
    );

    return reply.status(201).send({ success: true });
  });

  /**
   * DELETE /devices/:deviceId
   * Remove a device token
   */
  app.delete<{ Params: { deviceId: string } }>(
    '/devices/:deviceId',
    async (
      request: FastifyRequest<{ Params: { deviceId: string } }>,
      reply: FastifyReply,
    ) => {
      const removed = removeDevice(request.params.deviceId);
      return reply.status(removed ? 200 : 404).send({ removed });
    },
  );
}
