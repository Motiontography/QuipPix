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

const GLOBAL_SYSTEM = `You are an expert photo-to-art style transformation engine. Transform the provided photograph into the requested artistic style while strictly preserving the subject's facial identity, expression, pose, and composition. The output must look like a skilled artist rendered the same scene by hand in the target medium. Do not add text, watermarks, logos, or new elements not present in the original photograph. Do not produce NSFW, violent, hateful, or illegal content. If the request seems inappropriate, produce a tasteful, safe alternative.`;

export const styleRecipes: Record<StyleId, StyleRecipe> = {
  'caricature-classic': {
    styleId: 'caricature-classic',
    displayName: 'Caricature — Classic',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photograph into a classic hand-drawn caricature with {INTENSITY} exaggeration. Enlarge the head proportionally to the body, and humorously emphasize the subject's most distinctive facial features (nose, jawline, eyes, ears) while keeping the person immediately recognizable. Use {DETAIL} with clean ink outlines. {COLOR_MOOD} palette. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into a comic book panel illustration in the style of classic American comics. Bold black ink outlines with {LINE_WEIGHT} line weight. {HALFTONE} halftone dot shading for shadows and mid-tones. {INTENSITY} comic stylization. Flat cel-shaded coloring with {COLOR_MOOD} palette. {DETAIL}. Preserve the subject's likeness and pose exactly. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into a bold pop art piece using Lichtenstein-inspired Ben-Day dot patterns and Warhol-style flat color blocking. {INTENSITY} pop art effect. High-contrast areas with thick black outlines, flat saturated colors, and halftone dot overlays. {COLOR_MOOD} palette. {DETAIL}. Preserve the subject's facial features and likeness. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into a clean graphite pencil sketch on white paper. Use precise, confident contour lines with light hatching for tonal values. {INTENSITY} sketch effect. {DETAIL}. Gentle shading using parallel hatching — no smudging or charcoal. The drawing should look like a skilled portrait artist's clean line study. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into a gritty charcoal and graphite sketch on aged yellowish paper. Heavy crosshatching with smudged charcoal for deep shadows. {INTENSITY} effect. {DETAIL}. Dramatic chiaroscuro lighting with high contrast. Visible paper grain texture. The look of a raw, expressive life-drawing session. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into a luminous watercolor painting on cold-press watercolor paper. Visible wet-on-wet washes with soft color bleeds at edges. {INTENSITY} watercolor effect. {COLOR_MOOD} palette with translucent layered glazes. Leave selective areas of white paper showing through for highlights. {DETAIL}. Preserve the subject's likeness and expression. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into a classical oil painting on canvas. Rich impasto texture with visible palette-knife and bristle-brush strokes. {INTENSITY} oil painting effect. {COLOR_MOOD} palette with glazed color layers. Dramatic Rembrandt-style lighting with a strong key light and deep shadows. Gallery-quality composition. {DETAIL}. Preserve the subject's likeness precisely. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into an original anime-style illustration with digital cel-shading. Large expressive eyes, clean inked outlines, flat color fills with subtle gradient shading. Vibrant {COLOR_MOOD} palette. {INTENSITY} anime stylization. {DETAIL}. Preserve the dynamic pose and composition from the source. The subject should be recognizable. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into a cyberpunk neon-lit scene. Rim lighting in electric pink, cyan, and purple neon. Rain-slicked surfaces with reflective puddles catching colored light. {INTENSITY} cyberpunk effect. Futuristic holographic UI overlays and volumetric fog. Blade-Runner-inspired atmosphere. {DETAIL}. Preserve the subject's identity and expression. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
      defaultSize: '1024x1536',
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
    userPromptTemplate: `Transform this photograph into a professional studio headshot. Clean {BACKDROP_COLOR} seamless paper backdrop with {SOFTNESS} edge falloff and {VIGNETTE} vignette. Three-point studio lighting: soft key light at 45 degrees, subtle fill light, and hair/rim light for separation. Professional frequency-separation skin retouching that preserves natural skin texture while smoothing blemishes. {COLOR_MOOD} color toning. {DETAIL}. The subject must be immediately recognizable. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into a dreamy, ethereal portrait. Soft Gaussian bloom diffusion, golden-hour lens flare, and pastel light leaks. {INTENSITY} dreaminess. {COLOR_MOOD} palette with creamy bokeh orbs and floating light particles. Soft-focus on the background, sharp on the eyes. {DETAIL}. Warm, inspiring, uplifting mood. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `Transform this photograph into a high-end editorial fashion photograph for a luxury fashion magazine. High contrast with a glossy finish. Dramatic directional studio lighting with hard shadows. {INTENSITY} editorial polish. {COLOR_MOOD} palette with fashion-forward color grading. {DETAIL}. Bold cinematic composition with strong leading lines. Preserve the subject's features and expression. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'No overly sexualized poses',
      'No brand logos',
      'Keep it high-fashion editorial, not commercial',
    ],
    outputRequirements: {
      defaultSize: '1024x1536',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  // ─── Motiontography Signature Styles ──────────────────────────────
  'motiontography-ethereal': {
    styleId: 'motiontography-ethereal',
    displayName: 'Motiontography — Ethereal',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photograph into the signature Motiontography ethereal portrait style. Composite the subject into a dreamlike fantasy environment with soft, luminous atmosphere. Add flowing translucent fabric elements — tulle, silk, or chiffon — billowing around the subject as if caught in a gentle wind. Warm golden-amber color grading with rich, saturated tones and deep jewel-tone accents (ruby, emerald, sapphire). Soft diffused key light with dramatic backlit rim lighting creating a glowing halo effect around the subject. Luminosity masking for selective glow on highlights. {INTENSITY} ethereal effect. {COLOR_MOOD} palette. {DETAIL}. The mood should be empowering, majestic, and inspiring. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'Do not darken or desaturate the image',
      'Do not make it look cold or gloomy',
      'No harsh shadows on the face',
      'Keep the subject looking empowered and beautiful',
      'No cartoonish or painted look — maintain photographic realism with artistic enhancement',
    ],
    outputRequirements: {
      defaultSize: '1024x1536',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'motiontography-golden': {
    styleId: 'motiontography-golden',
    displayName: 'Motiontography — Golden Hour',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photograph into the signature Motiontography golden hour portrait style. Rich, warm golden-hour lighting with amber and honey tones flooding the scene. Strong chiaroscuro contrast — deep, warm shadows with luminous highlights kissed by golden light. Bokeh-rich background with soft circular light orbs in warm amber and champagne tones. Selective color enhancement — amplify golds, warm browns, and rich skin tones while keeping shadow detail. Subtle lens flare from a backlit sun source. Skin has a healthy, radiant glow with professional frequency-separation retouching. {INTENSITY} golden effect. {COLOR_MOOD} palette. {DETAIL}. The mood should be warm, intimate, and cinematic. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'Do not use cool or blue tones',
      'Do not flatten the contrast',
      'No plastic or over-smoothed skin',
      'Keep it photographic, not illustrated',
      'Do not blow out highlights — maintain detail in bright areas',
    ],
    outputRequirements: {
      defaultSize: '1024x1536',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t) => defaultParamMapping(s, t),
  },

  'motiontography-dramatic': {
    styleId: 'motiontography-dramatic',
    displayName: 'Motiontography — Dramatic',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photograph into the signature Motiontography dramatic portrait style. Bold, high-impact compositing with the subject placed in a richly textured environment — think ornate architecture, dramatic cloud formations, or deep forest backdrops. Strong directional Rembrandt lighting with a defined triangle of light on the shadow-side cheek. Deep, saturated jewel-tone color palette — deep burgundy, royal purple, midnight blue, forest green. Heavy texture overlays with fine grain for a cinematic film look. Strong vignetting drawing the eye to the subject. Metallic and golden accent elements woven into the environment. {INTENSITY} dramatic effect. {COLOR_MOOD} palette. {DETAIL}. The mood should be powerful, regal, and commanding. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'Do not wash out colors or reduce saturation',
      'No flat, even lighting — maintain dramatic contrast',
      'Do not add weapons, violence, or threatening elements',
      'Keep it empowering and dignified, not menacing',
      'Maintain photographic realism — no cartoon or painting look',
    ],
    outputRequirements: {
      defaultSize: '1024x1536',
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
