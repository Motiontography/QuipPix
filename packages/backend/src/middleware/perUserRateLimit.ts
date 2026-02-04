import { FastifyRequest, FastifyReply } from 'fastify';
import IORedis from 'ioredis';
import { config } from '../config';
import { Tier } from '../services/tierConfig';

const redis = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

const LIMITS: Record<Tier, number> = {
  free: config.perUserRateLimit.freeMax,
  pro: config.perUserRateLimit.proMax,
};

const WINDOW_SECONDS = config.perUserRateLimit.windowSeconds;

export async function perUserRateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.userId ?? (request.headers['x-quippix-user-id'] as string | undefined);
  if (typeof userId !== 'string' || userId.length === 0) return;

  const tier: Tier = request.tier ?? 'free';
  const limit = LIMITS[tier];
  const key = `ratelimit:user:${userId}:generate`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  const ttl = await redis.ttl(key);
  const retryAfter = ttl > 0 ? ttl : WINDOW_SECONDS;

  if (count > limit) {
    reply.header('Retry-After', String(retryAfter));
    return reply.status(429).send({
      error: 'rate_limit',
      message: `Rate limit exceeded. ${limit} requests per minute for ${tier} tier.`,
      retryAfter,
    });
  }
}

export { redis as rateLimitRedis };
