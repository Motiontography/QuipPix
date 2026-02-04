/**
 * Error reporting abstraction.
 *
 * Currently logs to console. To integrate Sentry, install @sentry/react-native,
 * run the native setup (pod install, etc.), and replace the implementations below.
 * All call sites remain unchanged.
 */

let initialized = false;

export function initErrorReporting(): void {
  if (initialized) return;
  initialized = true;

  // When @sentry/react-native is installed:
  // Sentry.init({ dsn: 'YOUR_DSN' });

  if (__DEV__) {
    console.log('[ErrorReporting] Initialized (console-only mode)');
  }
}

export function captureError(
  error: Error | unknown,
  context?: Record<string, string>,
): void {
  // When @sentry/react-native is installed:
  // Sentry.captureException(error, { extra: context });

  if (__DEV__) {
    console.error('[ErrorReporting]', error, context ?? '');
  }
}

export function setUser(userId: string): void {
  // When @sentry/react-native is installed:
  // Sentry.setUser({ id: userId });

  if (__DEV__) {
    console.log('[ErrorReporting] User set:', userId);
  }
}
