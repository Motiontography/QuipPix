import { preloadGalleryImages, getPreloadRange } from '../services/imagePreloader';
import FastImage from 'react-native-fast-image';

describe('imagePreloader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('preloadGalleryImages', () => {
    it('calls FastImage.preload with items that have localUri', () => {
      const items = [
        { id: '1', localUri: '/path/a.png' },
        { id: '2', localUri: '/path/b.png' },
      ] as any[];

      preloadGalleryImages(items);

      expect(FastImage.preload).toHaveBeenCalledWith([
        { uri: '/path/a.png', priority: 'low' },
        { uri: '/path/b.png', priority: 'low' },
      ]);
    });

    it('filters out items without localUri', () => {
      const items = [
        { id: '1', localUri: '/path/a.png' },
        { id: '2', localUri: undefined },
        { id: '3', localUri: '' },
      ] as any[];

      preloadGalleryImages(items);

      expect(FastImage.preload).toHaveBeenCalledWith([
        { uri: '/path/a.png', priority: 'low' },
      ]);
    });

    it('does not call preload if no valid items', () => {
      const items = [{ id: '1', localUri: undefined }] as any[];
      preloadGalleryImages(items);
      expect(FastImage.preload).not.toHaveBeenCalled();
    });

    it('does not call preload for empty array', () => {
      preloadGalleryImages([]);
      expect(FastImage.preload).not.toHaveBeenCalled();
    });
  });

  describe('getPreloadRange', () => {
    it('returns range 10 items ahead of visible end', () => {
      const result = getPreloadRange(0, 5, 100);
      expect(result).toEqual({ start: 6, end: 15 });
    });

    it('clamps end to totalItems - 1', () => {
      const result = getPreloadRange(0, 5, 10);
      expect(result).toEqual({ start: 6, end: 9 });
    });

    it('returns start > end when at the end of the list', () => {
      const result = getPreloadRange(90, 99, 100);
      expect(result.start).toBe(100);
      expect(result.end).toBe(99);
    });

    it('handles single item list', () => {
      const result = getPreloadRange(0, 0, 1);
      expect(result).toEqual({ start: 1, end: 0 });
    });

    it('handles visible range in the middle', () => {
      const result = getPreloadRange(20, 30, 200);
      expect(result).toEqual({ start: 31, end: 40 });
    });
  });
});
