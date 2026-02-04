import { Platform } from 'react-native';

type HapticType =
  | 'success'
  | 'warning'
  | 'error'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection';

/**
 * Trigger haptic feedback. Non-critical — silently fails
 * if the native module isn't linked or device lacks a haptic engine.
 */
export function triggerHaptic(type: HapticType): void {
  try {
    const RNHaptic = require('react-native-haptic-feedback');
    const HAPTIC_MAP: Record<HapticType, string> = {
      success: 'notificationSuccess',
      warning: 'notificationWarning',
      error: 'notificationError',
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy',
      selection: 'selection',
    };

    RNHaptic.default.trigger(HAPTIC_MAP[type], {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  } catch {
    // Silently fail — haptics are non-critical
  }
}
