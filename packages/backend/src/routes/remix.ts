import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RemixTemplateSchema, RemixRecord } from '../types';
import { config } from '../config';
import { logger } from '../utils/logger';

// ─── In-memory remix store (swap for DB in production) ───────────────
const remixStore = new Map<string, RemixRecord>();

function generateCode(length: number): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function isExpired(record: RemixRecord): boolean {
  const created = new Date(record.createdAt).getTime();
  const ttlMs = config.remix.codeTtlDays * 24 * 60 * 60 * 1000;
  return Date.now() - created > ttlMs;
}

// Exported for testing
export function getRemixRecord(code: string): RemixRecord | undefined {
  const record = remixStore.get(code);
  if (!record) return undefined;
  if (isExpired(record)) {
    remixStore.delete(code);
    return undefined;
  }
  return record;
}

export function createRemixRecord(template: RemixRecord['template']): RemixRecord {
  let code: string;
  do {
    code = generateCode(config.remix.codeLength);
  } while (remixStore.has(code));

  const record: RemixRecord = {
    code,
    template,
    createdAt: new Date().toISOString(),
    views: 0,
  };
  remixStore.set(code, record);
  return record;
}

export function getRemixStoreSize(): number {
  return remixStore.size;
}

// ─── Routes ──────────────────────────────────────────────────────────
export async function remixRoutes(app: FastifyInstance) {
  // POST /remix — create a remix short code
  app.post('/remix', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;

    const parsed = RemixTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'validation_error',
        message: 'Invalid remix template',
        issues: parsed.error.issues,
      });
    }

    const record = createRemixRecord(parsed.data);

    logger.info({ code: record.code, styleId: record.template.styleId }, 'Remix created');

    return reply.status(201).send({
      code: record.code,
      url: `https://quippix.app/remix/${record.code}`,
    });
  });

  // GET /remix/:code — retrieve remix template by code
  app.get('/remix/:code', async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.params as { code: string };

    if (!code || code.length < 4 || code.length > 20) {
      return reply.status(400).send({ error: 'Invalid remix code' });
    }

    const record = getRemixRecord(code);
    if (!record) {
      return reply.status(404).send({ error: 'Remix not found or expired' });
    }

    // Increment view count
    record.views++;

    return reply.status(200).send({
      code: record.code,
      template: record.template,
      createdAt: record.createdAt,
      views: record.views,
    });
  });

  // ─── Well-known verification routes (for Universal Links / App Links) ──

  // Apple App Site Association
  app.get('/.well-known/apple-app-site-association', async (_request, reply) => {
    return reply
      .header('Content-Type', 'application/json')
      .send({
        applinks: {
          apps: [],
          details: [
            {
              appIDs: ['TEAM_ID.com.motiontography.quippix'],
              paths: ['/remix/*'],
            },
          ],
        },
      });
  });

  // Android Asset Links
  app.get('/.well-known/assetlinks.json', async (_request, reply) => {
    return reply
      .header('Content-Type', 'application/json')
      .send([
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'com.motiontography.quippix',
            sha256_cert_fingerprints: [
              // Replace with actual signing certificate fingerprint
              'SHA256_CERT_FINGERPRINT_HERE',
            ],
          },
        },
      ]);
  });
}
