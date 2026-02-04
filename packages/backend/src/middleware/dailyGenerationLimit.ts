import { FastifyRequest, FastifyReply } from 'fastify';
import { rateLimitRedis as redis } from './perUserRateLimit';
import { config } from '../config';
import { Tier } from '../services/tierConfig';

const LIMITS: Record<Tier, number> = {
  free: config.freeTier.dailyGenerationLimit,
  pro: config.proTier.dailyGenerationLimit,
};

function todayKey(userId: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `daily:${userId}:${date}`;
}

function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
}

export async function dailyGenerationLimit(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId =
    request.userId ??
    (request.headers['x-quippix-user-id'] as string | undefined);
  if (typeof userId !== 'string' || userId.length === 0) return;

  const tier: Tier = request.tier ?? 'free';
  const limit = LIMITS[tier];
  const key = todayKey(userId);

  const current = await redis.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= limit) {
    const resetsIn = secondsUntilMidnightUTC();
    reply
      .header('X-Daily-Limit', String(limit))
      .header('X-Daily-Remaining', '0')
      .header('X-Daily-Reset', String(resetsIn))
      .header('Retry-After', String(resetsIn));
    return reply.status(429).send({
      error: 'daily_limit',
      message: `Daily generation limit reached (${limit}/${tier} tier). Resets at midnight UTC.`,
      limit,
      used: count,
      remaining: 0,
      resetsInSeconds: resetsIn,
    });
  }

  reply
    .header('X-Daily-Limit', String(limit))
    .header('X-Daily-Remaining', String(limit - count - 1));
}

export async function incrementDailyCount(userId: string): Promise<void> {
  const key = todayKey(userId);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, secondsUntilMidnightUTC());
  }
}

export async function getDailyCount(userId: string): Promise<number> {
  const key = todayKey(userId);
  const current = await redis.get(key);
  return current ? parseInt(current, 10) : 0;
}
