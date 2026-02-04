import { initDb, closeDb } from '../src/db';
import {
  registerDevice,
  getDevicesByUser,
  getAllDevices,
  removeDevice,
  getDeviceCount,
} from '../src/db/repositories/deviceRepository';
import { z } from 'zod';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

describe('Device Repository', () => {
  it('registers a new device', () => {
    registerDevice({
      deviceId: 'device-1',
      appUserId: 'user-1',
      platform: 'ios',
      pushToken: 'apns-token-abc123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(getDeviceCount()).toBe(1);
  });

  it('upserts existing device with new token', () => {
    registerDevice({
      deviceId: 'device-1',
      appUserId: 'user-1',
      platform: 'ios',
      pushToken: 'apns-token-NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(getDeviceCount()).toBe(1);
    const devices = getDevicesByUser('user-1');
    expect(devices[0].pushToken).toBe('apns-token-NEW');
  });

  it('registers multiple devices for same user', () => {
    registerDevice({
      deviceId: 'device-2',
      appUserId: 'user-1',
      platform: 'android',
      pushToken: 'fcm-token-xyz',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const devices = getDevicesByUser('user-1');
    expect(devices.length).toBe(2);
  });

  it('retrieves devices filtered by user', () => {
    registerDevice({
      deviceId: 'device-3',
      appUserId: 'user-2',
      platform: 'ios',
      pushToken: 'apns-token-other',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const user1Devices = getDevicesByUser('user-1');
    const user2Devices = getDevicesByUser('user-2');
    expect(user1Devices.length).toBe(2);
    expect(user2Devices.length).toBe(1);
  });

  it('returns all devices', () => {
    const all = getAllDevices();
    expect(all.length).toBe(3);
  });

  it('removes a device', () => {
    expect(removeDevice('device-2')).toBe(true);
    expect(getDeviceCount()).toBe(2);
  });

  it('returns false when removing non-existent device', () => {
    expect(removeDevice('nonexistent')).toBe(false);
  });

  it('maps all fields correctly', () => {
    const devices = getDevicesByUser('user-2');
    expect(devices[0]).toMatchObject({
      deviceId: 'device-3',
      appUserId: 'user-2',
      platform: 'ios',
      pushToken: 'apns-token-other',
    });
    expect(devices[0].createdAt).toBeDefined();
    expect(devices[0].updatedAt).toBeDefined();
  });
});

describe('RegisterDevice validation schema', () => {
  const schema = z.object({
    deviceId: z.string().min(1).max(200),
    appUserId: z.string().min(1).max(200),
    platform: z.enum(['ios', 'android']),
    pushToken: z.string().min(1).max(500),
  });

  it('accepts valid input', () => {
    expect(
      schema.safeParse({
        deviceId: 'dev-1',
        appUserId: 'usr-1',
        platform: 'ios',
        pushToken: 'token123',
      }).success,
    ).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(schema.safeParse({}).success).toBe(false);
  });

  it('rejects invalid platform', () => {
    expect(
      schema.safeParse({
        deviceId: 'dev-1',
        appUserId: 'usr-1',
        platform: 'windows',
        pushToken: 'tok',
      }).success,
    ).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(
      schema.safeParse({
        deviceId: '',
        appUserId: 'usr-1',
        platform: 'ios',
        pushToken: 'tok',
      }).success,
    ).toBe(false);
  });
});
