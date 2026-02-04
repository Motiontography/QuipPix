import { isBiometricAvailable, authenticateWithBiometrics } from '../services/biometric';
import { trackEvent } from '../services/analytics';

describe('biometric', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBiometricAvailable', () => {
    it('returns availability info', async () => {
      const result = await isBiometricAvailable();
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('biometryType');
      expect(typeof result.available).toBe('boolean');
    });
  });

  describe('authenticateWithBiometrics', () => {
    it('returns true on successful authentication', async () => {
      const result = await authenticateWithBiometrics('Unlock QuipPix');
      expect(result).toBe(true);
    });

    it('tracks success event', async () => {
      await authenticateWithBiometrics('Unlock QuipPix');
      expect(trackEvent).toHaveBeenCalledWith('biometric_auth_success');
    });
  });
});
