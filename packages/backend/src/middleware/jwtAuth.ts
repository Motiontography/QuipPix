import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getServerEntitlement } from '../db/repositories/entitlementRepository';
import { Tier } from '../services/tierConfig';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

export async function jwtAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No JWT — fall through to legacy header-based auth
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    request.userId = payload.sub;

    // Determine tier from server-side entitlements
    const entitlement = getServerEntitlement(payload.sub);
    request.tier = (entitlement?.proActive ? 'pro' : 'free') as Tier;
  } catch {
    // Invalid/expired JWT — fall through to legacy header-based auth
    return;
  }
}
