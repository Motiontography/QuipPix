import { t, getCurrentLocale } from '../i18n';
import { en } from '../i18n/en';

describe('i18n', () => {
  it('returns English string for known key', () => {
    expect(t('home.title')).toBe('QuipPix');
    expect(t('gallery.title')).toBe('Gallery');
    expect(t('settings.title')).toBe('Settings');
  });

  it('returns the key itself for unknown key', () => {
    // Cast to any to bypass type checking for testing unknown keys
    expect(t('nonexistent.key' as any)).toBe('nonexistent.key');
  });

  it('getCurrentLocale returns a string', () => {
    const locale = getCurrentLocale();
    expect(typeof locale).toBe('string');
    expect(locale.length).toBeGreaterThan(0);
  });

  it('all keys in en.ts are non-empty strings', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('has at least 130 translation keys', () => {
    expect(Object.keys(en).length).toBeGreaterThanOrEqual(130);
  });

  it('supports parameter substitution', () => {
    expect(t('generating.creatingYour', { styleName: 'Anime' })).toBe('Creating Your Anime');
    expect(t('batchResults.savedMessage', { count: '5' })).toBe('5 images added to your gallery.');
  });
});
