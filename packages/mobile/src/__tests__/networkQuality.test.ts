import { getAdaptiveImageQuality, NetworkQuality } from '../hooks/useNetworkQuality';

describe('getAdaptiveImageQuality', () => {
  it('returns high priority and 200px thumbnails for good network', () => {
    const result = getAdaptiveImageQuality('good');
    expect(result).toEqual({ priority: 'high', thumbnailSize: 200 });
  });

  it('returns low priority and 100px thumbnails for slow network', () => {
    const result = getAdaptiveImageQuality('slow');
    expect(result).toEqual({ priority: 'low', thumbnailSize: 100 });
  });

  it('returns low priority and 80px thumbnails for offline', () => {
    const result = getAdaptiveImageQuality('offline');
    expect(result).toEqual({ priority: 'low', thumbnailSize: 80 });
  });
});
