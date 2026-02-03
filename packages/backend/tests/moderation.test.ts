import { moderatePrompt, checkProviderFlags } from '../src/services/moderation';

describe('moderatePrompt', () => {
  it('allows clean prompts', () => {
    const result = moderatePrompt('Create a caricature of me as a chef');
    expect(result.allowed).toBe(true);
  });

  it('blocks NSFW content', () => {
    const result = moderatePrompt('Make this photo nsfw');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.safeAlternative).toBeDefined();
  });

  it('blocks violence keywords', () => {
    const result = moderatePrompt('Add extreme violence to this image');
    expect(result.allowed).toBe(false);
  });

  it('blocks hate speech references', () => {
    const result = moderatePrompt('Turn this into hateful propaganda');
    expect(result.allowed).toBe(false);
  });

  it('allows artistic style prompts', () => {
    const result = moderatePrompt(
      'Create a caricature of me and my job based on everything you know about me',
    );
    expect(result.allowed).toBe(true);
  });
});

describe('checkProviderFlags', () => {
  it('passes when not flagged', () => {
    const result = checkProviderFlags({ flagged: false, categories: [] });
    expect(result.allowed).toBe(true);
  });

  it('blocks when flagged', () => {
    const result = checkProviderFlags({
      flagged: true,
      categories: ['violence'],
      message: 'Content flagged',
    });
    expect(result.allowed).toBe(false);
  });
});
