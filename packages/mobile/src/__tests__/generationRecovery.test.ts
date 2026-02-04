import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  savePendingGeneration,
  clearPendingGeneration,
  getPendingGeneration,
  PendingGeneration,
} from '../services/generationRecovery';

const RECOVERY_KEY = '@quippix/pendingGeneration';

function makePending(overrides: Partial<PendingGeneration> = {}): PendingGeneration {
  return {
    jobId: 'job-123',
    imageUri: 'file:///mock/image.jpg',
    params: { style: 'anime', intensity: 50 } as any,
    startedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('generationRecovery', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('savePendingGeneration', () => {
    it('saves generation to AsyncStorage', async () => {
      const pending = makePending();
      await savePendingGeneration(pending);
      const raw = await AsyncStorage.getItem(RECOVERY_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual(pending);
    });
  });

  describe('clearPendingGeneration', () => {
    it('removes saved generation', async () => {
      await savePendingGeneration(makePending());
      await clearPendingGeneration();
      const raw = await AsyncStorage.getItem(RECOVERY_KEY);
      expect(raw).toBeNull();
    });

    it('does not throw if nothing saved', async () => {
      await expect(clearPendingGeneration()).resolves.toBeUndefined();
    });
  });

  describe('getPendingGeneration', () => {
    it('returns saved generation within 10 minutes', async () => {
      const pending = makePending();
      await savePendingGeneration(pending);
      const result = await getPendingGeneration();
      expect(result).toEqual(pending);
    });

    it('returns null when nothing is saved', async () => {
      const result = await getPendingGeneration();
      expect(result).toBeNull();
    });

    it('returns null and clears if generation is older than 10 minutes', async () => {
      const oldDate = new Date(Date.now() - 11 * 60 * 1000).toISOString();
      const pending = makePending({ startedAt: oldDate });
      await savePendingGeneration(pending);

      const result = await getPendingGeneration();
      expect(result).toBeNull();

      // Should have been cleared
      const raw = await AsyncStorage.getItem(RECOVERY_KEY);
      expect(raw).toBeNull();
    });

    it('returns generation that is exactly 9 minutes old', async () => {
      const recentDate = new Date(Date.now() - 9 * 60 * 1000).toISOString();
      const pending = makePending({ startedAt: recentDate });
      await savePendingGeneration(pending);

      const result = await getPendingGeneration();
      expect(result).toEqual(pending);
    });

    it('preserves optional challengeId', async () => {
      const pending = makePending({ challengeId: 'challenge-42' });
      await savePendingGeneration(pending);

      const result = await getPendingGeneration();
      expect(result?.challengeId).toBe('challenge-42');
    });
  });
});
