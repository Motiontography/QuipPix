import RNFS from 'react-native-fs';

const CACHE_DIR = `${RNFS.DocumentDirectoryPath}/gallery`;

async function ensureCacheDir(): Promise<void> {
  const exists = await RNFS.exists(CACHE_DIR);
  if (!exists) {
    await RNFS.mkdir(CACHE_DIR);
  }
}

export async function cacheImage(
  remoteUrl: string,
  itemId: string,
): Promise<string> {
  await ensureCacheDir();
  const localPath = `${CACHE_DIR}/${itemId}.png`;
  const { promise } = RNFS.downloadFile({
    fromUrl: remoteUrl,
    toFile: localPath,
  });
  await promise;
  return localPath;
}

export async function deleteCachedImage(itemId: string): Promise<void> {
  const localPath = `${CACHE_DIR}/${itemId}.png`;
  const exists = await RNFS.exists(localPath);
  if (exists) {
    await RNFS.unlink(localPath);
  }
}

export async function clearImageCache(): Promise<void> {
  const exists = await RNFS.exists(CACHE_DIR);
  if (exists) {
    await RNFS.unlink(CACHE_DIR);
  }
}
