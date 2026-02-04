/**
 * Pre-upload image compression using react-native-compressor.
 * Reduces upload size before sending to backend.
 */
export async function compressForUpload(imageUri: string): Promise<string> {
  try {
    const { Image: Compressor } = require('react-native-compressor');
    const compressed = await Compressor.compress(imageUri, {
      compressionMethod: 'auto',
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.8,
    });
    return compressed;
  } catch {
    // Fall back to original if compression fails
    return imageUri;
  }
}
