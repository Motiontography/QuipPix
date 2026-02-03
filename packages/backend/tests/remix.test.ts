import { RemixTemplateSchema } from '../src/types';
import { createRemixRecord, getRemixRecord, getRemixStoreSize } from '../src/routes/remix';

describe('Remix System', () => {
  describe('RemixTemplateSchema', () => {
    it('parses valid template', () => {
      const result = RemixTemplateSchema.safeParse({
        styleId: 'comic-book',
        sliders: { intensity: 80, faceFidelity: 60, backgroundStrength: 40, colorMood: 'warm', detail: 50 },
        toggles: { keepIdentity: true, preserveSkinTone: false },
      });
      expect(result.success).toBe(true);
    });

    it('applies defaults for missing sliders', () => {
      const result = RemixTemplateSchema.parse({
        styleId: 'watercolor',
      });
      expect(result.sliders.intensity).toBe(50);
      expect(result.sliders.faceFidelity).toBe(70);
      expect(result.toggles.keepIdentity).toBe(true);
    });

    it('rejects invalid styleId', () => {
      const result = RemixTemplateSchema.safeParse({
        styleId: 'not-a-style',
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional creatorName', () => {
      const result = RemixTemplateSchema.parse({
        styleId: 'pop-art',
        creatorName: 'TestUser',
      });
      expect(result.creatorName).toBe('TestUser');
    });

    it('rejects creatorName over 50 chars', () => {
      const result = RemixTemplateSchema.safeParse({
        styleId: 'pop-art',
        creatorName: 'a'.repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Remix store', () => {
    it('creates and retrieves a remix record', () => {
      const record = createRemixRecord({
        styleId: 'anime-inspired',
        sliders: { intensity: 50, faceFidelity: 70, backgroundStrength: 50, colorMood: 'warm', detail: 50 },
        toggles: { keepIdentity: true, preserveSkinTone: true },
      });

      expect(record.code).toBeDefined();
      expect(record.code.length).toBeGreaterThanOrEqual(4);
      expect(record.template.styleId).toBe('anime-inspired');
      expect(record.views).toBe(0);

      const retrieved = getRemixRecord(record.code);
      expect(retrieved).toBeDefined();
      expect(retrieved!.template.styleId).toBe('anime-inspired');
    });

    it('returns undefined for unknown code', () => {
      const result = getRemixRecord('NONEXISTENT');
      expect(result).toBeUndefined();
    });

    it('generates unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const record = createRemixRecord({
          styleId: 'pop-art',
          sliders: { intensity: 50, faceFidelity: 70, backgroundStrength: 50, colorMood: 'warm', detail: 50 },
          toggles: { keepIdentity: true, preserveSkinTone: true },
        });
        codes.add(record.code);
      }
      expect(codes.size).toBe(20);
    });

    it('increments store size on creation', () => {
      const before = getRemixStoreSize();
      createRemixRecord({
        styleId: 'oil-painting',
        sliders: { intensity: 50, faceFidelity: 70, backgroundStrength: 50, colorMood: 'cool', detail: 50 },
        toggles: { keepIdentity: true, preserveSkinTone: true },
      });
      expect(getRemixStoreSize()).toBe(before + 1);
    });
  });

  describe('Remix code validation rules', () => {
    it('code should only contain URL-safe characters', () => {
      const record = createRemixRecord({
        styleId: 'pencil-clean',
        sliders: { intensity: 50, faceFidelity: 70, backgroundStrength: 50, colorMood: 'warm', detail: 50 },
        toggles: { keepIdentity: true, preserveSkinTone: true },
      });
      expect(record.code).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('code should avoid ambiguous characters (0, O, l, I, 1)', () => {
      // Generate many codes and verify none contain ambiguous chars
      for (let i = 0; i < 50; i++) {
        const record = createRemixRecord({
          styleId: 'watercolor',
          sliders: { intensity: 50, faceFidelity: 70, backgroundStrength: 50, colorMood: 'warm', detail: 50 },
          toggles: { keepIdentity: true, preserveSkinTone: true },
        });
        expect(record.code).not.toMatch(/[0O1lI]/);
      }
    });
  });
});
