import { getDb } from '../index';

export interface DeviceToken {
  deviceId: string;
  appUserId: string;
  platform: 'ios' | 'android';
  pushToken: string;
  createdAt: string;
  updatedAt: string;
}

export function registerDevice(device: DeviceToken): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO device_tokens (device_id, app_user_id, platform, push_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(device_id) DO UPDATE SET
       push_token = excluded.push_token,
       app_user_id = excluded.app_user_id,
       updated_at = excluded.updated_at`,
  ).run(
    device.deviceId,
    device.appUserId,
    device.platform,
    device.pushToken,
    device.createdAt,
    device.updatedAt,
  );
}

export function getDevicesByUser(appUserId: string): DeviceToken[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM device_tokens WHERE app_user_id = ?')
    .all(appUserId) as any[];
  return rows.map(mapRow);
}

export function getAllDevices(): DeviceToken[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM device_tokens').all() as any[];
  return rows.map(mapRow);
}

export function removeDevice(deviceId: string): boolean {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM device_tokens WHERE device_id = ?')
    .run(deviceId);
  return result.changes > 0;
}

export function getDeviceCount(): number {
  const db = getDb();
  const row = db
    .prepare('SELECT COUNT(*) as count FROM device_tokens')
    .get() as { count: number };
  return row.count;
}

function mapRow(row: any): DeviceToken {
  return {
    deviceId: row.device_id,
    appUserId: row.app_user_id,
    platform: row.platform,
    pushToken: row.push_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
