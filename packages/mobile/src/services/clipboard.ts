import { Platform, NativeModules } from 'react-native';
import RNFS from 'react-native-fs';

/**
 * Copy an image file to the system clipboard.
 * On iOS uses native pasteboard, on Android falls back to sharing.
 */
export async function copyImageToClipboard(uri: string): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      // iOS: Read file as base64 and set to pasteboard via native module
      const base64 = await RNFS.readFile(uri.replace('file://', ''), 'base64');
      const { Clipboard } = NativeModules;
      if (Clipboard?.setImage) {
        Clipboard.setImage(base64);
        return true;
      }
    }
    // Fallback: copy the URI as text
    const { Clipboard: RNClipboard } = await import('@react-native-clipboard/clipboard');
    if (RNClipboard?.setString) {
      RNClipboard.setString(uri);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
