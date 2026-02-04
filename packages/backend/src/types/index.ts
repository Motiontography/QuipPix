import { z } from 'zod';

// ─── Style IDs ───────────────────────────────────────────────────────
export const StyleId = z.enum([
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
]);
export type StyleId = z.infer<typeof StyleId>;

// ─── Common Sliders ──────────────────────────────────────────────────
export const CommonSliders = z.object({
  intensity: z.number().min(0).max(100).default(50),
  faceFidelity: z.number().min(0).max(100).default(70),
  backgroundStrength: z.number().min(0).max(100).default(50),
  colorMood: z.enum(['warm', 'cool', 'vibrant', 'mono']).default('warm'),
  detail: z.number().min(0).max(100).default(50),
});
export type CommonSliders = z.infer<typeof CommonSliders>;

// ─── Toggles ─────────────────────────────────────────────────────────
export const Toggles = z.object({
  keepIdentity: z.boolean().default(true),
  preserveSkinTone: z.boolean().default(true),
});
export type Toggles = z.infer<typeof Toggles>;

// ─── Style-specific options ──────────────────────────────────────────
export const ComicOptions = z.object({
  lineWeight: z.number().min(0).max(100).default(50),
  halftoneAmount: z.number().min(0).max(100).default(40),
});

export const MagazineOptions = z.object({
  mastheadText: z.string().max(50).default('QUIPPIX'),
  coverLines: z.array(z.string().max(80)).max(4).default([]),
  issueDate: z.string().max(30).default(''),
  showBarcode: z.boolean().default(true),
});

export const HeadshotOptions = z.object({
  backdropColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#E8E8E8'),
  softness: z.number().min(0).max(100).default(40),
  vignette: z.number().min(0).max(100).default(20),
});

export const StyleSpecificOptions = z
  .object({
    comic: ComicOptions.optional(),
    magazine: MagazineOptions.optional(),
    headshot: HeadshotOptions.optional(),
  })
  .optional();

export type StyleSpecificOptions = z.infer<typeof StyleSpecificOptions>;

// ─── Pro Sliders ─────────────────────────────────────────────────────
export const ProSliders = z.object({
  microDetail: z.number().min(0).max(100).optional(),
  studioRelight: z.number().min(0).max(100).optional(),
  backgroundPro: z.number().min(0).max(100).optional(),
});
export type ProSliders = z.infer<typeof ProSliders>;

// ─── Generate Request ────────────────────────────────────────────────
export const GenerateRequest = z.object({
  styleId: StyleId,
  sliders: CommonSliders.default({}),
  toggles: Toggles.default({}),
  userPrompt: z.string().max(500).optional(),
  styleOptions: StyleSpecificOptions,
  proSliders: ProSliders.optional(),
  outputSize: z.enum([
    '1024x1024', '1024x1792', '1792x1024',
    '2048x2048', '2048x3584', '3584x2048',
    '4096x4096',
  ]).optional(),
});
export type GenerateRequest = z.infer<typeof GenerateRequest>;

// ─── Job Status ──────────────────────────────────────────────────────
export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number; // 0-100
  resultUrl?: string; // signed URL, present when done
  error?: string; // present when failed
  createdAt: string;
}

// ─── Image Engine Contract ───────────────────────────────────────────
export interface ImageEngineRequest {
  model: string;
  prompt: string;
  image: Buffer;
  mask?: Buffer;
  size: '1024x1024' | '1024x1792' | '1792x1024' | '2048x2048' | '2048x3584' | '3584x2048' | '4096x4096';
  quality: 'standard' | 'hd';
  responseFormat: 'b64_json' | 'url';
}

export interface ImageEngineResponse {
  imageData: Buffer | null;
  imageUrl: string | null;
  revisedPrompt: string;
  moderationFlags: ModerationFlags;
}

export interface ModerationFlags {
  flagged: boolean;
  categories: string[];
  message?: string;
}

// ─── Style Recipe ────────────────────────────────────────────────────
export interface StyleRecipe {
  styleId: StyleId;
  displayName: string;
  systemPrompt: string;
  userPromptTemplate: string;
  negativeConstraints: string[];
  outputRequirements: {
    defaultSize: ImageEngineRequest['size'];
    format: 'png';
    identityPriority: 'high' | 'medium' | 'low';
    textLegibility: boolean;
  };
  parameterMapping: (sliders: CommonSliders, toggles: Toggles, options?: StyleSpecificOptions) => Record<string, string>;
}

// ─── Batch Generate Request ─────────────────────────────────────────
export const BatchGenerateRequest = z.object({
  styleId: StyleId,
  sliders: CommonSliders.default({}),
  toggles: Toggles.default({}),
  userPrompt: z.string().max(500).optional(),
  styleOptions: StyleSpecificOptions,
  proSliders: ProSliders.optional(),
  outputSize: z.enum([
    '1024x1024', '1024x1792', '1792x1024',
    '2048x2048', '2048x3584', '3584x2048',
    '4096x4096',
  ]).optional(),
});
export type BatchGenerateRequest = z.infer<typeof BatchGenerateRequest>;

// ─── Batch Status ───────────────────────────────────────────────────
export type BatchStatus = 'processing' | 'done' | 'partial_failure';

export interface BatchJobStatus {
  jobId: string;
  status: JobStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
}

export interface BatchStatusResponse {
  batchId: string;
  status: BatchStatus;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  overallProgress: number;
  jobs: BatchJobStatus[];
  createdAt: string;
}

// ─── Daily Challenge ────────────────────────────────────────────────
export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  creativePrompt: string;
  suggestedStyleId: StyleId;
  icon: string;
  hashtag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bonusConstraint?: string;
}

export interface ChallengeSubmission {
  challengeId: string;
  jobId: string;
  submittedAt: string;
}

export interface ChallengeResponse {
  challenge: DailyChallenge;
  totalSubmissions: number;
}

// ─── Remix Template ─────────────────────────────────────────────────
export const RemixTemplateSchema = z.object({
  styleId: StyleId,
  sliders: CommonSliders.default({}),
  toggles: Toggles.default({}),
  styleOptions: StyleSpecificOptions,
  creatorName: z.string().max(50).optional(),
});
export type RemixTemplate = z.infer<typeof RemixTemplateSchema>;

export interface RemixRecord {
  code: string;
  template: RemixTemplate;
  createdAt: string;
  views: number;
}

// ─── Entitlement (server-side) ───────────────────────────────────────
export type ProType = 'monthly' | 'annual' | 'lifetime';

export interface ServerEntitlement {
  appUserId: string;
  proActive: boolean;
  proType: ProType | null;
  expiresAt: string | null;
  verifiedAt: string;
}

export const ValidateReceiptRequest = z.object({
  appUserId: z.string().min(1).max(200),
});
export type ValidateReceiptRequest = z.infer<typeof ValidateReceiptRequest>;

export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'SUBSCRIBER_ALIAS';

export interface RevenueCatWebhookEvent {
  event: {
    type: RevenueCatEventType;
    app_user_id: string;
    entitlement_ids?: string[];
    product_id?: string;
    expiration_at_ms?: number;
  };
  api_version: string;
}

// ─── Storage metadata ────────────────────────────────────────────────
export interface StoredFile {
  key: string;
  bucket: string;
  uploadedAt: Date;
  ttlSeconds: number;
}
