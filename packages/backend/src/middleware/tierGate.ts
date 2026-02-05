import { FastifyRequest, FastifyReply } from 'fastify';
import { Tier } from '../services/tierConfig';
import { config } from '../config';

declare module 'fastify' {
  interface FastifyRequest {
    tier: Tier;
  }
}

export async function tierGate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // If jwtAuth already set the tier from entitlements, keep it
  if (request.userId && request.tier) return;

  // Admin key override — allows developer to bypass tier for testing
  const adminKey = request.headers['x-admin-key'] as string | undefined;
  if (adminKey && adminKey === config.admin.apiKey) {
    const headerTier = request.headers['x-quippix-tier'] as string | undefined;
    if (headerTier === 'pro' || headerTier === 'free') {
      request.tier = headerTier as Tier;
      return;
    }
  }

  // Never trust client-provided tier — default to free.
  // Pro tier must be verified via JWT/entitlement, not a header.
  request.tier = 'free';
}
