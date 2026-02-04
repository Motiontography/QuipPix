import { Platform, Linking } from 'react-native';
import { getAppVersion } from './appInfo';

const IOS_APP_ID = 'com.motiontography.quippix';
const ANDROID_PACKAGE = 'com.motiontography.quippix';

interface UpdateInfo {
  updateAvailable: boolean;
  latestVersion: string | null;
  updateUrl: string;
}

export function getStoreUrl(): string {
  if (Platform.OS === 'ios') {
    return `https://apps.apple.com/app/${IOS_APP_ID}`;
  }
  return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  const storeUrl = getStoreUrl();
  try {
    // Check the app's own API for version info
    const response = await fetch('https://api.quippix.app/health');
    const data = await response.json();
    const latestVersion = data.latestAppVersion ?? null;
    const currentVersion = getAppVersion();

    if (latestVersion && latestVersion !== currentVersion) {
      return { updateAvailable: true, latestVersion, updateUrl: storeUrl };
    }

    return { updateAvailable: false, latestVersion, updateUrl: storeUrl };
  } catch {
    return { updateAvailable: false, latestVersion: null, updateUrl: storeUrl };
  }
}

export function openStore(): void {
  Linking.openURL(getStoreUrl()).catch(() => {});
}
