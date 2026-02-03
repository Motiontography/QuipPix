# QuipPix — Product Specification v1.0

## Overview
QuipPix is a free, anonymous mobile app (iOS + Android) that transforms user photos into stylized art using ChatGPT 5.2 Image Mode. Users upload a photo, select a style, customize parameters, and receive a high-quality transformed image they can save, share, or remix.

## Platforms
- iOS (com.motiontography.quippix)
- Android (com.motiontography.quippix)
- React Native + TypeScript single codebase

## Core Principles
1. **Freemium with generous free tier** — 6 free styles, 5 daily generations; Pro unlocks all 15 styles, high-res exports, priority processing, and advanced controls
2. **Anonymous by default** — no account required; entitlements managed device-side via RevenueCat anonymous IDs
3. **Privacy-first** — EXIF stripped, server storage TTL (1 hour), local-first gallery, no server-side receipt verification
4. **Delightful** — fast, fun, beautiful outputs
5. **Viral** — easy sharing, direct social posting, remix templates, deep links
6. **Soft brand** — Motiontography promotion is always non-blocking

---

## UX Flow Map

```
┌──────────┐
│   Home   │──→ Choose Photo (Library) ──→ Style Select ──→ Customize ──→ Generate ──→ Result
│          │──→ Take Photo (Camera) ────┘                                               │
└──────────┘                                                                            │
     │                                                                            ┌─────┴─────┐
     ├── Gallery ←────────────────────────────────────── Save ←──────────────────── │  Result   │
     │                                                                            │  Screen   │
     ├── Challenges                                      Share ←─────────────────── │           │
     │                                                                            │  Remix    │
     └── Settings                                        Share Template (Deep Link)─┤  Link    │
                                                                                  └───────────┘
```

### Screen Inventory
| Screen | Purpose |
|--------|---------|
| Home | Upload photo (library or camera) |
| Style Select | Browse 15 styles across 6 categories |
| Customize | Sliders, toggles, user prompt, style-specific options |
| Generating | Progress animation + polling |
| Result | View result, save, share, remix link |
| Share Card | Framed share image with style name + branding |
| Gallery | Local gallery + Motiontography spotlight (rate-limited) |
| Challenges | Weekly creative challenges (static list) |
| Settings | Watermark toggle, privacy controls, Pro status, about/links |
| Paywall | Modal: pricing cards, benefits list, subscribe/restore |

---

## Style Packs (15 styles, 6 categories)

### Free Styles (6)

#### Caricature
- Classic (big-head, fun exaggeration)
- Subtle (flattering, light touch)

#### Illustrated
- Comic Book (ink + halftone)
- Pop Art (Warhol/Lichtenstein)

#### Drawn
- Pencil — Clean (precise lines, white paper)

#### Painted
- Watercolor (soft washes, luminous)

### Pro-Only Styles (9)

#### Caricature
- Editorial (newspaper illustration style)

#### Illustrated
- Anime-Inspired (original, no franchise mimicry)

#### Drawn
- Pencil — Gritty (charcoal, aged paper)

#### Painted
- Oil Painting (impasto, gallery-quality)

#### Digital
- Cyberpunk Neon (neon-lit, futuristic)

#### Pro
- Magazine Cover (custom text, masthead, cover lines)
- Pro Headshot (studio-lit, clean background)
- Dreamy Portrait (ethereal, inspirational)
- Editorial Fashion (high-contrast, glossy)

---

## Customization Controls

### Common (all styles)
| Control | Type | Range | Default |
|---------|------|-------|---------|
| Intensity | Slider | 0-100 | 50 |
| Face Fidelity | Slider | 0-100 | 70 |
| Background Strength | Slider | 0-100 | 50 |
| Color Mood | Picker | warm/cool/vibrant/mono | warm |
| Detail | Slider | 0-100 | 50 |
| Keep Identity | Toggle | on/off | on |
| Preserve Skin Tone | Toggle | on/off | on |

### Comic Book
- Line Weight (slider, 0-100)
- Halftone Amount (slider, 0-100)

### Magazine Cover
- Masthead Text (text, max 50 chars)
- Cover Lines (up to 4 lines, max 80 chars each)
- Issue Date (text, max 30 chars)
- Show Barcode (toggle)

### Pro Headshot
- Backdrop Color (color picker)
- Softness (slider, 0-100)
- Vignette (slider, 0-100)

---

## Image Engine Integration

### Engine: ChatGPT 5.2 Image Mode
- API endpoint: OpenAI `/v1/images/edits`
- Model: `gpt-5.2`
- Input: image (PNG) + composed prompt
- Output: base64 image or URL + moderation flags

### Prompt Composition
```
Final prompt = systemPrompt + styleRecipeTemplate(params) + userFreeformPrompt + negativeConstraints
```

### Adapter Pattern
The `ImageEngineAdapter` class provides:
- Configurable base URL, model, and timeout
- Automatic retries with exponential backoff (3 attempts)
- Response parsing with moderation flag extraction
- Clean interface for swapping endpoints

---

## API Contract

### POST /generate
```json
// Request: multipart/form-data
// Headers: X-QuipPix-Tier: free|pro (defaults to "free")
// - image: File (PNG/JPEG/WebP/HEIF, max 20MB)
// - params: JSON string
{
  "styleId": "caricature-classic",
  "sliders": {
    "intensity": 60,
    "faceFidelity": 80,
    "backgroundStrength": 40,
    "colorMood": "warm",
    "detail": 55
  },
  "toggles": {
    "keepIdentity": true,
    "preserveSkinTone": true
  },
  "userPrompt": "Create a caricature of me as a superhero chef",
  "styleOptions": {
    "comic": { "lineWeight": 60, "halftoneAmount": 50 }
  },
  "proSliders": {
    "microDetail": 70,
    "studioRelight": 50,
    "backgroundPro": 60
  },
  "outputSize": "2048x2048"
}

// Response: 202
{ "jobId": "a1b2c3d4e5f6" }

// Response: 403 (pro style with free tier)
{ "error": "Style 'oil-painting' requires QuipPix Pro" }

// Response: 403 (pro size with free tier)
{ "error": "Output size '2048x2048' requires QuipPix Pro" }
```

### GET /status/:jobId
```json
// Response: 200
{
  "jobId": "a1b2c3d4e5f6",
  "status": "done",        // queued | running | done | failed
  "progress": 100,
  "resultUrl": "https://...",  // signed URL, present when done
  "createdAt": "2026-02-03T..."
}
```

### DELETE /job/:jobId
```
// Response: 204 No Content
```

---

## Privacy Implementation

1. **EXIF Stripping**: On-device (via sharp on server, before storage)
2. **Temporary Storage**: All uploads/results stored with 1-hour TTL
3. **TTL Cleanup Job**: Runs every 10 minutes, deletes expired objects
4. **Signed URLs**: Result downloads use time-limited signed URLs (15 min)
5. **Local Gallery**: All gallery data stored on-device only
6. **Delete All**: User can clear all local data from Settings

---

## Safety Implementation

1. **Pre-generation gate**: Keyword/pattern matching blocks NSFW, violence, hate content
2. **Provider moderation**: ChatGPT 5.2 moderation flags checked post-generation
3. **Friendly refusal**: Users see a polite message + safe alternative suggestion
4. **No stored prompts**: User prompts are not persisted after job completion

---

## Motiontography Soft Promotion

All promotional content is non-blocking:
- Settings: "View Portfolio" + "Book a Real Shoot" links
- Result screen: Small footer link
- Gallery: Spotlight carousel after ~7 creations (rate-limited)
- Post-export interstitial: Max 1 per session, always skippable
- Watermark: Opt-in only (default OFF)

---

## Viral Mechanics

1. **Share Card**: Framed image with style name + "Made in QuipPix" footer
2. **Remix Template Links**: Deep links encode style + settings, recipient uses own photo
3. **Weekly Challenges**: 8 static creative challenges with suggested styles

---

## Monetization (QuipPix Pro)

### Tier Definitions

| Feature | Free | Pro |
|---------|------|-----|
| Styles | 6 free styles | All 15 styles |
| Output Size | Standard (1024x) | Standard + High-Res (2048x) + Ultra (4096x) |
| Daily Generations | 5 per day | Unlimited |
| Processing Priority | Normal (queue priority 5) | Priority (queue priority 1) |
| Advanced Controls | — | Micro Detail, Studio Relight, Background Pro sliders |
| Cooldown | 30-minute cooldown after daily limit | None |

### Pricing (via RevenueCat)
- **Monthly**: recurring subscription
- **Annual**: recurring subscription ("Best Value" badge in UI)
- **Lifetime**: one-time purchase

### Entitlement Management
- **No user accounts**: RevenueCat anonymous IDs tied to device
- **Backend trust model**: Client sends `X-QuipPix-Tier: free|pro` header; no server-side receipt verification (consistent with privacy-first, no-account architecture)
- **Client-side enforcement**: Daily generation limits tracked via AsyncStorage with date-based reset
- **Server-side enforcement**: Style and output size gating via `tierGate` middleware

### Paywall Triggers
- Tapping a Pro-only style on the Style Select screen
- Tapping a Pro-only output size or advanced slider on the Customize screen
- "Upgrade to Pro" button in Settings
- Soft upsell after 2 successful generations (shown once, dismissable)

### Soft Upsell Flow
1. User completes 2 generations as free user
2. On next save, paywall modal shown with `trigger: 'soft_upsell'`
3. User can dismiss ("Not now") — soft upsell won't show again for session
4. If user subscribes, entitlement updates immediately

---

## Direct Social Upload

### Supported Platforms
| Platform | Target Dimensions | URL Scheme | Share Method |
|----------|-------------------|------------|--------------|
| IG Story | 1080 × 1920 | `instagram-stories://` | `Share.Social.INSTAGRAM_STORIES` |
| IG Feed | 1080 × 1350 | `instagram://` | `Share.Social.INSTAGRAM` + clipboard caption |
| TikTok | 1080 × 1920 | `snssdk1233://` | General share (fallback) |
| Facebook | 1200 × 630 | `fb://` | `Share.Social.FACEBOOK` |
| X (Twitter) | 1200 × 675 | `twitter://` | `Share.Social.TWITTER` |
| Snapchat | 1080 × 1920 | `snapchat://` | General share (fallback) |

### Flow
1. User taps "Post" on the Result screen
2. Platform picker bottom-sheet appears with grid of platform icons
3. Uninstalled apps are dimmed (detected via `Linking.canOpenURL`)
4. User optionally toggles "Include QuipPix frame"
5. On platform tap: image resized to target dimensions via `react-native-compressor`
6. `react-native-share` opens platform-specific share intent
7. Caption pre-filled where supported; clipboard fallback + toast otherwise
8. Posting is free for all users (maximizes virality)

---

## Data Model

### GalleryItem (local storage)
```typescript
{
  id: string;
  localUri: string;
  styleId: StyleId;
  styleName: string;
  createdAt: string;
  params: GenerateParams;
}
```

### Job (server memory / Redis)
```typescript
{
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  inputKey: string;   // S3 key
  resultKey?: string; // S3 key
  error?: string;
  createdAt: string;
}
```
