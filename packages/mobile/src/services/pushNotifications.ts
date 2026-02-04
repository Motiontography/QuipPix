import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const DEVICE_ID_KEY = '@quippix/device_id';
const NOTIFICATIONS_ENABLED_KEY = '@quippix/notifications_enabled';

function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function registerForPushNotifications(
  appUserId: string,
): Promise<void> {
  const enabled = await requestNotificationPermission();
  if (!enabled) return;

  const token = await messaging().getToken();
  const deviceId = await getOrCreateDeviceId();
  const platform = Platform.OS as 'ios' | 'android';

  await api.registerDevice({ deviceId, appUserId, platform, pushToken: token });
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
}

export async function isNotificationsEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return value === 'true';
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    NOTIFICATIONS_ENABLED_KEY,
    enabled ? 'true' : 'false',
  );
}

export function onNotificationOpened(
  handler: (data: Record<string, string>) => void,
): () => void {
  return messaging().onNotificationOpenedApp((remoteMessage) => {
    if (remoteMessage.data) {
      handler(remoteMessage.data as Record<string, string>);
    }
  });
}

export async function getInitialNotification(): Promise<Record<
  string,
  string
> | null> {
  const remoteMessage = await messaging().getInitialNotification();
  return (remoteMessage?.data as Record<string, string>) ?? null;
}
