import RNFS from 'react-native-fs';

const CACHE_DIR = `${RNFS.DocumentDirectoryPath}/gallery`;

export interface CacheInfo {
  totalSize: number;
  fileCount: number;
  formattedSize: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export async function getCacheInfo(): Promise<CacheInfo> {
  const exists = await RNFS.exists(CACHE_DIR);
  if (!exists) {
    return { totalSize: 0, fileCount: 0, formattedSize: '0 B' };
  }

  const files = await RNFS.readDir(CACHE_DIR);
  let totalSize = 0;
  for (const file of files) {
    if (file.isFile()) {
      totalSize += file.size;
    }
  }

  return {
    totalSize,
    fileCount: files.filter((f: { isFile: () => boolean }) => f.isFile()).length,
    formattedSize: formatBytes(totalSize),
  };
}

export async function clearCache(): Promise<void> {
  const exists = await RNFS.exists(CACHE_DIR);
  if (exists) {
    await RNFS.unlink(CACHE_DIR);
  }
  await RNFS.mkdir(CACHE_DIR);
}
