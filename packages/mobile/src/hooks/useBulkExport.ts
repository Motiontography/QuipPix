import { useState, useCallback } from 'react';
import { processExport } from '../services/imageExport';
import { saveToPhotoLibrary } from '../services/cameraRoll';
import { trackEvent } from '../services/analytics';
import { ExportOptions, GalleryItem } from '../types';

interface BulkExportState {
  exporting: boolean;
  current: number;
  total: number;
  error: string | null;
}

export function useBulkExport() {
  const [state, setState] = useState<BulkExportState>({
    exporting: false,
    current: 0,
    total: 0,
    error: null,
  });

  const exportItems = useCallback(
    async (items: GalleryItem[], options: ExportOptions) => {
      setState({ exporting: true, current: 0, total: items.length, error: null });
      trackEvent('bulk_export_started', { count: items.length });

      let completed = 0;
      let failed = 0;

      for (const item of items) {
        try {
          const processedUri = await processExport({
            sourceUri: item.localUri,
            resolution: options.resolution,
            format: options.format,
            quality: options.quality,
          });
          await saveToPhotoLibrary(processedUri);
          completed++;
        } catch {
          failed++;
        }
        setState((prev) => ({ ...prev, current: prev.current + 1 }));
      }

      trackEvent('bulk_export_completed', {
        total: items.length,
        completed,
        failed,
      });

      setState((prev) => ({
        ...prev,
        exporting: false,
        error: failed > 0 ? `${failed} items failed` : null,
      }));

      return { completed, failed };
    },
    [],
  );

  return { ...state, exportItems };
}
