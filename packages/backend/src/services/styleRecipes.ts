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
      ? 'IDENTITY LOCK: Do not change the subject\'s facial bone structure, eye shape, nose shape, lip shape, jawline, or any facial proportions. Preserve exact likeness, expression, hairstyle, and all identifying features. The result must be immediately recognizable as the same person.'
      : '',
    PRESERVE_SKIN: toggles.preserveSkinTone
      ? 'SKIN LOCK: Maintain the subject\'s exact skin tone — do not lighten, darken, or shift hue in any way. Preserve natural skin texture including pores and fine lines.'
      : '',
  };
}

const GLOBAL_SYSTEM = `You are an expert photo-to-art style transformation engine. Transform the provided photograph into the requested artistic style. CRITICAL RULE: The subject's facial identity must be EXACTLY preserved — same bone structure, same eye shape, same nose shape, same lip shape, same jawline, same skin tone. Do not alter facial anatomy in any way. Apply artistic styling only. The output must look like a skilled artist rendered the same scene by hand in the target medium. Do not add text, watermarks, logos, or new elements not present in the original photograph unless instructed. Keep all content tasteful, safe, and appropriate.`;

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
      'Keep it tasteful and appropriate',
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
      'No harmful or dangerous objects',
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
      'Keep content tasteful and appropriate',
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
    userPromptTemplate: `CRITICAL — FACE PRESERVATION: Do not change the subject's face, facial bone structure, eye shape, nose shape, lip shape, jawline, or any facial proportions in any way. Preserve exact likeness, expression, hairstyle, and proportions. Apply styling changes only — do not alter anatomy.

Transform this photograph into a polished, professional studio headshot suitable for LinkedIn, corporate websites, or a business card. This must be PHOTOREALISTIC — a real photograph, not an illustration or digital rendering.

FRAMING: Medium close-up shot framed from the top of the head (with headroom above) down to mid-chest. The subject's eyes should be positioned at approximately the upper third of the frame. Do NOT crop or cut off the top of the head. Center the subject horizontally. Shot at eye level with an 85mm f/1.4 lens on a full-frame camera.

BACKGROUND: Clean, solid {BACKDROP_COLOR} seamless paper backdrop with {SOFTNESS} edge falloff and {VIGNETTE} vignette. No textures, no patterns, no distractions.

LIGHTING: Professional three-point studio lighting. Soft key light from a large softbox positioned 45 degrees camera-left and slightly above eye level. Gentle fill light from camera-right reducing shadows to a 2:1 ratio. Hair/rim light from behind for clean subject separation from the backdrop. Two bright catchlights visible in both eyes from the key and fill lights. Natural lighting, believable detail, no cinematic color grading.

RETOUCHING: Frequency-separation-style retouching — smooth blemishes while preserving visible pores, natural skin texture, and fine lines. This must look like a real photograph with natural imperfections, not an airbrushed digital rendering. Subtle contouring with light and shadow to enhance bone structure. Bright, clear eyes. Teeth gently whitened if visible. Clean, groomed appearance. Subtle natural film grain (ISO 200 level) for an authentic photographic feel.

{COLOR_MOOD} color toning with professional white balance. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'NEVER crop or cut off the top of the head — always include full head with headroom',
      'No plastic, wax-figure, or over-smoothed skin — preserve visible pores and natural texture',
      'No digital rendering look — this must be indistinguishable from a real studio photograph',
      'No background distractions, textures, or gradients beyond what was specified',
      'Do not change the subject facial features, skin tone, or identity',
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
      'Keep poses tasteful and professional',
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
    userPromptTemplate: `CRITICAL — FACE PRESERVATION: Do not change the subject's face, facial bone structure, eye shape, nose shape, lip shape, jawline, or any facial proportions. Preserve exact likeness and expression. Apply artistic styling only — do not alter anatomy.

Transform this photograph into the signature Motiontography ethereal portrait style. Composite the subject into a dreamlike fantasy environment with soft, luminous atmosphere. Add flowing fabric elements — silk, chiffon, or tulle — draped and floating around the scene as if caught in a gentle wind. Warm golden-amber color grading with rich, saturated tones and deep jewel-tone accents (ruby, emerald, sapphire). Soft diffused key light with dramatic backlit rim lighting creating a glowing halo effect around the subject. Luminosity masking for selective glow on highlights. Subsurface scattering on skin for a radiant, lit-from-within glow. Subtle natural film grain for authentic photographic feel. Shot on a full-frame camera with an 85mm f/1.4 lens. {INTENSITY} ethereal effect. {COLOR_MOOD} palette. {DETAIL}. The mood should be empowering, majestic, and inspiring. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'Do not darken or desaturate the image',
      'Do not make it look cold or gloomy',
      'No harsh shadows on the face',
      'Keep the subject looking empowered and dignified',
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
    userPromptTemplate: `CRITICAL — FACE PRESERVATION: Do not change the subject's face, facial bone structure, eye shape, nose shape, lip shape, jawline, or any facial proportions. Preserve exact likeness and expression. Apply artistic styling only — do not alter anatomy.

Transform this photograph into the signature Motiontography golden hour portrait style. Rich, warm golden-hour lighting with amber and honey tones flooding the scene. Strong chiaroscuro contrast — deep, warm shadows with luminous highlights kissed by golden light. Bokeh-rich background with soft circular light orbs in warm amber and champagne tones. Selective color enhancement — amplify golds, warm browns, and rich skin tones while keeping shadow detail. Subtle lens flare from a backlit sun source. Skin has a healthy, radiant glow with natural texture and visible pores preserved. Subtle natural film grain for cinematic feel. Shot on a full-frame camera with a 70-200mm f/2.8 lens. {INTENSITY} golden effect. {COLOR_MOOD} palette. {DETAIL}. The mood should be warm, inviting, and cinematic. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
    userPromptTemplate: `CRITICAL — FACE PRESERVATION: Do not change the subject's face, facial bone structure, eye shape, nose shape, lip shape, jawline, or any facial proportions. Preserve exact likeness and expression. Apply artistic styling only — do not alter anatomy.

Transform this photograph into the signature Motiontography dramatic portrait style. Bold, high-impact compositing with the subject placed in a richly textured environment — think ornate architecture, dramatic cloud formations, or deep forest backdrops. Strong directional Rembrandt lighting with a defined triangle of light on the shadow-side cheek. Deep, saturated jewel-tone color palette — deep burgundy, royal purple, midnight blue, forest green. Heavy texture overlays with fine cinematic film grain. Strong vignetting drawing the eye to the subject. Metallic and golden accent elements woven into the environment. Visible skin texture and pores — no digital smoothing. Shot on a full-frame camera with an 85mm f/1.4 lens. {INTENSITY} dramatic effect. {COLOR_MOOD} palette. {DETAIL}. The mood should be powerful, regal, and commanding. {FACE_FIDELITY}. {BG_STRENGTH}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'Do not wash out colors or reduce saturation',
      'No flat, even lighting — maintain dramatic contrast',
      'Do not add dangerous or threatening elements',
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
    userPromptTemplate: `CRITICAL — FACE PRESERVATION: The illustrated character must closely resemble the person in the photo. Preserve their exact facial features, bone structure, skin tone, eye shape, nose shape, lip shape, jawline, hair texture, glasses, and expression. The person must be immediately recognizable.

Create a personalized caricature portrait of this person rendered in a Pixar-quality digital illustration style with cinematic 3D lighting.

SUBJECT RENDERING:
Preserve the subject's exact facial features, bone structure, skin tone, hair texture, glasses, and expression from the photo. Render the face with subsurface scattering on the skin, soft specular highlights on the forehead and cheekbones, and warm ambient occlusion in the creases. Slightly enlarge the head for a friendly caricature proportion. The face should have the polished dimensional quality of a high-end animated film character.

{OCCUPATION_BLOCK}

{HOBBIES_BLOCK}

{HERITAGE_BLOCK}

{VIBE_BLOCK}

{EXTRAS_BLOCK}

LIGHTING: Warm directional key light from upper-left at 45 degrees. Soft golden fill light from the right. Subtle rim light separating the subject from the background. Each object should cast soft contact shadows.

MATERIAL & TEXTURE:
- Glossy ceramic surfaces on mugs and bowls with sharp specular reflections
- Polished brass and gold on badges, pins, and buckles
- Soft matte fabric textures on clothing
- Smooth translucent materials for any glass or liquid elements
- Crisp printed text on labels, clipboards, signs, and badges

COMPOSITION: Dense, celebratory arrangement filling the entire frame with illustrated objects, icons, and symbols representing the subject's life. Slight depth-of-field blur on background edges. The subject is the clear focal point with personal elements radiating outward.

{INTENSITY} illustration effect. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
      generative: true,
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
    userPromptTemplate: `CRITICAL — FACE PRESERVATION: The illustrated character must closely resemble the person in the photo. Preserve their exact facial features, bone structure, skin tone, eye shape, nose shape, lip shape, jawline, hair, glasses, and expression. The person must be immediately recognizable.

Create a maximalist collage-style personalized caricature portrait of this person rendered in a Pixar-quality digital illustration style with cinematic 3D lighting.

SUBJECT RENDERING:
Preserve the subject's exact facial features, bone structure, skin tone, hair, glasses, and expression. Render the face with subsurface scattering, soft specular highlights on cheekbones, and warm ambient occlusion. Slightly enlarged head for caricature charm. The face should have the polished quality of a high-end animated film character.

{OCCUPATION_BLOCK}

{HOBBIES_BLOCK}

{HERITAGE_BLOCK}

{VIBE_BLOCK}

{EXTRAS_BLOCK}

COMPOSITION: Extremely dense collage packed edge-to-edge with illustrated objects, bold text banners, personality badges, mini vignette scenes, and decorative elements. The subject is the clear focal point in the center.

LIGHTING: Warm directional key light from above-left. Each object casts soft contact shadows. Strong rim light on the subject for separation from the busy background.

MATERIALS: Glossy ceramic mugs, polished brass badges, chrome tools, soft fabric textures, crisp printed text on banners and labels. Every surface has realistic material properties — no flat colors.

COLOR: Rich saturated pop-art palette with warm golden tones. Comic-panel energy with vibrant accents.

{INTENSITY} collage density. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
      generative: true,
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
    userPromptTemplate: `CRITICAL — FACE PRESERVATION: The illustrated character must closely resemble the person in the photo. Preserve their exact facial features, bone structure, skin tone, eye shape, nose shape, lip shape, jawline, hair, glasses, and expression. The person must be immediately recognizable.

Create a clean, elegant personalized portrait of this person rendered in a refined digital illustration style with soft cinematic 3D lighting and natural proportions.

SUBJECT RENDERING:
Preserve the subject's exact facial features, bone structure, skin tone, hair, glasses, and expression. Render with subsurface scattering on skin, soft specular highlights, and warm ambient occlusion. Natural proportions (no caricature exaggeration). The face should have the polished quality of a premium portrait commission.

{OCCUPATION_BLOCK}

{HOBBIES_BLOCK}

{HERITAGE_BLOCK}

{VIBE_BLOCK}

{EXTRAS_BLOCK}

COMPOSITION: Clean and focused on the subject. Soft bokeh background with only a few carefully chosen personal symbols arranged tastefully around the edges. Minimal and elegant.

LIGHTING: Soft studio key light from above at 30 degrees. Gentle fill light eliminating harsh shadows. Subtle rim light for separation. Warm, harmonious color temperature.

MATERIALS: Each object has realistic material properties — glossy ceramic, polished metal, soft fabric, crisp paper. Elegant typography for any text elements.

{INTENSITY} illustration effect. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
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
      generative: true,
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
    systemPrompt: `You are an expert professional portrait and beauty photographer. Transform the provided photo into a polished, magazine-quality professional portrait. The result MUST be PHOTOREALISTIC — a real photograph, not an illustration. The subject's face, bone structure, features, and skin tone MUST be EXACTLY preserved. Do not produce inappropriate content.`,
    userPromptTemplate: `CRITICAL — FACE PRESERVATION: Do not change the subject's face, facial bone structure, eye shape, nose shape, lip shape, jawline, or any facial proportions in any way. Preserve exact likeness, expression, hairstyle, and proportions. Apply styling changes only — do not alter anatomy.

Transform this photo into a polished, magazine-quality professional portrait. This must be PHOTOREALISTIC — a real photograph, not an illustration or painting. The subject's face must be EXACTLY the same person — same bone structure, same eyes, same nose, same lips, same skin tone, same facial proportions. The only changes are styling, lighting, and professional retouching.

PROFESSIONAL RETOUCHING:
- Smooth blemishes while preserving natural skin texture and pores
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
Professional studio-quality lighting: soft key light positioned slightly above center, subtle fill to prevent harsh shadows, rim/hair light for subject separation from background. Shallow depth of field with the face tack-sharp.

MOOD: {MOOD_BLOCK}

Subtle natural film grain for an authentic photographic feel — this must be indistinguishable from a real photograph. Visible skin pores in close-up areas. Two bright catchlights in each eye from the studio key and fill lights. Natural, flattering color toning with professional white balance — no heavy cinematic grading.

The overall quality should match a professional photoshoot for a fashion editorial or magazine cover. Shot on a high-end full-frame camera with an 85mm f/1.4 lens. {INTENSITY} professional enhancement. {DETAIL}. {FACE_FIDELITY}. {KEEP_IDENTITY} {PRESERVE_SKIN}`,
    negativeConstraints: [
      'NEVER change the subject facial bone structure, eye shape, nose shape, or lip shape',
      'NEVER lighten or darken the skin tone — preserve it exactly',
      'No illustration, cartoon, painting, or digital art style — must be photorealistic',
      'No plastic, wax-figure, or uncanny-valley skin — keep natural texture',
      'Keep poses tasteful and professional',
      'No brand logos or trademarked items',
      'Do not make the subject look like a different person',
    ],
    outputRequirements: {
      defaultSize: '1024x1536',
      format: 'png',
      identityPriority: 'high',
      textLegibility: false,
      generative: true,
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
        'Warm': 'Warm and inviting — soft smile, warm lighting, approachable and radiant',
        'Playful': 'Playful and fun — bright eyes, genuine smile, energetic and approachable',
        'Fierce': 'Fierce and bold — intense gaze, strong angles, dramatic lighting and shadows',
        'Elegant': 'Elegant and graceful — serene expression, soft lighting, timeless sophistication',
        'Editorial': 'Editorial and artistic — striking composition, creative lighting, high-fashion attitude',
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
