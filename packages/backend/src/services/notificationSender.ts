import { logger } from '../utils/logger';
import { getAllDevices, getDevicesByUser, DeviceToken } from '../db/repositories/deviceRepository';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendNotificationToAll(
  payload: NotificationPayload,
): Promise<number> {
  const devices = getAllDevices();

  logger.info(
    { title: payload.title, deviceCount: devices.length },
    'PLACEHOLDER: Would send push notification to all devices',
  );

  // TODO: Implement actual APNs (node-apn) and FCM (firebase-admin) sending
  return devices.length;
}

export async function sendNotificationToUser(
  appUserId: string,
  payload: NotificationPayload,
): Promise<number> {
  const devices = getDevicesByUser(appUserId);

  logger.info(
    { appUserId, title: payload.title, deviceCount: devices.length },
    'PLACEHOLDER: Would send push notification to user devices',
  );

  return devices.length;
}
