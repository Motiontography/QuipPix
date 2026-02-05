import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ensureUserAndGetCredits, addCredits } from '../db/repositories/userRepository';
import { logger } from '../utils/logger';

// Credit pack definitions
export const CREDIT_PACKS = {
  small: { credits: 25, productId: 'quippix_credits_25' },
  medium: { credits: 100, productId: 'quippix_credits_100' },
  large: { credits: 250, productId: 'quippix_credits_250' },
} as const;

/**
 * Get credits for a product ID (used by webhook)
 */
export function getCreditsForProduct(productId: string): number | null {
  const normalizedId = productId.toLowerCase();
  for (const pack of Object.values(CREDIT_PACKS)) {
    if (normalizedId.includes(pack.productId) || normalizedId.includes(String(pack.credits))) {
      return pack.credits;
    }
  }
  return null;
}

export async function creditsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /credits
   * Returns user's current credit balance
   */
  app.get('/credits', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId =
      request.userId ??
      (request.headers['x-quippix-user-id'] as string | undefined);

    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const credits = ensureUserAndGetCredits(userId);

    return reply.send({
      credits,
      packs: [
        { id: 'small', credits: 25, price: '$4.99' },
        { id: 'medium', credits: 100, price: '$14.99', bestValue: true },
        { id: 'large', credits: 250, price: '$29.99' },
      ],
    });
  });

  /**
   * POST /credits/grant (Admin only - for testing)
   * Grants credits to a user
   */
  app.post(
    '/credits/grant',
    async (
      request: FastifyRequest<{ Body: { userId: string; amount: number } }>,
      reply: FastifyReply,
    ) => {
      // Admin auth check
      const adminKey = request.headers['x-admin-api-key'];
      if (adminKey !== process.env.ADMIN_API_KEY) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { userId, amount } = request.body as { userId: string; amount: number };

      if (!userId || typeof amount !== 'number' || amount <= 0) {
        return reply.status(400).send({ error: 'Invalid userId or amount' });
      }

      const newBalance = addCredits(userId, amount);
      logger.info({ userId, amount, newBalance }, 'Credits granted by admin');

      return reply.send({ credits: newBalance });
    },
  );
}
