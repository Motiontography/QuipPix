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

  // ─── Story Portrait Styles (Personalized Illustrated Caricature) ──
  'story-portrait': {
    styleId: 'story-portrait',
    displayName: 'Story Portrait',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photograph into a richly detailed, warm illustrated caricature portrait in the trending "personalized story portrait" style. The subject's face should be immediately recognizable with high fidelity to the original photo — same facial features, skin tone, hair, glasses, and expression — but rendered in a warm, polished digital illustration style with slightly enlarged head proportions for a friendly caricature feel.

{OCCUPATION_BLOCK}

{HOBBIES_BLOCK}

{HERITAGE_BLOCK}

{VIBE_BLOCK}

{EXTRAS_BLOCK}

Fill the entire background densely with colorful illustrated icons, objects, and symbols that represent the subject's life, profession, and personality. Include small text labels on clipboards, mugs, signs, or badges where appropriate. Use a warm, vibrant, saturated color palette with rich detail. The overall composition should feel joyful, celebratory, and deeply personal — like a visual love letter to who this person is. {INTENSITY} illustration effect. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'Do not change the subject facial features or skin tone',
      'Do not make the subject unrecognizable',
      'No offensive stereotypes or cultural insensitivity',
      'All text in the image must be spelled correctly and legible',
      'Keep it celebratory and positive',
    ],
    outputRequirements: {
      defaultSize: '1024x1536',
      format: 'png',
      identityPriority: 'high',
      textLegibility: true,
    },
    parameterMapping: (s, t, opts) => {
      const sp = opts?.storyPortrait;
      return {
        ...defaultParamMapping(s, t),
        OCCUPATION_BLOCK: sp?.occupation
          ? `Dress the subject in their professional attire for their role as: ${sp.occupation}. Include relevant professional tools, equipment, and symbols of their occupation prominently in the scene.`
          : '',
        HOBBIES_BLOCK: sp?.hobbies?.length
          ? `Surround the subject with illustrated icons and objects representing their hobbies and interests: ${sp.hobbies.join(', ')}. Each hobby should be represented by 1-2 recognizable illustrated objects.`
          : '',
        HERITAGE_BLOCK: sp?.heritage
          ? `Incorporate cultural elements representing: ${sp.heritage}. Include flags, traditional patterns, landmarks, or cultural symbols woven naturally into the background.`
          : '',
        VIBE_BLOCK: sp?.vibe
          ? `The overall mood and energy should convey: "${sp.vibe}". Reflect this vibe in the subject's pose, expression emphasis, and surrounding elements.`
          : '',
        EXTRAS_BLOCK: sp?.extras
          ? `Also include these additional personal elements: ${sp.extras}`
          : '',
      };
    },
  },

  'story-portrait-collage': {
    styleId: 'story-portrait-collage',
    displayName: 'Story Portrait — Collage',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photograph into a maximalist illustrated story portrait collage. The subject's face should be immediately recognizable — same features, skin tone, hair, and expression — rendered in a warm, polished digital illustration style with a slightly enlarged head for caricature charm.

{OCCUPATION_BLOCK}

{HOBBIES_BLOCK}

{HERITAGE_BLOCK}

{VIBE_BLOCK}

{EXTRAS_BLOCK}

Create an extremely dense, collage-style composition where every inch of the background is packed with illustrated objects, symbols, text labels on signs and mugs, small vignette scenes, and decorative elements. Include bold text banners and badges with personality catchphrases. Multiple small illustrated scenes showing the subject in different activities. Comic-panel energy with lots of visual storytelling. Warm, highly saturated, pop-art-influenced color palette. {INTENSITY} collage density. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'Do not change the subject facial features or skin tone',
      'No offensive content or stereotypes',
      'All text must be legible and correctly spelled',
      'Keep the subject as the clear focal point despite the busy background',
    ],
    outputRequirements: {
      defaultSize: '1024x1536',
      format: 'png',
      identityPriority: 'high',
      textLegibility: true,
    },
    parameterMapping: (s, t, opts) => {
      const sp = opts?.storyPortrait;
      return {
        ...defaultParamMapping(s, t),
        OCCUPATION_BLOCK: sp?.occupation
          ? `Feature the subject prominently in their professional role as: ${sp.occupation}. Show tools of the trade, workspace elements, and professional symbols throughout the collage.`
          : '',
        HOBBIES_BLOCK: sp?.hobbies?.length
          ? `Create mini illustrated vignettes for each hobby: ${sp.hobbies.join(', ')}. Scatter related objects and icons densely throughout the composition.`
          : '',
        HERITAGE_BLOCK: sp?.heritage
          ? `Weave cultural elements for: ${sp.heritage} throughout the collage — flags, food, landmarks, patterns, and cultural symbols.`
          : '',
        VIBE_BLOCK: sp?.vibe
          ? `Add bold text banners and badges reflecting the energy: "${sp.vibe}". The whole composition should radiate this vibe.`
          : '',
        EXTRAS_BLOCK: sp?.extras
          ? `Also incorporate: ${sp.extras}`
          : '',
      };
    },
  },

  'story-portrait-minimal': {
    styleId: 'story-portrait-minimal',
    displayName: 'Story Portrait — Clean',
    systemPrompt: GLOBAL_SYSTEM,
    userPromptTemplate: `Transform this photograph into a clean, elegant illustrated portrait with subtle personal touches. The subject's face should be immediately recognizable — same features, skin tone, hair, and expression — rendered in a warm, refined digital illustration style with natural proportions (no caricature exaggeration).

{OCCUPATION_BLOCK}

{HOBBIES_BLOCK}

{HERITAGE_BLOCK}

{VIBE_BLOCK}

{EXTRAS_BLOCK}

Keep the composition clean and focused on the subject. Use a soft, blurred or minimally detailed background with only a few carefully chosen personal symbols arranged tastefully around the edges. Elegant typography for any text elements. Warm, harmonious color palette with soft lighting. The result should feel like a premium custom illustration — refined, personal, and professional. {INTENSITY} illustration effect. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'Do not change the subject facial features or skin tone',
      'Do not overcrowd the composition — keep it minimal and elegant',
      'No cartoonish or exaggerated proportions',
      'All text must be legible and correctly spelled',
    ],
    outputRequirements: {
      defaultSize: '1024x1536',
      format: 'png',
      identityPriority: 'high',
      textLegibility: true,
    },
    parameterMapping: (s, t, opts) => {
      const sp = opts?.storyPortrait;
      return {
        ...defaultParamMapping(s, t),
        OCCUPATION_BLOCK: sp?.occupation
          ? `Subtly incorporate professional elements for: ${sp.occupation}. A single iconic prop or attire detail rather than filling the scene.`
          : '',
        HOBBIES_BLOCK: sp?.hobbies?.length
          ? `Include small, elegant icons for: ${sp.hobbies.join(', ')}. Keep them subtle and tastefully arranged.`
          : '',
        HERITAGE_BLOCK: sp?.heritage
          ? `Add a subtle cultural nod to: ${sp.heritage}. A small flag pin, pattern accent, or background element.`
          : '',
        VIBE_BLOCK: sp?.vibe
          ? `The mood should quietly convey: "${sp.vibe}" through lighting, color, and composition.`
          : '',
        EXTRAS_BLOCK: sp?.extras
          ? `Subtly include: ${sp.extras}`
          : '',
      };
    },
  },
  // ─── Insta Glam (Photorealistic Instagram Model Transformation) ────
  'insta-glam': {
    styleId: 'insta-glam',
    displayName: 'Insta Glam',
    systemPrompt: `You are an expert high-end beauty and fashion photographer specializing in photorealistic portrait retouching and styling. Transform the provided selfie/photo into a magazine-quality Instagram model photo. The result MUST be PHOTOREALISTIC — this is NOT an illustration, cartoon, or painting. The subject's face, bone structure, features, and skin tone MUST be EXACTLY preserved. This must look unmistakably like the same person, just professionally styled, lit, and photographed. Do not produce NSFW, violent, hateful, or illegal content.`,
    userPromptTemplate: `Transform this selfie into a stunning, high-end Instagram model photo. This must be PHOTOREALISTIC — a real photograph, not an illustration or painting.

CRITICAL: The subject's face must be EXACTLY the same person. Same bone structure, same eyes, same nose, same lips, same skin tone, same facial proportions. The only changes are styling, lighting, and professional beauty retouching.

BEAUTY RETOUCHING:
- Professional frequency-separation skin retouching: smooth blemishes while preserving natural skin texture and pores
- Perfectly defined, groomed eyebrows
- {MAKEUP_BLOCK}
- Healthy, radiant skin with natural glow — no plastic or airbrushed look
- Subtle contouring with highlight and shadow to enhance bone structure
- Bright, clear eyes with catchlights

{HAIR_BLOCK}

{OUTFIT_BLOCK}

{SETTING_BLOCK}

{ACCESSORIES_BLOCK}

LIGHTING:
Professional studio-quality lighting: soft beauty key light positioned slightly above center, subtle fill to prevent harsh shadows, rim/hair light for subject separation from background. Shallow depth of field with the face tack-sharp.

MOOD: {MOOD_BLOCK}

The overall quality should be indistinguishable from a real professional photoshoot published in a fashion magazine or top-tier Instagram influencer page. Shot on a high-end full-frame camera with an 85mm f/1.4 lens. {INTENSITY} glamour enhancement. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'NEVER change the subject facial bone structure, eye shape, nose shape, or lip shape',
      'NEVER lighten or darken the skin tone — preserve it exactly',
      'No illustration, cartoon, painting, or digital art style — must be photorealistic',
      'No plastic, wax-figure, or uncanny-valley skin — keep natural texture',
      'No overly sexualized poses or content',
      'No brand logos or trademarked items',
      'Do not make the subject look like a different person',
    ],
    outputRequirements: {
      defaultSize: '1024x1536',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
    },
    parameterMapping: (s, t, opts) => {
      const im = opts?.instaModel;
      const makeupStyle = im?.makeupStyle || 'Natural Glam';
      const makeupMap: Record<string, string> = {
        'Natural Glam': 'Subtle, natural-looking makeup with dewy skin, soft bronzer, neutral lip, and light mascara — the "effortlessly beautiful" look',
        'Soft Glam': 'Soft glam makeup: smokey neutral eyeshadow, defined brows, subtle contour, nude-pink lip gloss, wispy lashes',
        'Full Glam': 'Full glam makeup: dramatic winged eyeliner, voluminous false lashes, sculpted contour and highlight, bold lip color, flawless matte-to-dewy foundation',
        'Editorial': 'High-fashion editorial makeup: avant-garde color placement, graphic liner, sculpted cheekbones, bold artistic choices that photograph stunningly',
        'No Makeup': 'Minimal to no visible makeup — just flawless, naturally radiant skin with professional lighting. Clean, fresh-faced beauty',
      };

      const hairStyle = im?.hairStyle || 'As-Is';
      const hairMap: Record<string, string> = {
        'As-Is': 'Keep the subject\'s current hairstyle but make it look perfectly styled and salon-fresh',
        'Styled Waves': 'Glamorous, voluminous loose waves with body and shine — classic Hollywood blowout',
        'Sleek Straight': 'Sleek, pin-straight glossy hair with a glass-like shine',
        'Updo': 'Elegant updo or chignon with face-framing tendrils, polished and sophisticated',
        'Natural Curls': 'Beautiful, defined natural curls or coils with shine and volume — celebrating natural texture',
      };

      const mood = im?.mood || 'Confident';
      const moodMap: Record<string, string> = {
        'Confident': 'Confident and powerful — strong eye contact, poised posture, commanding presence',
        'Sultry': 'Sultry and alluring — smoldering gaze, soft parted lips, warm intimate lighting',
        'Playful': 'Playful and fun — bright eyes, genuine smile, energetic and approachable',
        'Fierce': 'Fierce and bold — intense gaze, strong angles, dramatic lighting and shadows',
        'Elegant': 'Elegant and graceful — serene expression, soft lighting, timeless sophistication',
        'Editorial': 'Editorial and avant-garde — striking pose, artistic composition, high-fashion attitude',
      };

      return {
        ...defaultParamMapping(s, t),
        MAKEUP_BLOCK: makeupMap[makeupStyle] || makeupMap['Natural Glam'],
        HAIR_BLOCK: `HAIR: ${hairMap[hairStyle] || hairMap['As-Is']}`,
        OUTFIT_BLOCK: im?.outfit
          ? `OUTFIT/STYLING: Dress the subject in: ${im.outfit}. The clothing should fit perfectly and look high-quality, designer-level.`
          : 'OUTFIT/STYLING: Elevate the subject\'s current outfit to look polished and Instagram-ready, or dress them in stylish, on-trend fashion.',
        SETTING_BLOCK: im?.setting
          ? `SETTING/BACKGROUND: ${im.setting}. The background should complement the subject with beautiful bokeh and professional composition.`
          : 'SETTING/BACKGROUND: Clean, flattering background with soft bokeh — studio backdrop, luxury interior, or golden-hour outdoor setting.',
        ACCESSORIES_BLOCK: im?.accessories
          ? `ACCESSORIES: Include these accessories: ${im.accessories}. They should look high-end and complement the overall look.`
          : '',
        MOOD_BLOCK: moodMap[mood] || moodMap['Confident'],
      };
    },
  },
};

export function getRecipe(styleId: StyleId): StyleRecipe {
  const recipe = styleRecipes[styleId];
  if (!recipe) throw new Error(`Unknown style: ${styleId}`);
  return recipe;
}
