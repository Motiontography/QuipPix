import { config } from '../config';
import { ModerationFlags } from '../types';
import { logger } from '../utils/logger';

// Basic keyword/pattern safety gate for prompts
const BLOCKED_PATTERNS = [
  /\bn[s]fw\b/i,
  /\bnud(e|ity)\b/i,
  /\bpornograph/i,
  /\bsexual(ly|ized)?\b/i,
  /\bviolence\b/i,
  /\bgore\b/i,
  /\bhate\s*(speech|ful)\b/i,
  /\bterroris/i,
  /\bchild\s*(abuse|exploit)/i,
  /\bself[- ]?harm\b/i,
  /\bsuicid/i,
  /\billegal\s+drug/i,
  /\bweapon/i,
];

const SAFE_ALTERNATIVES = [
  'a tasteful portrait with artistic flair',
  'a creative and uplifting transformation',
  'a fun and family-friendly artistic rendition',
];

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  safeAlternative?: string;
}

/**
 * Pre-generation prompt moderation gate.
 * Returns whether the prompt is allowed and a reason if blocked.
 */
export function moderatePrompt(prompt: string): ModerationResult {
  if (!config.moderation.enabled) {
    return { allowed: true };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      const alt = SAFE_ALTERNATIVES[Math.floor(Math.random() * SAFE_ALTERNATIVES.length)];
      logger.warn({ matchedPattern: pattern.source }, 'Prompt blocked by moderation');
      return {
        allowed: false,
        reason: 'This request contains content that our safety guidelines do not allow. Please try a different creative direction.',
        safeAlternative: alt,
      };
    }
  }

  return { allowed: true };
}

/**
 * Pre-generation image moderation using OpenAI moderation API.
 * Fail-open: returns allowed on API errors to avoid blocking all generations.
 */
export async function moderateImage(imageBuffer: Buffer): Promise<ModerationResult> {
  if (!config.moderation.enabled || !config.moderation.imageCheckEnabled) {
    return { allowed: true };
  }

  try {
    const base64Image = imageBuffer.toString('base64');
    const response = await fetch(`${config.imageEngine.baseUrl}/moderations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.imageEngine.apiKey}`,
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: [
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${base64Image}` },
          },
        ],
      }),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, 'Image moderation API error — allowing image (fail-open)');
      return { allowed: true };
    }

    const data = (await response.json()) as {
      results: Array<{ flagged: boolean; categories: Record<string, boolean> }>;
    };

    if (data.results?.[0]?.flagged) {
      const flaggedCategories = Object.entries(data.results[0].categories)
        .filter(([, v]) => v)
        .map(([k]) => k);
      logger.warn({ categories: flaggedCategories }, 'Image blocked by moderation');
      return {
        allowed: false,
        reason: 'The uploaded image was flagged by our safety system. Please choose a different photo.',
      };
    }

    return { allowed: true };
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'Image moderation failed — allowing image (fail-open)');
    return { allowed: true };
  }
}

/**
 * Post-generation moderation check using provider safety flags.
 */
export function checkProviderFlags(flags: ModerationFlags): ModerationResult {
  if (!config.moderation.enabled) {
    return { allowed: true };
  }

  if (flags.flagged) {
    logger.warn({ categories: flags.categories }, 'Provider flagged content');
    return {
      allowed: false,
      reason: flags.message || 'The generated image was flagged by our safety system. Please try different settings.',
      safeAlternative: SAFE_ALTERNATIVES[0],
    };
  }

  return { allowed: true };
}
