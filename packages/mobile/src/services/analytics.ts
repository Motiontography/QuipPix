type AnalyticsEvent =
  | 'paywall_shown'
  | 'paywall_converted'
  | 'paywall_dismissed'
  | 'share_clicked'
  | 'post_platform_selected'
  | 'generation_completed'
  | 'daily_limit_reached'
  | 'batch_started'
  | 'batch_completed'
  | 'batch_partial_failure'
  | 'batch_save_all'
  | 'batch_share_all'
  | 'challenge_accepted'
  | 'challenge_completed'
  | 'challenge_shared'
  | 'challenge_streak_updated'
  | 'share_card_opened'
  | 'share_card_template_selected'
  | 'share_card_shared'
  | 'share_card_saved';

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
