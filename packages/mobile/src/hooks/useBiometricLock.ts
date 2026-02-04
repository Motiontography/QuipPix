import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { authenticateWithBiometrics } from '../services/biometric';
import { t } from '../i18n';

/**
 * Hook that manages biometric lock state.
 * When biometric lock is enabled, requires authentication
 * when the app returns from background.
 */
export function useBiometricLock(): { isLocked: boolean; unlock: () => Promise<void> } {
  const biometricLockEnabled = useAppStore((s) => s.biometricLockEnabled);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!biometricLockEnabled) {
      setIsLocked(false);
      return;
    }

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active' && biometricLockEnabled) {
        setIsLocked(true);
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [biometricLockEnabled]);

  const unlock = async () => {
    const success = await authenticateWithBiometrics(
      t('security.biometricPrompt'),
    );
    if (success) {
      setIsLocked(false);
    }
  };

  return { isLocked, unlock };
}
