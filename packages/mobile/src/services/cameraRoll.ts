import { Platform, PermissionsAndroid } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';

export async function saveToPhotoLibrary(remoteUrl: string): Promise<void> {
  // Request permission on Android < 13
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Save to Photos',
        message: 'QuipPix needs permission to save images to your gallery.',
        buttonPositive: 'Allow',
      },
    );
    // Android 13+ auto-grants; older versions need explicit approval
    if (
      granted !== PermissionsAndroid.RESULTS.GRANTED &&
      granted !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ) {
      throw new Error('Storage permission denied');
    }
  }

  // Download to temp file
  const fileName = `quippix_${Date.now()}.png`;
  const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

  await RNFS.downloadFile({
    fromUrl: remoteUrl,
    toFile: localPath,
  }).promise;

  // Save to camera roll
  await CameraRoll.saveAsset(
    Platform.OS === 'android' ? `file://${localPath}` : localPath,
    { type: 'photo' },
  );

  // Clean up temp file
  await RNFS.unlink(localPath).catch(() => {});
}
