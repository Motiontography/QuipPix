import { Platform, NativeModules } from 'react-native';
import { en, TranslationKey } from './en';

type Translations = Record<string, string>;

const translations: Record<string, Translations> = {
  en,
};

function getDeviceLocale(): string {
  if (Platform.OS === 'ios') {
    return (
      NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
      'en'
    );
  }
  return NativeModules.I18nManager?.localeIdentifier || 'en';
}

const locale = getDeviceLocale().split(/[-_]/)[0];

export function t(
  key: TranslationKey,
  params?: Record<string, string>,
): string {
  const dict = translations[locale] || translations.en;
  let value = dict[key] || en[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, v);
    });
  }

  return value;
}

export function getCurrentLocale(): string {
  return locale;
}

export type { TranslationKey };
