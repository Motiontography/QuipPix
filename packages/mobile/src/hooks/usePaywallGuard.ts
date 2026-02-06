import { useCallback } from 'react';
import { StyleId } from '../types';

/**
 * All features are now available to everyone.
 * Credits are the only gate (checked at generation time).
 */
export function usePaywallGuard() {
  const guardStyle = useCallback((_styleId: StyleId): boolean => true, []);
  const guardExport = useCallback((_size: string): boolean => true, []);
  const guardSlider = useCallback((_name: string): boolean => true, []);
  const guardBatch = useCallback((): boolean => true, []);

  return { isPro: true, guardStyle, guardExport, guardSlider, guardBatch };
}
