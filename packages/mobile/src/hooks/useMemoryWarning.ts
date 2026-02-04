import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform, NativeEventEmitter, NativeModules } from 'react-native';
import FastImage from 'react-native-fast-image';
import { clearImageCache } from '../services/imageCache';
import { trackEvent } from '../services/analytics';

/**
 * Listens for memory warnings and clears image caches to free memory.
 * On iOS uses didReceiveMemoryWarning, on Android monitors app state.
 */
export function useMemoryWarning(onWarning?: () => void): void {
  useEffect(() => {
    let memoryListener: any;

    if (Platform.OS === 'ios') {
      // iOS sends memory warnings through native events
      try {
        const emitter = new NativeEventEmitter(NativeModules.MemoryWarning);
        memoryListener = emitter.addListener('memoryWarning', () => {
          trackEvent('memory_warning_received');
          FastImage.clearMemoryCache();
          trackEvent('memory_cache_cleared');
          onWarning?.();
        });
      } catch {
        // Module not available, use fallback
      }
    }

    // Fallback: clear memory cache when app goes to background
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'background') {
        FastImage.clearMemoryCache();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      sub.remove();
      memoryListener?.remove?.();
    };
  }, [onWarning]);
}
