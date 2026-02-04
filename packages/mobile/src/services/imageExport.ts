import { Image as Compressor } from 'react-native-compressor';
import { ExportResolution, ExportFormat } from '../types';

const RESOLUTION_MAP: Record<ExportResolution, number> = {
  original: 2048,
  high: 1024,
  medium: 512,
};

export async function processExport(params: {
  sourceUri: string;
  resolution: ExportResolution;
  format: ExportFormat;
  quality: number;
}): Promise<string> {
  const maxWidth = RESOLUTION_MAP[params.resolution];
  const output = params.format === 'jpeg' ? 'jpg' : 'png';

  const result = await Compressor.compress(params.sourceUri, {
    compressionMethod: 'auto',
    maxWidth,
    maxHeight: maxWidth,
    quality: params.format === 'jpeg' ? params.quality : 1,
    output,
  });

  return result;
}
