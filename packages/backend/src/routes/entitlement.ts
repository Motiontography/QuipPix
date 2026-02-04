import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import {
  ValidateReceiptRequest,
  ServerEntitlement,
  RevenueCatWebhookEvent,
  RevenueCatEventType,
  ProType,
} from '../types';
import {
  getServerEntitlement as dbGetEntitlement,
  setServerEntitlement as dbSetEntitlement,
  getEntitlementStoreSize as dbGetEntitlementStoreSize,
} from '../db/repositories/entitlementRepository';

// ─── Re-export DB-backed entitlement functions ───────────────────────
export function getServerEntitlement(appUserId: string): ServerEntitlement | undefined {
  return dbGetEntitlement(appUserId);
}

export function setServerEntitlement(ent: ServerEntitlement): void {
  dbSetEntitlement(ent);
}

export function getEntitlementStoreSize(): number {
  return dbGetEntitlementStoreSize();
}

// ─── RevenueCat API helpers ──────────────────────────────────────────
function detectProType(productId: string): ProType {
  if (productId.includes('lifetime')) return 'lifetime';
  if (productId.includes('annual')) return 'annual';
  return 'monthly';
}

interface RevenueCatSubscriber {
  entitlements: Record<
    string,
    {
      expires_date: string | null;
      product_identifier: string;
      purchase_date: string;
    }
  >;
}

async function fetchSubscriberInfo(
  appUserId: string,
): Promise<RevenueCatSubscriber | null> {
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
      {
        headers: {
          Authorization: `Bearer ${config.revenuecat.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.subscriber as RevenueCatSubscriber;
  } catch {
    return null;
  }
}

function subscriberToEntitlement(
  appUserId: string,
  subscriber: RevenueCatSubscriber,
): ServerEntitlement {
  const entId = config.revenuecat.entitlementId;
  const ent = subscriber.entitlements[entId];

  if (!ent) {
    return {
      appUserId,
      proActive: false,
      proType: null,
      expiresAt: null,
      verifiedAt: new Date().toISOString(),
    };
  }

  const expiresAt = ent.expires_date;
  const isActive =
    expiresAt === null || new Date(expiresAt) > new Date();

  return {
    appUserId,
    proActive: isActive,
    proType: isActive ? detectProType(ent.product_identifier) : null,
    expiresAt,
    verifiedAt: new Date().toISOString(),
  };
}

// ─── Routes ──────────────────────────────────────────────────────────
export async function entitlementRoutes(app: FastifyInstance) {
  /**
   * POST /validate-receipt
   * Verifies a user's entitlement via RevenueCat server API
   */
  app.post(
    '/validate-receipt',
    async (
      request: FastifyRequest<{ Body: unknown }>,
      reply: FastifyReply,
    ) => {
      const parsed = ValidateReceiptRequest.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { appUserId } = parsed.data;
      const subscriber = await fetchSubscriberInfo(appUserId);

      if (!subscriber) {
        return reply.status(502).send({
          error: 'Failed to verify with RevenueCat',
        });
      }

      const entitlement = subscriberToEntitlement(appUserId, subscriber);
      setServerEntitlement(entitlement);

      return reply.status(200).send({
        proActive: entitlement.proActive,
        proType: entitlement.proType,
        expiresAt: entitlement.expiresAt,
      });
    },
  );

  /**
   * POST /webhooks/revenuecat
   * Handles RevenueCat subscription lifecycle events
   */
  app.post(
    '/webhooks/revenuecat',
    async (
      request: FastifyRequest<{ Body: unknown }>,
      reply: FastifyReply,
    ) => {
      // Verify webhook authorization
      const authHeader = request.headers.authorization;
      if (authHeader !== `Bearer ${config.revenuecat.webhookSecret}`) {
        return reply.status(401).send({ error: 'Invalid webhook secret' });
      }

      const body = request.body as RevenueCatWebhookEvent;
      if (!body?.event?.type || !body?.event?.app_user_id) {
        return reply.status(400).send({ error: 'Invalid webhook payload' });
      }

      const { type, app_user_id, product_id, expiration_at_ms } = body.event;

      const grantEvents: RevenueCatEventType[] = [
        'INITIAL_PURCHASE',
        'RENEWAL',
        'PRODUCT_CHANGE',
      ];
      const revokeEvents: RevenueCatEventType[] = [
        'CANCELLATION',
        'EXPIRATION',
        'BILLING_ISSUE',
      ];

      if (grantEvents.includes(type)) {
        const proType = product_id ? detectProType(product_id) : 'monthly';
        const expiresAt = expiration_at_ms
          ? new Date(expiration_at_ms).toISOString()
          : null;

        setServerEntitlement({
          appUserId: app_user_id,
          proActive: true,
          proType,
          expiresAt,
          verifiedAt: new Date().toISOString(),
        });

        app.log.info({ type, appUserId: app_user_id, proType }, 'Entitlement granted');
      } else if (revokeEvents.includes(type)) {
        setServerEntitlement({
          appUserId: app_user_id,
          proActive: false,
          proType: null,
          expiresAt: null,
          verifiedAt: new Date().toISOString(),
        });

        app.log.info({ type, appUserId: app_user_id }, 'Entitlement revoked');
      }

      return reply.status(200).send({ received: true });
    },
  );
}
