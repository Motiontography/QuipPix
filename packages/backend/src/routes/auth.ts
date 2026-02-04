import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { createUser, userExists } from '../db/repositories/userRepository';

const registerSchema = z.object({
  userId: z.string().min(1).max(200),
});

const refreshSchema = z.object({
  token: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'validation_error',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      });
    }

    const { userId } = parsed.data;

    // Create user if not exists (idempotent)
    if (!userExists(userId)) {
      createUser(userId);
    }

    const token = jwt.sign({ sub: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);

    return reply.send({ token, userId });
  });

  app.post('/auth/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'validation_error',
        message: 'Token is required',
      });
    }

    const { token } = parsed.data;

    try {
      const payload = jwt.verify(token, config.jwt.secret) as { sub: string };

      if (!userExists(payload.sub)) {
        return reply.status(401).send({
          error: 'auth_error',
          message: 'User not found',
        });
      }

      const newToken = jwt.sign({ sub: payload.sub }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as string,
      } as jwt.SignOptions);

      return reply.send({ token: newToken, userId: payload.sub });
    } catch {
      return reply.status(401).send({
        error: 'auth_error',
        message: 'Invalid or expired token',
      });
    }
  });
}
