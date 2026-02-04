import { Platform } from 'react-native';
import { getStoreUrl, checkForUpdate } from '../services/appUpdate';
import { getAppVersion } from '../services/appInfo';

describe('appUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoreUrl', () => {
    it('returns iOS App Store URL on iOS', () => {
      (Platform as any).OS = 'ios';
      const url = getStoreUrl();
      expect(url).toContain('apps.apple.com');
      expect(url).toContain('quippix');
    });

    it('returns Play Store URL on Android', () => {
      (Platform as any).OS = 'android';
      const url = getStoreUrl();
      expect(url).toContain('play.google.com');
      expect(url).toContain('quippix');
    });
  });

  describe('checkForUpdate', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
      (getAppVersion as jest.Mock).mockReturnValue('1.0.0');
    });

    it('returns updateAvailable true when versions differ', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ latestAppVersion: '2.0.0' }),
      });

      const result = await checkForUpdate();
      expect(result.updateAvailable).toBe(true);
      expect(result.latestVersion).toBe('2.0.0');
      expect(result.updateUrl).toContain('apple.com');
    });

    it('returns updateAvailable false when versions match', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ latestAppVersion: '1.0.0' }),
      });

      const result = await checkForUpdate();
      expect(result.updateAvailable).toBe(false);
    });

    it('returns updateAvailable false on fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkForUpdate();
      expect(result.updateAvailable).toBe(false);
      expect(result.latestVersion).toBeNull();
    });

    it('returns updateAvailable false when no version in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await checkForUpdate();
      expect(result.updateAvailable).toBe(false);
      expect(result.latestVersion).toBeNull();
    });
  });
});
