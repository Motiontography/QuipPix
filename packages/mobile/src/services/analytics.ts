type AnalyticsEvent =
  | 'paywall_shown'
  | 'paywall_converted'
  | 'paywall_dismissed'
  | 'share_clicked'
  | 'post_platform_selected'
  | 'generation_completed'
  | 'daily_limit_reached';

interface EventPayload {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

const eventQueue: EventPayload[] = [];

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  const payload: EventPayload = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  };

  eventQueue.push(payload);

  if (__DEV__) {
    console.log('[Analytics]', event, properties ?? '');
  }

  // Flush when queue reaches threshold
  if (eventQueue.length >= 10) {
    flushEvents();
  }
}

function flushEvents(): void {
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, eventQueue.length);

  if (__DEV__) {
    console.log('[Analytics] Flushing', batch.length, 'events');
  }

  // Stub: replace with actual API endpoint later
  // fetch(`${API_BASE}/analytics`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ events: batch }),
  // }).catch(() => {});
}
