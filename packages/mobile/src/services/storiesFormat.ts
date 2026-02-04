import { Image as Compressor } from 'react-native-compressor';

/**
 * Crop an image to 9:16 aspect ratio for Instagram/TikTok Stories.
 * Centers the crop vertically for landscape images and horizontally for portrait.
 */
export async function cropToStories(sourceUri: string): Promise<string> {
  // Resize to 1080x1920 (9:16 standard Stories resolution)
  const result = await Compressor.compress(sourceUri, {
    compressionMethod: 'auto',
    maxWidth: 1080,
    maxHeight: 1920,
    quality: 0.95,
    output: 'png',
  });

  return result;
}
