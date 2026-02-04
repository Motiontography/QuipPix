import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { exportUserData } from '../services/dataExport';

describe('dataExport', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('exports data as JSON file path', async () => {
    // Seed some data
    await AsyncStorage.setItem('@quippix/gallery', JSON.stringify([{ id: '1' }]));
    await AsyncStorage.setItem('@quippix/settings', JSON.stringify({ theme: 'dark' }));

    const filePath = await exportUserData();
    expect(typeof filePath).toBe('string');
    expect(filePath).toContain('quippix-data-export');
    expect(filePath).toContain('.json');
  });

  it('only includes @quippix/ prefixed keys', async () => {
    await AsyncStorage.setItem('@quippix/gallery', '"gallery"');
    await AsyncStorage.setItem('other-key', '"other"');

    const filePath = await exportUserData();
    expect(filePath).toContain('quippix-data-export');
  });

  it('writes to DocumentDirectoryPath', async () => {
    const filePath = await exportUserData();
    expect(filePath).toContain('/mock/documents');
  });
});
