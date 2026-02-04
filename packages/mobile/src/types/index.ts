// ─── Style IDs (mirrors backend) ─────────────────────────────────────
export type StyleId =
  | 'caricature-classic'
  | 'caricature-subtle'
  | 'caricature-editorial'
  | 'comic-book'
  | 'pop-art'
  | 'pencil-clean'
  | 'pencil-gritty'
  | 'watercolor'
  | 'oil-painting'
  | 'anime-inspired'
  | 'cyberpunk-neon'
  | 'magazine-cover'
  | 'pro-headshot'
  | 'dreamy-portrait'
  | 'editorial-fashion';

// ─── Style Pack ──────────────────────────────────────────────────────
export interface StylePack {
  id: StyleId;
  displayName: string;
  category: string;
  icon: string; // emoji placeholder; swap for asset
  description: string;
  previewColor: string;
  proOnly: boolean;
}

// ─── Pro types ───────────────────────────────────────────────────────
export type ProType = 'monthly' | 'annual' | 'lifetime';

export interface Entitlement {
  proActive: boolean;
  proType: ProType | null;
  expiresAt: string | null;
}

export interface ProSliders {
  microDetail?: number;
  studioRelight?: number;
  backgroundPro?: number;
}

// ─── Sliders ─────────────────────────────────────────────────────────
export type ColorMood = 'warm' | 'cool' | 'vibrant' | 'mono';

export interface CommonSliders {
  intensity: number;
  faceFidelity: number;
  backgroundStrength: number;
  colorMood: ColorMood;
  detail: number;
}

export interface Toggles {
  keepIdentity: boolean;
  preserveSkinTone: boolean;
}

// ─── Style-specific ──────────────────────────────────────────────────
export interface ComicOptions {
  lineWeight: number;
  halftoneAmount: number;
}

export interface MagazineOptions {
  mastheadText: string;
  coverLines: string[];
  issueDate: string;
  showBarcode: boolean;
}

export interface HeadshotOptions {
  backdropColor: string;
  softness: number;
  vignette: number;
}

export interface StyleSpecificOptions {
  comic?: ComicOptions;
  magazine?: MagazineOptions;
  headshot?: HeadshotOptions;
}

// ─── Generation ──────────────────────────────────────────────────────
export interface GenerateParams {
  styleId: StyleId;
  sliders: CommonSliders;
  toggles: Toggles;
  userPrompt?: string;
  styleOptions?: StyleSpecificOptions;
  proSliders?: ProSliders;
  outputSize?: string;
}

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: string;
}

// ─── Gallery ─────────────────────────────────────────────────────────
export interface GalleryItem {
  id: string;
  localUri: string;
  resultUrl?: string;
  styleId: StyleId;
  styleName: string;
  createdAt: string;
  params: GenerateParams;
}

// ─── Collections ────────────────────────────────────────────────────
export interface Collection {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: string;
}

// ─── Batch Types ────────────────────────────────────────────────────
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

export interface BatchResultItem {
  jobId: string;
  resultUrl: string;
  params: GenerateParams;
}

// ─── Daily Challenge ────────────────────────────────────────────────
export interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  creativePrompt: string;
  suggestedStyleId: StyleId;
  icon: string;
  hashtag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bonusConstraint?: string;
}

export interface ChallengeResponse {
  challenge: DailyChallenge;
  totalSubmissions: number;
}

export interface ChallengeCompletion {
  challengeId: string;
  date: string;
  jobId: string;
  resultUrl: string;
  styleId: StyleId;
  completedAt: string;
}

// ─── Remix ──────────────────────────────────────────────────────────
export interface RemixTemplate {
  styleId: StyleId;
  sliders: CommonSliders;
  toggles: Toggles;
  styleOptions?: StyleSpecificOptions;
  creatorName?: string;
}

export interface RemixResponse {
  code: string;
  template: RemixTemplate;
  createdAt: string;
  views: number;
}

// ─── Navigation ──────────────────────────────────────────────────────
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  StyleSelect: { imageUri: string; imageUris?: string[]; challengeId?: string; preselectedStyleId?: StyleId };
  Customize: { imageUri: string; styleId: StyleId; imageUris?: string[]; challengeId?: string };
  Generating: { imageUri: string; params: GenerateParams; challengeId?: string };
  BatchGenerating: { imageUris: string[]; params: GenerateParams };
  Result: { jobId: string; resultUrl: string; params: GenerateParams; sourceImageUri?: string };
  BatchResults: { results: BatchResultItem[]; params: GenerateParams };
  ShareCard: {
    localUri: string;
    styleName: string;
    styleId: StyleId;
    challengeId?: string;
    challengeHashtag?: string;
    currentStreak?: number;
  };
  Remix: { code: string };
  Paywall: { trigger: string; context?: string };
  Stats: undefined;
};

export type TabParamList = {
  Home: undefined;
  Gallery: undefined;
  Challenges: undefined;
  Settings: undefined;
};
