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
  // All users are equal now — credits are the only gate.
  // Tier kept for backward compat with queue priority, logging, etc.
  request.tier = 'free';
}
