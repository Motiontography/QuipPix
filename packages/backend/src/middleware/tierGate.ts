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

  // Legacy: read from header
  const raw = request.headers['x-quippix-tier'];
  const value = typeof raw === 'string' ? raw.toLowerCase() : 'free';
  request.tier = value === 'pro' ? 'pro' : 'free';
}
