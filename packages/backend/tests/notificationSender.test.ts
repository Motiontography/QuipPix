import { initDb, closeDb } from '../src/db';
import { registerDevice, getDeviceCount } from '../src/db/repositories/deviceRepository';

// Mock firebase-admin before importing sender
const mockSendEachForMulticast = jest.fn();

jest.mock('../src/services/firebaseAdmin', () => ({
  getMessaging: () => ({
    sendEachForMulticast: mockSendEachForMulticast,
  }),
}));

// Mock config to control firebase.enabled
jest.mock('../src/config', () => ({
  config: {
    firebase: { enabled: true, serviceAccountPath: undefined },
    server: { env: 'test' },
  },
}));

import {
  sendNotificationToAll,
  sendNotificationToUser,
} from '../src/services/notificationSender';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  mockSendEachForMulticast.mockReset();
});

function addDevice(deviceId: string, appUserId: string, pushToken: string) {
  registerDevice({
    deviceId,
    appUserId,
    platform: 'ios',
    pushToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

describe('Notification Sender', () => {
  it('sends to all devices and returns success count', async () => {
    addDevice('ns-d1', 'ns-user1', 'token-a');
    addDevice('ns-d2', 'ns-user1', 'token-b');
    addDevice('ns-d3', 'ns-user2', 'token-c');

    mockSendEachForMulticast.mockResolvedValue({
      successCount: 3,
      failureCount: 0,
      responses: [
        { success: true },
        { success: true },
        { success: true },
      ],
    });

    const sent = await sendNotificationToAll({
      title: 'Test',
      body: 'Hello everyone',
    });

    expect(sent).toBe(3);
    expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(mockSendEachForMulticast).toHaveBeenCalledWith({
      tokens: expect.arrayContaining(['token-a', 'token-b', 'token-c']),
      notification: { title: 'Test', body: 'Hello everyone' },
      data: undefined,
    });
  });

  it('sends only to specific user devices', async () => {
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [
        { success: true },
        { success: true },
      ],
    });

    const sent = await sendNotificationToUser('ns-user1', {
      title: 'For you',
      body: 'Personal notification',
      data: { type: 'challenge' },
    });

    expect(sent).toBe(2);
    expect(mockSendEachForMulticast).toHaveBeenCalledWith({
      tokens: ['token-a', 'token-b'],
      notification: { title: 'For you', body: 'Personal notification' },
      data: { type: 'challenge' },
    });
  });

  it('removes devices with invalid tokens', async () => {
    addDevice('ns-invalid', 'ns-user3', 'bad-token');
    const countBefore = getDeviceCount();

    mockSendEachForMulticast.mockResolvedValue({
      successCount: 0,
      failureCount: 1,
      responses: [
        {
          success: false,
          error: { code: 'messaging/registration-token-not-registered' },
        },
      ],
    });

    await sendNotificationToUser('ns-user3', {
      title: 'Test',
      body: 'Cleanup test',
    });

    expect(getDeviceCount()).toBe(countBefore - 1);
  });

  it('handles empty device list gracefully', async () => {
    const sent = await sendNotificationToUser('nonexistent-user', {
      title: 'Nobody',
      body: 'No devices',
    });

    expect(sent).toBe(0);
    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
  });

  it('passes data payload through', async () => {
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }],
    });

    await sendNotificationToUser('ns-user2', {
      title: 'Challenge',
      body: 'New challenge!',
      data: { challengeId: 'ch-42', type: 'daily_challenge' },
    });

    expect(mockSendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { challengeId: 'ch-42', type: 'daily_challenge' },
      }),
    );
  });
});

describe('Notification Sender (disabled)', () => {
  it('returns 0 when firebase is disabled', async () => {
    // Temporarily override config
    const configModule = require('../src/config');
    const original = configModule.config.firebase.enabled;
    configModule.config.firebase.enabled = false;

    const sent = await sendNotificationToAll({
      title: 'Disabled',
      body: 'Should not send',
    });

    expect(sent).toBe(0);
    expect(mockSendEachForMulticast).not.toHaveBeenCalled();

    configModule.config.firebase.enabled = original;
  });
});
