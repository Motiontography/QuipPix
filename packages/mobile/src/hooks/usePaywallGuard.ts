import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, StyleId } from '../types';
import { useProStore } from '../store/useProStore';
import { isProStyle, isProSize } from '../services/tierConfig';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function usePaywallGuard() {
  const navigation = useNavigation<Nav>();
  const entitlement = useProStore((s) => s.entitlement);
  const isPro = entitlement.proActive;

  const guardStyle = useCallback(
    (styleId: StyleId): boolean => {
      if (isPro || !isProStyle(styleId)) return true;
      navigation.navigate('Paywall', { trigger: 'style_select', context: styleId });
      return false;
    },
    [isPro, navigation],
  );

  const guardExport = useCallback(
    (size: string): boolean => {
      if (isPro || !isProSize(size)) return true;
      navigation.navigate('Paywall', { trigger: 'export_size', context: size });
      return false;
    },
    [isPro, navigation],
  );

  const guardSlider = useCallback(
    (name: string): boolean => {
      if (isPro) return true;
      navigation.navigate('Paywall', { trigger: 'pro_slider', context: name });
      return false;
    },
    [isPro, navigation],
  );

  const guardBatch = useCallback((): boolean => {
    if (isPro) return true;
    navigation.navigate('Paywall', { trigger: 'batch_process' });
    return false;
  }, [isPro, navigation]);

  return { isPro, guardStyle, guardExport, guardSlider, guardBatch };
}
