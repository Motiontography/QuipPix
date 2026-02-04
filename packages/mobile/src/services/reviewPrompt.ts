import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppVersion } from './appInfo';

const REVIEW_PROMPTED_KEY = '@quippix/review_prompted_version';
const REVIEW_THRESHOLD = 5;

export async function maybePromptReview(
  successfulGenerations: number,
): Promise<void> {
  if (successfulGenerations < REVIEW_THRESHOLD) return;
  if (successfulGenerations % REVIEW_THRESHOLD !== 0) return;

  const version = getAppVersion();
  const prompted = await AsyncStorage.getItem(REVIEW_PROMPTED_KEY);
  if (prompted === version) return;

  await AsyncStorage.setItem(REVIEW_PROMPTED_KEY, version);

  if (Platform.OS === 'ios') {
    // Use the native StoreKit review API via the Linking module
    // Replace YOUR_APP_STORE_ID with actual App Store ID when available
    Linking.openURL(
      'itms-apps://itunes.apple.com/app/idYOUR_APP_STORE_ID?action=write-review',
    ).catch(() => {});
  } else {
    // Open Play Store listing for review
    Linking.openURL(
      'market://details?id=com.quippix.app',
    ).catch(() => {});
  }
}
