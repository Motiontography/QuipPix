import { processExport } from '../services/imageExport';
import { Image as Compressor } from 'react-native-compressor';

describe('processExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls Compressor.compress with correct params for JPEG', async () => {
    (Compressor.compress as jest.Mock).mockResolvedValue('/mock/result.jpg');

    const result = await processExport({
      sourceUri: '/mock/source.png',
      resolution: 'high',
      format: 'jpeg',
      quality: 0.8,
    });

    expect(Compressor.compress).toHaveBeenCalledWith('/mock/source.png', {
      compressionMethod: 'auto',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      output: 'jpg',
    });
    expect(result).toBe('/mock/result.jpg');
  });

  it('calls Compressor.compress with quality 1 for PNG', async () => {
    (Compressor.compress as jest.Mock).mockResolvedValue('/mock/result.png');

    await processExport({
      sourceUri: '/mock/source.png',
      resolution: 'medium',
      format: 'png',
      quality: 0.5, // Should be ignored for PNG
    });

    expect(Compressor.compress).toHaveBeenCalledWith('/mock/source.png', {
      compressionMethod: 'auto',
      maxWidth: 512,
      maxHeight: 512,
      quality: 1,
      output: 'png',
    });
  });

  it('uses correct resolution for "original"', async () => {
    (Compressor.compress as jest.Mock).mockResolvedValue('/mock/result.png');

    await processExport({
      sourceUri: '/mock/source.png',
      resolution: 'original',
      format: 'png',
      quality: 1,
    });

    expect(Compressor.compress).toHaveBeenCalledWith(
      '/mock/source.png',
      expect.objectContaining({ maxWidth: 2048, maxHeight: 2048 }),
    );
  });

  it('uses correct resolution for "medium"', async () => {
    (Compressor.compress as jest.Mock).mockResolvedValue('/mock/result.png');

    await processExport({
      sourceUri: '/mock/source.png',
      resolution: 'medium',
      format: 'png',
      quality: 1,
    });

    expect(Compressor.compress).toHaveBeenCalledWith(
      '/mock/source.png',
      expect.objectContaining({ maxWidth: 512, maxHeight: 512 }),
    );
  });
});
