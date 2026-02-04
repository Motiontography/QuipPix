import 'dotenv/config';

function env(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined) throw new Error(`Missing env var: ${key}`);
  return val;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  return raw ? parseInt(raw, 10) : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (!raw) return fallback;
  return raw === 'true' || raw === '1';
}

export const config = {
  server: {
    port: envInt('PORT', 3000),
    host: env('HOST', '0.0.0.0'),
    env: env('NODE_ENV', 'development'),
  },

  imageEngine: {
    apiKey: env('IMAGE_ENGINE_API_KEY', 'sk-placeholder'),
    baseUrl: env('IMAGE_ENGINE_BASE_URL', 'https://api.openai.com/v1'),
    model: env('IMAGE_ENGINE_MODEL', 'gpt-5.2'),
    timeoutMs: envInt('IMAGE_ENGINE_TIMEOUT_MS', 120_000),
  },

  redis: {
    host: env('REDIS_HOST', '127.0.0.1'),
    port: envInt('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  s3: {
    endpoint: env('S3_ENDPOINT', 'http://localhost:9000'),
    region: env('S3_REGION', 'us-east-1'),
    bucket: env('S3_BUCKET', 'quippix-temp'),
    accessKey: env('S3_ACCESS_KEY', 'minioadmin'),
    secretKey: env('S3_SECRET_KEY', 'minioadmin'),
    forcePathStyle: envBool('S3_FORCE_PATH_STYLE', true),
  },

  storage: {
    ttlSeconds: envInt('STORAGE_TTL_SECONDS', 3600),
    signedUrlExpiry: envInt('SIGNED_URL_EXPIRY_SECONDS', 900),
  },

  rateLimit: {
    max: envInt('RATE_LIMIT_MAX', 30),
    windowMs: envInt('RATE_LIMIT_WINDOW_MS', 60_000),
  },

  moderation: {
    enabled: envBool('MODERATION_ENABLED', true),
    imageCheckEnabled: envBool('MODERATION_IMAGE_CHECK', true),
  },

  freeTier: {
    dailyGenerationLimit: envInt('FREE_DAILY_GENERATION_LIMIT', 5),
    cooldownMinutes: envInt('FREE_COOLDOWN_MINUTES', 30),
  },

  proTier: {
    dailyGenerationLimit: envInt('PRO_DAILY_GENERATION_LIMIT', 30),
  },

  batch: {
    maxBatchSize: envInt('BATCH_MAX_SIZE', 10),
  },

  challenge: {
    poolSize: envInt('CHALLENGE_POOL_SIZE', 90),
  },

  remix: {
    codeTtlDays: envInt('REMIX_CODE_TTL_DAYS', 90),
    codeLength: envInt('REMIX_CODE_LENGTH', 8),
  },

  db: {
    path: env('DATABASE_PATH', './data/quippix.db'),
  },

  perUserRateLimit: {
    freeMax: envInt('PER_USER_RATE_LIMIT_FREE', 10),
    proMax: envInt('PER_USER_RATE_LIMIT_PRO', 30),
    windowSeconds: envInt('PER_USER_RATE_LIMIT_WINDOW', 60),
  },

  jwt: {
    secret: env('JWT_SECRET', 'quippix-dev-secret-change-in-production'),
    expiresIn: env('JWT_EXPIRES_IN', '30d'),
  },

  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || undefined,
    enabled: envBool('FIREBASE_ENABLED', false),
  },

  admin: {
    apiKey: env('ADMIN_API_KEY', 'admin-dev-key'),
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || undefined,
    enabled: envBool('SENTRY_ENABLED', false),
  },

  revenuecat: {
    apiKey: env('REVENUECAT_API_KEY', 'sk_placeholder'),
    webhookSecret: env('REVENUECAT_WEBHOOK_SECRET', 'whsec_placeholder'),
    entitlementId: env('REVENUECAT_ENTITLEMENT_ID', 'pro'),
  },
} as const;
