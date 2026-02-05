import { CommonSliders, Toggles, StyleSpecificOptions, StyleId, ProSliders } from '../types';
import { getRecipe } from './styleRecipes';

export interface ComposedPrompt {
  systemPrompt: string;
  userPrompt: string;
  negativeConstraints: string;
}

export function composePrompt(
  styleId: StyleId,
  sliders: CommonSliders,
  toggles: Toggles,
  userFreeformPrompt?: string,
  styleOptions?: StyleSpecificOptions,
  proSliders?: ProSliders,
): ComposedPrompt {
  const recipe = getRecipe(styleId);

  // Build parameter map from sliders/toggles/options
  const params = recipe.parameterMapping(sliders, toggles, styleOptions);

  // Interpolate template with parameters
  let filledTemplate = recipe.userPromptTemplate;
  for (const [key, value] of Object.entries(params)) {
    filledTemplate = filledTemplate.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  // Compose final user prompt
  const parts: string[] = [filledTemplate];

  if (userFreeformPrompt?.trim()) {
    parts.push(`\nAdditional creative direction from the user: "${userFreeformPrompt.trim()}"`);
  }

  // Pro slider prompt fragments
  if (proSliders) {
    if (proSliders.microDetail != null && proSliders.microDetail > 0) {
      const intensity = proSliders.microDetail;
      parts.push(
        `\nApply micro-texture detail at ${intensity}% intensity — render ultra-fine skin pores, fabric weave, and hair strand definition.`,
      );
    }
    if (proSliders.studioRelight != null && proSliders.studioRelight > 0) {
      const intensity = proSliders.studioRelight;
      parts.push(
        `\nApply studio relighting at ${intensity}% intensity — add professional three-point lighting with key light, fill light, and rim light for dimensional depth.`,
      );
    }
    if (proSliders.backgroundPro != null && proSliders.backgroundPro > 0) {
      const intensity = proSliders.backgroundPro;
      parts.push(
        `\nApply pro background treatment at ${intensity}% intensity — enhance the background with professional depth-of-field bokeh, subtle environmental storytelling, and refined color grading.`,
      );
    }
  }

  // Negative constraints as a unified block — repeat preservation for emphasis
  const negBlock = recipe.negativeConstraints
    .map((c) => `- ${c}`)
    .join('\n');

  const isGenerative = recipe.outputRequirements.generative === true;

  let userPrompt = parts.join('\n') +
    `\n\nCRITICAL CONSTRAINTS — you MUST follow these:\n${negBlock}`;

  if (isGenerative) {
    // Generative styles add new elements — only restrict watermarks/logos
    userPrompt += `\n- Do not add watermarks or logos`;
  } else {
    // Transformation styles — keep composition and don't add new elements
    userPrompt += `\n- Do not add any text, watermarks, or logos`;
    userPrompt += `\n- Do not introduce new objects or people not in the original photo`;
    userPrompt += `\n- Preserve the original composition and framing`;
  }

  return {
    systemPrompt: recipe.systemPrompt,
    userPrompt,
    negativeConstraints: negBlock,
  };
}
