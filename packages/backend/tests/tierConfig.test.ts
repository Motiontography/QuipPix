import {
  FREE_STYLES,
  PRO_ONLY_STYLES,
  isStyleAllowed,
  isSizeAllowed,
} from '../src/services/tierConfig';

describe('tierConfig', () => {
  describe('style sets', () => {
    it('defines 6 free styles', () => {
      expect(FREE_STYLES).toHaveLength(6);
    });

    it('defines 9 pro-only styles', () => {
      expect(PRO_ONLY_STYLES).toHaveLength(9);
    });

    it('free and pro styles do not overlap', () => {
      const overlap = FREE_STYLES.filter((s) => PRO_ONLY_STYLES.includes(s));
      expect(overlap).toHaveLength(0);
    });

    it('all 15 styles are covered', () => {
      expect(FREE_STYLES.length + PRO_ONLY_STYLES.length).toBe(15);
    });
  });

  describe('isStyleAllowed', () => {
    it('allows free styles for free tier', () => {
      for (const style of FREE_STYLES) {
        expect(isStyleAllowed(style, 'free')).toBe(true);
      }
    });

    it('blocks pro styles for free tier', () => {
      for (const style of PRO_ONLY_STYLES) {
        expect(isStyleAllowed(style, 'free')).toBe(false);
      }
    });

    it('allows all styles for pro tier', () => {
      for (const style of [...FREE_STYLES, ...PRO_ONLY_STYLES]) {
        expect(isStyleAllowed(style, 'pro')).toBe(true);
      }
    });
  });

  describe('isSizeAllowed', () => {
    it('allows standard sizes for free tier', () => {
      expect(isSizeAllowed('1024x1024', 'free')).toBe(true);
      expect(isSizeAllowed('1024x1792', 'free')).toBe(true);
      expect(isSizeAllowed('1792x1024', 'free')).toBe(true);
    });

    it('blocks high-res sizes for free tier', () => {
      expect(isSizeAllowed('2048x2048', 'free')).toBe(false);
      expect(isSizeAllowed('2048x3584', 'free')).toBe(false);
      expect(isSizeAllowed('3584x2048', 'free')).toBe(false);
      expect(isSizeAllowed('4096x4096', 'free')).toBe(false);
    });

    it('allows all sizes for pro tier', () => {
      expect(isSizeAllowed('1024x1024', 'pro')).toBe(true);
      expect(isSizeAllowed('2048x2048', 'pro')).toBe(true);
      expect(isSizeAllowed('4096x4096', 'pro')).toBe(true);
    });
  });
});
