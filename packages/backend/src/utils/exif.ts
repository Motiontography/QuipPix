import sharp from 'sharp';
import { logger } from './logger';

/**
 * Strip all EXIF / metadata from an image buffer.
 * Returns a clean PNG buffer with no embedded metadata.
 */
export async function stripExif(input: Buffer): Promise<Buffer> {
  try {
    const cleaned = await sharp(input)
      .rotate() // Auto-rotate based on EXIF orientation before stripping
      .withMetadata({}) // Remove all metadata
      .png()
      .toBuffer();

    logger.debug(
      { inputSize: input.length, outputSize: cleaned.length },
      'EXIF metadata stripped',
    );

    return cleaned;
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to strip EXIF');
    throw new Error('Invalid image file or unsupported format');
  }
}

/**
 * Validate that a buffer is a supported image type and within size limits.
 */
export async function validateImage(
  input: Buffer,
  maxSizeMb: number = 20,
): Promise<{ width: number; height: number; format: string }> {
  if (input.length > maxSizeMb * 1024 * 1024) {
    throw new Error(`Image exceeds maximum size of ${maxSizeMb}MB`);
  }

  const metadata = await sharp(input).metadata();

  if (!metadata.format || !['jpeg', 'png', 'webp', 'heif'].includes(metadata.format)) {
    throw new Error(`Unsupported image format: ${metadata.format ?? 'unknown'}`);
  }

  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format,
  };
}
