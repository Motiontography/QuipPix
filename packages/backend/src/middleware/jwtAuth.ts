import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getServerEntitlement, setServerEntitlement } from '../db/repositories/entitlementRepository';
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
    let isActive = entitlement?.proActive ?? false;

    // Check if subscription has expired between webhook events
    if (isActive && entitlement?.expiresAt) {
      const expiresAtMs = new Date(entitlement.expiresAt).getTime();
      if (Date.now() > expiresAtMs) {
        isActive = false;
        try {
          setServerEntitlement({
            appUserId: payload.sub,
            proActive: false,
            proType: null,
            expiresAt: entitlement.expiresAt,
            verifiedAt: new Date().toISOString(),
          });
        } catch {
          // Non-critical — webhook will eventually update
        }
      }
    }

    request.tier = (isActive ? 'pro' : 'free') as Tier;
  } catch {
    // Invalid/expired JWT — fall through to legacy header-based auth
    return;
  }
}
