import FastImage from 'react-native-fast-image';
import { GalleryItem } from '../types';

/**
 * Preloads images for gallery items that are about to scroll into view.
 * Call with the next batch of items based on scroll position.
 */
export function preloadGalleryImages(items: GalleryItem[]): void {
  const sources = items
    .filter((item) => item.localUri)
    .map((item) => ({
      uri: item.localUri,
      priority: FastImage.priority.low,
    }));

  if (sources.length > 0) {
    FastImage.preload(sources);
  }
}

/**
 * Calculate which items to preload based on visible range.
 * Preloads 10 items ahead of the current visible range.
 */
export function getPreloadRange(
  visibleStartIndex: number,
  visibleEndIndex: number,
  totalItems: number,
): { start: number; end: number } {
  const preloadAhead = 10;
  const start = Math.max(0, visibleEndIndex + 1);
  const end = Math.min(totalItems - 1, visibleEndIndex + preloadAhead);
  return { start, end };
}
