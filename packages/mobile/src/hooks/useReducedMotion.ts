import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export function useReducedMotion(): boolean {
  const [osReduceMotion, setOsReduceMotion] = useState(false);
  const override = useAppStore((s) => s.reduceMotionOverride);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setOsReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setOsReduceMotion,
    );
    return () => {
      subscription.remove();
    };
  }, []);

  if (override !== null) return override;
  return osReduceMotion;
}
