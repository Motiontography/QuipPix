import { FastifyRequest, FastifyReply } from 'fastify';
import { Tier } from '../services/tierConfig';

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

  // Never trust client-provided tier — default to free.
  // Pro tier must be verified via JWT/entitlement, not a header.
  request.tier = 'free';
}
