import { styleRecipes, getRecipe } from '../src/services/styleRecipes';
import { StyleId } from '../src/types';

describe('styleRecipes', () => {
  const allStyleIds: StyleId[] = [
    'caricature-classic',
    'caricature-subtle',
    'caricature-editorial',
    'comic-book',
    'pop-art',
    'pencil-clean',
    'pencil-gritty',
    'watercolor',
    'oil-painting',
    'anime-inspired',
    'cyberpunk-neon',
    'magazine-cover',
    'pro-headshot',
    'dreamy-portrait',
    'editorial-fashion',
  ];

  it('has all required styles', () => {
    expect(Object.keys(styleRecipes)).toHaveLength(allStyleIds.length);
    for (const id of allStyleIds) {
      expect(styleRecipes[id]).toBeDefined();
    }
  });

  it.each(allStyleIds)('recipe %s has all required fields', (styleId) => {
    const recipe = getRecipe(styleId);
    expect(recipe.styleId).toBe(styleId);
    expect(recipe.displayName).toBeTruthy();
    expect(recipe.systemPrompt).toBeTruthy();
    expect(recipe.userPromptTemplate).toBeTruthy();
    expect(recipe.negativeConstraints.length).toBeGreaterThan(0);
    expect(recipe.outputRequirements).toBeDefined();
    expect(recipe.parameterMapping).toBeInstanceOf(Function);
  });

  it('getRecipe throws for unknown style', () => {
    expect(() => getRecipe('nonexistent' as any)).toThrow('Unknown style');
  });
});
