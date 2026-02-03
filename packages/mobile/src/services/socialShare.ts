import { Linking, Alert, Platform } from 'react-native';
import Share from 'react-native-share';
import Clipboard from '@react-native-clipboard/clipboard';

export type SocialPlatform =
  | 'instagram-story'
  | 'instagram-feed'
  | 'tiktok'
  | 'facebook'
  | 'twitter'
  | 'snapchat';

export interface PlatformConfig {
  id: SocialPlatform;
  label: string;
  icon: string;
  targetWidth: number;
  targetHeight: number;
  urlScheme: string;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'instagram-story',
    label: 'IG Story',
    icon: '📷',
    targetWidth: 1080,
    targetHeight: 1920,
    urlScheme: 'instagram-stories://',
  },
  {
    id: 'instagram-feed',
    label: 'IG Feed',
    icon: '📸',
    targetWidth: 1080,
    targetHeight: 1350,
    urlScheme: 'instagram://',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    targetWidth: 1080,
    targetHeight: 1920,
    urlScheme: 'snssdk1233://',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: '👤',
    targetWidth: 1200,
    targetHeight: 630,
    urlScheme: 'fb://',
  },
  {
    id: 'twitter',
    label: 'X',
    icon: '🐦',
    targetWidth: 1200,
    targetHeight: 675,
    urlScheme: 'twitter://',
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    icon: '👻',
    targetWidth: 1080,
    targetHeight: 1920,
    urlScheme: 'snapchat://',
  },
];

export async function isAppInstalled(platform: PlatformConfig): Promise<boolean> {
  try {
    return await Linking.canOpenURL(platform.urlScheme);
  } catch {
    return false;
  }
}

export async function resizeForPlatform(
  imageUri: string,
  _platform: PlatformConfig,
): Promise<string> {
  // Uses react-native-compressor if available, otherwise returns original
  try {
    const { Image: Compressor } = require('react-native-compressor');
    const resized = await Compressor.compress(imageUri, {
      compressionMethod: 'auto',
      quality: 0.9,
    });
    return resized;
  } catch {
    return imageUri;
  }
}

export async function shareToPlatform(
  imageUri: string,
  platform: PlatformConfig,
  caption: string = 'Made with QuipPix',
  _includeFrame: boolean = false,
): Promise<void> {
  const resizedUri = await resizeForPlatform(imageUri, platform);

  try {
    switch (platform.id) {
      case 'instagram-story':
        await Share.shareSingle({
          social: Share.Social.INSTAGRAM_STORIES as any,
          backgroundImage: resizedUri,
          appId: '', // Facebook App ID if available
        });
        break;

      case 'instagram-feed':
        // Instagram feed sharing via share sheet
        Clipboard.setString(caption);
        await Share.shareSingle({
          social: Share.Social.INSTAGRAM as any,
          url: resizedUri,
        });
        Alert.alert('Caption Copied', 'Your caption has been copied to the clipboard. Paste it in Instagram!');
        break;

      case 'facebook':
        await Share.shareSingle({
          social: Share.Social.FACEBOOK as any,
          url: resizedUri,
          message: caption,
        });
        break;

      case 'twitter':
        await Share.shareSingle({
          social: Share.Social.TWITTER as any,
          url: resizedUri,
          message: caption,
        });
        break;

      default:
        // Fallback: general share with clipboard caption
        Clipboard.setString(caption);
        await Share.open({
          url: resizedUri,
          title: caption,
          message: caption,
        });
        Alert.alert('Caption Copied', 'Your caption has been copied to the clipboard.');
        break;
    }
  } catch (err: any) {
    if (!err.message?.includes('User did not share')) {
      // Fallback to general share
      Clipboard.setString(caption);
      try {
        await Share.open({
          url: resizedUri,
          title: caption,
          message: caption,
        });
      } catch {
        // User cancelled
      }
    }
  }
}
