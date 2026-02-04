import { Platform } from 'react-native';

// Version sourced from package.json at build time
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

export function getAppVersion(): string {
  return APP_VERSION;
}

export function getBuildNumber(): string {
  return BUILD_NUMBER;
}

export function getFullVersionString(): string {
  return `v${APP_VERSION} (${BUILD_NUMBER})`;
}

export function getPlatformString(): string {
  return Platform.OS === 'ios' ? 'iOS' : 'Android';
}
