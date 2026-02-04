import { config } from '../config';
import { logger } from '../utils/logger';

let sentryModule: typeof import('@sentry/node') | null = null;

export function initSentry(): void {
  if (!config.sentry.enabled || !config.sentry.dsn) {
    logger.info('Sentry disabled (no DSN configured)');
    return;
  }

  try {
    // Dynamic import to avoid requiring @sentry/node when disabled
    sentryModule = require('@sentry/node');

    sentryModule!.init({
      dsn: config.sentry.dsn,
      environment: config.server.env,
      tracesSampleRate: config.server.env === 'production' ? 0.1 : 1.0,
    });

    logger.info('Sentry initialized');
  } catch (err) {
    logger.warn('Failed to initialize Sentry (module may not be installed)');
    sentryModule = null;
  }
}

export function captureError(
  error: Error | unknown,
  context?: Record<string, string>,
): void {
  if (!sentryModule) return;

  if (context) {
    sentryModule.withScope((scope) => {
      for (const [key, value] of Object.entries(context)) {
        scope.setTag(key, value);
      }
      sentryModule!.captureException(error);
    });
  } else {
    sentryModule.captureException(error);
  }
}

export function setUser(userId: string): void {
  if (!sentryModule) return;
  sentryModule.setUser({ id: userId });
}
