import { config } from '../config';
import { logger } from '../utils/logger';
import { getAllDevices, getDevicesByUser, removeDevice } from '../db/repositories/deviceRepository';
import { getMessaging } from './firebaseAdmin';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

const BATCH_SIZE = 500;
const INVALID_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
];

async function sendToTokens(
  tokens: { token: string; deviceId: string }[],
  payload: NotificationPayload,
): Promise<number> {
  if (!config.firebase.enabled || tokens.length === 0) {
    logger.info(
      { count: tokens.length, enabled: config.firebase.enabled },
      'Firebase disabled or no tokens, skipping send',
    );
    return 0;
  }

  const messaging = getMessaging();
  let successCount = 0;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const chunk = tokens.slice(i, i + BATCH_SIZE);

    const response = await messaging.sendEachForMulticast({
      tokens: chunk.map((t) => t.token),
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });

    successCount += response.successCount;

    response.responses.forEach((resp, idx) => {
      if (resp.error && INVALID_TOKEN_CODES.includes(resp.error.code)) {
        const deviceId = chunk[idx].deviceId;
        logger.info({ deviceId, error: resp.error.code }, 'Removing invalid device token');
        removeDevice(deviceId);
      }
    });
  }

  return successCount;
}

export async function sendNotificationToAll(
  payload: NotificationPayload,
): Promise<number> {
  const devices = getAllDevices();
  const tokens = devices.map((d) => ({ token: d.pushToken, deviceId: d.deviceId }));
  const sent = await sendToTokens(tokens, payload);
  logger.info(
    { title: payload.title, total: devices.length, sent },
    'Broadcast notification sent',
  );
  return sent;
}

export async function sendNotificationToUser(
  appUserId: string,
  payload: NotificationPayload,
): Promise<number> {
  const devices = getDevicesByUser(appUserId);
  const tokens = devices.map((d) => ({ token: d.pushToken, deviceId: d.deviceId }));
  const sent = await sendToTokens(tokens, payload);
  logger.info(
    { appUserId, title: payload.title, sent },
    'User notification sent',
  );
  return sent;
}
