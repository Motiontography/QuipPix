import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const fadeTransition: NativeStackNavigationOptions = {
  animation: 'fade',
};

export const slideBottomTransition: NativeStackNavigationOptions = {
  animation: 'slide_from_bottom',
};

export const slideRightTransition: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
};

export const noneTransition: NativeStackNavigationOptions = {
  animation: 'none',
};

export function respectMotion(
  transition: NativeStackNavigationOptions,
  reduceMotion: boolean,
): NativeStackNavigationOptions {
  if (reduceMotion) {
    return noneTransition;
  }
  return transition;
}
