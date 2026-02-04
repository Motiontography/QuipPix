import { AppState, AppStateStatus } from 'react-native';
import { api } from '../api/client';

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
  | 'share_card_saved'
  | 'remix_created'
  | 'remix_opened'
  | 'remix_photo_selected'
  | 'save_to_photos'
  | 'generation_queued_offline'
  | 'style_favorited'
  | 'style_unfavorited'
  | 'preset_saved'
  | 'preset_loaded'
  | 'preset_deleted'
  | 'undo_used'
  | 'redo_used'
  | 'reset_to_defaults'
  | 'coach_mark_dismissed'
  | 'recreate_from_gallery'
  | 'reduce_motion_toggled'
  | 'gallery_swipe_delete'
  | 'gallery_swipe_favorite'
  | 'gallery_view_mode_changed'
  | 'cache_cleared'
  | 'cache_size_viewed'
  | 'stats_viewed'
  | 'gallery_multiselect_entered'
  | 'gallery_multiselect_delete'
  | 'gallery_multiselect_share'
  | 'gallery_multiselect_collection'
  | 'bottom_sheet_opened'
  | 'bottom_sheet_dismissed'
  | 'export_sheet_opened'
  | 'export_completed'
  | 'generation_retry'
  | 'generation_error'
  | 'generation_max_retries'
  | 'comparison_carousel_viewed'
  | 'comparison_carousel_tapped'
  | 'batch_export_completed';

interface EventPayload {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

let eventQueue: EventPayload[] = [];
let appStateListenerActive = false;

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

export function flushEvents(): void {
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, eventQueue.length);

  if (__DEV__) {
    console.log('[Analytics] Flushing', batch.length, 'events');
  }

  api.sendEvents(batch).catch(() => {
    // Re-queue failed events for retry (cap at 100 to prevent unbounded growth)
    if (eventQueue.length + batch.length <= 100) {
      eventQueue.unshift(...batch);
    }
  });
}

export function initAnalytics(): void {
  if (appStateListenerActive) return;
  appStateListenerActive = true;

  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'background' || state === 'inactive') {
      flushEvents();
    }
  });
}
