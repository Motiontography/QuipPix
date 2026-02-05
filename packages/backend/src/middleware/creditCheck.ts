import { FastifyRequest, FastifyReply } from 'fastify';
import { hasCredits, getCredits, ensureUserAndGetCredits } from '../db/repositories/userRepository';

/**
 * Middleware that checks if user has credits available.
 * Rejects with 402 Payment Required if no credits.
 */
export async function creditCheck(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Use authenticated userId, fall back to IP for anonymous users
  const userId =
    request.userId ??
    (request.headers['x-quippix-user-id'] as string | undefined) ??
    `ip:${request.ip}`;

  if (typeof userId !== 'string' || userId.length === 0) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  // Ensure user exists and get their credits
  const credits = ensureUserAndGetCredits(userId);

  if (credits <= 0) {
    return reply.status(402).send({
      error: 'no_credits',
      message: 'You have no credits remaining. Purchase a credit pack to continue.',
      credits: 0,
    });
  }

  // Attach credits to request for downstream use
  reply.header('X-Credits-Remaining', String(credits - 1));
}

/**
 * Deducts one credit after successful generation.
 * Call this AFTER the job is successfully enqueued.
 */
export { deductCredit } from '../db/repositories/userRepository';
