import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { trackEvent } from '../services/analytics';

export type NetworkQuality = 'good' | 'slow' | 'offline';

/**
 * Monitors network quality and provides adaptive behavior hints.
 * - 'good': WiFi or strong cellular (4G/5G)
 * - 'slow': Weak cellular (2G/3G) or unknown
 * - 'offline': No connection
 */
export function useNetworkQuality(): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>('good');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      let newQuality: NetworkQuality;

      if (!state.isConnected) {
        newQuality = 'offline';
      } else if (state.type === 'wifi' || state.type === 'ethernet') {
        newQuality = 'good';
      } else if (state.type === 'cellular') {
        const gen = (state.details as any)?.cellularGeneration;
        newQuality = gen === '2g' || gen === '3g' ? 'slow' : 'good';
      } else {
        newQuality = 'slow';
      }

      if (newQuality !== quality) {
        trackEvent('network_quality_changed', { quality: newQuality });
      }

      setQuality(newQuality);
    });

    return () => unsubscribe();
  }, [quality]);

  return quality;
}

/**
 * Returns image quality settings based on network quality.
 */
export function getAdaptiveImageQuality(quality: NetworkQuality): {
  priority: 'high' | 'normal' | 'low';
  thumbnailSize: number;
} {
  switch (quality) {
    case 'good':
      return { priority: 'high', thumbnailSize: 200 };
    case 'slow':
      return { priority: 'low', thumbnailSize: 100 };
    case 'offline':
      return { priority: 'low', thumbnailSize: 80 };
  }
}
