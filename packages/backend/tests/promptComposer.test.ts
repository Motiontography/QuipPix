import { composePrompt } from '../src/services/promptComposer';

describe('composePrompt', () => {
  const defaultSliders = {
    intensity: 50,
    faceFidelity: 70,
    backgroundStrength: 50,
    colorMood: 'warm' as const,
    detail: 50,
  };

  const defaultToggles = {
    keepIdentity: true,
    preserveSkinTone: true,
  };

  it('composes a caricature prompt', () => {
    const result = composePrompt('caricature-classic', defaultSliders, defaultToggles);
    expect(result.systemPrompt).toContain('expert image transformation');
    expect(result.userPrompt).toContain('caricature');
    expect(result.userPrompt).toContain('Preserve the subject identity');
    expect(result.userPrompt).toContain('skin tone');
  });

  it('includes user free-form prompt', () => {
    const result = composePrompt(
      'caricature-classic',
      defaultSliders,
      defaultToggles,
      'Make me look like a superhero chef',
    );
    expect(result.userPrompt).toContain('superhero chef');
    expect(result.userPrompt).toContain('Additional creative direction');
  });

  it('includes negative constraints', () => {
    const result = composePrompt('comic-book', defaultSliders, defaultToggles);
    expect(result.negativeConstraints).toContain('copyrighted');
  });

  it('maps comic-specific options', () => {
    const result = composePrompt(
      'comic-book',
      defaultSliders,
      defaultToggles,
      undefined,
      { comic: { lineWeight: 80, halftoneAmount: 80 } },
    );
    expect(result.userPrompt).toContain('heavy');
    expect(result.userPrompt).toContain('prominent');
  });

  it('maps magazine-specific options', () => {
    const result = composePrompt(
      'magazine-cover',
      defaultSliders,
      defaultToggles,
      undefined,
      {
        magazine: {
          mastheadText: 'VOGUE TEST',
          coverLines: ['Line One', 'Line Two'],
          issueDate: 'January 2026',
          showBarcode: true,
        },
      },
    );
    expect(result.userPrompt).toContain('VOGUE TEST');
    expect(result.userPrompt).toContain('Line One');
    expect(result.userPrompt).toContain('January 2026');
  });

  it('omits identity clause when toggle off', () => {
    const result = composePrompt(
      'caricature-classic',
      defaultSliders,
      { keepIdentity: false, preserveSkinTone: false },
    );
    expect(result.userPrompt).not.toContain('Preserve the subject identity');
    expect(result.userPrompt).not.toContain('Maintain the subject original skin tone');
  });
});
