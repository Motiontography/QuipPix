import { StyleRecipe, StyleId, CommonSliders, Toggles, StyleSpecificOptions } from '../types';

function intensityWord(v: number): string {
  if (v < 25) return 'subtle';
  if (v < 50) return 'moderate';
  if (v < 75) return 'strong';
  return 'extreme';
}

function detailWord(v: number): string {
  if (v < 30) return 'minimal detail';
  if (v < 60) return 'moderate detail';
  return 'highly detailed';
}

function defaultParamMapping(
  sliders: CommonSliders,
  toggles: Toggles,
): Record<string, string> {
  return {
    INTENSITY: intensityWord(sliders.intensity),
    DETAIL: detailWord(sliders.detail),
    COLOR_MOOD: sliders.colorMood,
    BG_STRENGTH: sliders.backgroundStrength > 50 ? 'prominent background' : 'soft background',
    FACE_FIDELITY: sliders.faceFidelity > 60 ? 'high facial fidelity' : 'stylized facial features',
    KEEP_IDENTITY: toggles.keepIdentity
      ? 'Preserve the subject identity and recognizable facial features exactly.'
      : '',
    PRESERVE_SKIN: toggles.preserveSkinTone
      ? 'Maintain the subject original skin tone precisely; do not lighten, darken, or shift hue.'
      : '',
  };
}

const GLOBAL_SYSTEM = `You are an expert image transformation engine. Transform the provided photograph according to the style instructions. Produce a single high-quality output image. Never add text unless specifically requested. Never produce NSFW, violent, hateful, or illegal content. If the request seems inappropriate, produce a tasteful, safe alternative.`;

export const styleRecipes: Record<StyleId, StyleRecipe> = {
  'caricature-classic': {
    styleId: 'caricature-classic',
    displayName: 'Caricature — Classic',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a classic caricature with {INTENSITY} exaggeration. Use {DETAIL}, {COLOR_MOOD} palette. Enlarge the head proportionally, emphasize distinctive facial features with humorous exaggeration. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'Do not produce offensive stereotypes',
      'Do not distort skin tone',
      'Avoid grotesque or frightening distortions',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'caricature-subtle': {
    styleId: 'caricature-subtle',
    displayName: 'Caricature — Subtle',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a subtle, elegant caricature. Light exaggeration only — keep it flattering. {DETAIL}, {COLOR_MOOD} palette. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No extreme distortion',
      'Keep proportions close to real',
      'Do not add text',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'caricature-editorial': {
    styleId: 'caricature-editorial',
    displayName: 'Caricature — Editorial',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into an editorial-style caricature suitable for a newspaper or magazine illustration. {INTENSITY} stylization. {DETAIL}, {COLOR_MOOD} palette. Clean linework with crosshatching. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No political messaging',
      'No offensive stereotypes',
      'Keep professional and publishable',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'comic-book': {
    styleId: 'comic-book',
    displayName: 'Comic Book',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a comic book panel illustration. Bold ink outlines with {LINE_WEIGHT} line weight. {HALFTONE} halftone dot shading. {INTENSITY} comic stylization. {COLOR_MOOD} palette. {DETAIL}. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No copyrighted character styles (Marvel, DC, etc.)',
      'No speech bubbles unless user requests',
      'No violent imagery',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'medium',
      textLegibility: false,
    },
    parameterMapping: (s, t, opts) => ({
      ...defaultParamMapping(s, t),
      LINE_WEIGHT: (opts?.comic?.lineWeight ?? 50) > 50 ? 'heavy' : 'fine',
      HALFTONE: (opts?.comic?.halftoneAmount ?? 40) > 50 ? 'prominent' : 'light',
    }),
  },

  'pop-art': {
    styleId: 'pop-art',
    displayName: 'Pop Art',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a bold pop art piece inspired by Lichtenstein and Warhol techniques. {INTENSITY} pop art effect. Flat bold colors, Ben-Day dots, strong outlines. {COLOR_MOOD} palette. {DETAIL}. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No direct replication of specific copyrighted artworks',
      'No brand logos',
      'Original composition only',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'medium',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'pencil-clean': {
    styleId: 'pencil-clean',
    displayName: 'Pencil Sketch — Clean',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a clean pencil sketch on white paper. Precise, confident lines. {INTENSITY} sketch effect. {DETAIL}. Light shading, no smudging. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No color (grayscale only)',
      'No heavy cross-hatching',
      'Clean and elegant',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'pencil-gritty': {
    styleId: 'pencil-gritty',
    displayName: 'Pencil Sketch — Gritty',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a gritty, textured pencil sketch on aged paper. Heavy crosshatching, charcoal smudging. {INTENSITY} effect. {DETAIL}. Dramatic shadows. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No color (grayscale/sepia only)',
      'Do not make it too dark to see features',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  watercolor: {
    styleId: 'watercolor',
    displayName: 'Watercolor',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a beautiful watercolor painting. Visible brushstrokes, paint bleeds, and soft edges. {INTENSITY} watercolor effect. {COLOR_MOOD} palette with translucent washes. {DETAIL}. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No sharp digital edges',
      'Avoid muddy color mixing',
      'Keep it luminous',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'medium',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'oil-painting': {
    styleId: 'oil-painting',
    displayName: 'Oil Painting',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a classical oil painting. Rich impasto texture, visible brush strokes, gallery-quality composition. {INTENSITY} oil painting effect. {COLOR_MOOD} palette. {DETAIL}. Dramatic lighting. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No flat digital look',
      'Avoid cartoonish rendering',
      'Keep museum quality',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'anime-inspired': {
    styleId: 'anime-inspired',
    displayName: 'Anime-Inspired',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into an original anime-style illustration. Large expressive eyes, clean lines, vibrant {COLOR_MOOD} palette. {INTENSITY} anime stylization. {DETAIL}. Dynamic pose preserved from source. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No copyrighted franchise styles (Ghibli, Naruto, Dragon Ball, etc.)',
      'Original anime aesthetic only',
      'No sexualized content',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'medium',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'cyberpunk-neon': {
    styleId: 'cyberpunk-neon',
    displayName: 'Cyberpunk Neon',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a cyberpunk neon-lit scene. Neon glows in pink, cyan, and purple. Rain-slicked surfaces reflecting light. {INTENSITY} cyberpunk effect. Futuristic overlays and holographic elements. {DETAIL}. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No copyrighted cyberpunk franchise elements',
      'No weapons',
      'Keep it artistic and atmospheric',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'medium',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'magazine-cover': {
    styleId: 'magazine-cover',
    displayName: 'Magazine Cover',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a professional magazine cover. Place the masthead "{MASTHEAD}" at the top in bold, legible typography. Add cover lines: {COVER_LINES}. Issue date: {ISSUE_DATE}. {BARCODE}. Professional retouching, {COLOR_MOOD} toning. {INTENSITY} magazine polish. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}. CRITICAL: All text must be spelled correctly and perfectly legible.`,
    negativeConstraints: [
      'No garbled or illegible text',
      'No copyrighted magazine mastheads (Vogue, TIME, etc.)',
      'No NSFW content',
      'Text must be clean and readable',
    ],
    outputRequirements: {
      defaultSize: '1024x1792',
      format: 'png',
      identityPriority: 'high',
      textLegibility: true,
    },
    parameterMapping: (s, t, opts) => ({
      ...defaultParamMapping(s, t),
      MASTHEAD: opts?.magazine?.mastheadText ?? 'QUIPPIX',
      COVER_LINES: (opts?.magazine?.coverLines ?? []).map((l, i) => `"${l}"`).join(', ') || '"Style Redefined"',
      ISSUE_DATE: opts?.magazine?.issueDate || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      BARCODE: opts?.magazine?.showBarcode ? 'Include a small barcode in the bottom-right corner.' : '',
    }),
  },

  'pro-headshot': {
    styleId: 'pro-headshot',
    displayName: 'Pro Headshot',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a professional studio headshot. Clean {BACKDROP_COLOR} backdrop with {SOFTNESS} edge softness and {VIGNETTE} vignette. Studio lighting: soft key light, subtle fill, hair light. Professional skin retouching while keeping texture natural. {COLOR_MOOD} toning. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No heavy filters',
      'No plastic skin look',
      'Keep it natural and professional',
      'No background distractions',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t, opts) => ({
      ...defaultParamMapping(s, t),
      BACKDROP_COLOR: opts?.headshot?.backdropColor ?? '#E8E8E8',
      SOFTNESS: (opts?.headshot?.softness ?? 40) > 50 ? 'strong' : 'gentle',
      VIGNETTE: (opts?.headshot?.vignette ?? 20) > 40 ? 'noticeable' : 'subtle',
    }),
  },

  'dreamy-portrait': {
    styleId: 'dreamy-portrait',
    displayName: 'Dreamy Portrait',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a dreamy, ethereal portrait. Soft focus bloom, lens flare, golden/pastel light. {INTENSITY} dreaminess. {COLOR_MOOD} palette with bokeh and light particles. {DETAIL}. Inspiring and uplifting mood. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No harsh shadows',
      'No dark or gloomy tones',
      'Keep it uplifting and positive',
    ],
    outputRequirements: {
      defaultSize: '1024x1024',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'editorial-fashion': {
    styleId: 'editorial-fashion',
    displayName: 'Editorial Fashion',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photo into a high-end editorial fashion photograph. High contrast, glossy finish, dramatic lighting. {INTENSITY} editorial polish. {COLOR_MOOD} palette. {DETAIL}. Bold composition, fashion-forward styling cues. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No overly sexualized poses',
      'No brand logos',
      'Keep it high-fashion editorial, not commercial',
    ],
    outputRequirements: {
      defaultSize: '1024x1792',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },
};

export function getRecipe(styleId: StyleId): StyleRecipe {
  const recipe = styleRecipes[styleId];
  if (!recipe) throw new Error(`Unknown style: ${styleId}`);
  return recipe;
}
