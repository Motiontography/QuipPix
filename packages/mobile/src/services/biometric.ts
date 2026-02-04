import ReactNativeBiometrics from 'react-native-biometrics';
import { trackEvent } from './analytics';

const rnBiometrics = new ReactNativeBiometrics();

export type BiometricType = 'FaceID' | 'TouchID' | 'Biometrics' | null;

/**
 * Check if biometric authentication is available on the device.
 */
export async function isBiometricAvailable(): Promise<{
  available: boolean;
  biometryType: BiometricType;
}> {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return { available, biometryType: biometryType as BiometricType };
  } catch {
    return { available: false, biometryType: null };
  }
}

/**
 * Prompt the user for biometric authentication.
 */
export async function authenticateWithBiometrics(
  promptMessage: string,
): Promise<boolean> {
  try {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Cancel',
    });

    if (success) {
      trackEvent('biometric_auth_success');
    } else {
      trackEvent('biometric_auth_failed');
    }

    return success;
  } catch {
    trackEvent('biometric_auth_failed');
    return false;
  }
}
