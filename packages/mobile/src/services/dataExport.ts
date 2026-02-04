import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { trackEvent } from './analytics';

/**
 * Export all user data as a JSON file for GDPR compliance.
 * Includes gallery metadata, settings, preferences, and history.
 */
export async function exportUserData(): Promise<string> {
  trackEvent('data_export_requested');

  const keys = await AsyncStorage.getAllKeys();
  const quippixKeys = keys.filter((k) => k.startsWith('@quippix/'));
  const pairs = await AsyncStorage.multiGet(quippixKeys);

  const data: Record<string, any> = {};
  for (const [key, value] of pairs) {
    try {
      data[key] = value ? JSON.parse(value) : null;
    } catch {
      data[key] = value;
    }
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    platform: 'mobile',
    data,
  };

  const fileName = `quippix-data-export-${Date.now()}.json`;
  const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

  await RNFS.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');

  trackEvent('data_export_completed');
  return filePath;
}

/**
 * Export and share the data file.
 */
export async function exportAndShareData(): Promise<string> {
  const filePath = await exportUserData();

  try {
    await Share.open({
      url: `file://${filePath}`,
      type: 'application/json',
      title: 'QuipPix Data Export',
    });
  } catch {
    // User cancelled share — file is still saved
  }

  return filePath;
}
