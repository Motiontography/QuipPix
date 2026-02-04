import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppVersion } from './appInfo';

const REVIEW_LAST_PROMPTED_KEY = '@quippix/review_last_prompted';
const REVIEW_PROMPTED_VERSION_KEY = '@quippix/review_prompted_version';
const MIN_DAYS_BETWEEN_PROMPTS = 30;

export type DelightMoment =
  | 'first_save'
  | 'streak_milestone'
  | 'batch_complete'
  | 'generation_milestone';

/**
 * Prompt for a native in-app review at "delight moments".
 * Rate-limited to once per 30 days and once per app version.
 */
export async function maybePromptReview(
  moment: DelightMoment | number,
): Promise<void> {
  // Legacy signature: called with successfulGenerations count
  if (typeof moment === 'number') {
    if (moment > 0 && moment % 5 === 0) {
      return maybePromptReview('generation_milestone');
    }
    return;
  }

  try {
    // Per-version check
    const version = getAppVersion();
    const promptedVersion = await AsyncStorage.getItem(REVIEW_PROMPTED_VERSION_KEY);
    if (promptedVersion === version) return;

    // Time-based rate limit
    const lastPrompted = await AsyncStorage.getItem(REVIEW_LAST_PROMPTED_KEY);
    if (lastPrompted) {
      const daysSince = (Date.now() - parseInt(lastPrompted, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;
    }

    // Attempt native in-app review
    const InAppReview = require('react-native-in-app-review');
    if (InAppReview.isAvailable()) {
      await InAppReview.RequestInAppReview();
    }

    // Record that we prompted
    await AsyncStorage.setItem(REVIEW_PROMPTED_VERSION_KEY, version);
    await AsyncStorage.setItem(REVIEW_LAST_PROMPTED_KEY, String(Date.now()));
  } catch {
    // Silently fail — review prompts are non-critical
  }
}
