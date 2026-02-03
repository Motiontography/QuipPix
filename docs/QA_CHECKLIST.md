# QuipPix — QA Checklist

## Backend Tests (Automated)

### Unit Tests
- [x] `moderation.test.ts` — Prompt moderation allows clean prompts
- [x] `moderation.test.ts` — Prompt moderation blocks NSFW content
- [x] `moderation.test.ts` — Prompt moderation blocks violence keywords
- [x] `moderation.test.ts` — Prompt moderation blocks hate speech
- [x] `moderation.test.ts` — Provider flags pass when not flagged
- [x] `moderation.test.ts` — Provider flags block when flagged
- [x] `promptComposer.test.ts` — Composes caricature prompt with all fields
- [x] `promptComposer.test.ts` — Includes user free-form prompt
- [x] `promptComposer.test.ts` — Includes negative constraints
- [x] `promptComposer.test.ts` — Maps comic-specific options
- [x] `promptComposer.test.ts` — Maps magazine-specific options
- [x] `promptComposer.test.ts` — Omits identity clause when toggle off
- [x] `styleRecipes.test.ts` — All 15 styles defined
- [x] `styleRecipes.test.ts` — Each recipe has all required fields
- [x] `styleRecipes.test.ts` — getRecipe throws for unknown style
- [x] `tierConfig.test.ts` — 6 free styles defined
- [x] `tierConfig.test.ts` — 9 pro-only styles defined
- [x] `tierConfig.test.ts` — No overlap between free and pro style sets
- [x] `tierConfig.test.ts` — isStyleAllowed allows free styles for free tier
- [x] `tierConfig.test.ts` — isStyleAllowed blocks pro styles for free tier
- [x] `tierConfig.test.ts` — isStyleAllowed allows all styles for pro tier
- [x] `tierConfig.test.ts` — isSizeAllowed allows standard sizes for free tier
- [x] `tierConfig.test.ts` — isSizeAllowed blocks high-res sizes for free tier
- [x] `tierConfig.test.ts` — isSizeAllowed allows all sizes for pro tier
- [x] `tierGate.test.ts` — Defaults to free tier when no header
- [x] `tierGate.test.ts` — Parses explicit free/pro headers
- [x] `tierGate.test.ts` — Case-insensitive header parsing
- [x] `tierGate.test.ts` — Unknown header values default to free

---

## Manual QA Checklist

### Photo Upload
- [ ] Upload from photo library works (iOS)
- [ ] Upload from photo library works (Android)
- [ ] Camera capture works (iOS)
- [ ] Camera capture works (Android)
- [ ] Large photos (>10MB) handled without crash
- [ ] Unsupported formats show error message
- [ ] HEIF photos accepted and converted
- [ ] Portrait and landscape orientations handled

### Style Selection
- [ ] All 15 styles visible in grid
- [ ] Category tabs filter correctly
- [ ] Style cards display name, icon, description
- [ ] Pro-only styles show "PRO" badge overlay for free users
- [ ] Tapping a free style navigates to Customize screen
- [ ] Tapping a pro-only style as free user shows Paywall modal
- [ ] Tapping a pro-only style as pro user navigates to Customize screen
- [ ] Back button returns to Style Select

### Customization
- [ ] All 5 common sliders work
- [ ] Slider values update in real-time
- [ ] Color mood picker switches between 4 options
- [ ] Keep Identity toggle works
- [ ] Preserve Skin Tone toggle works
- [ ] User prompt text input works (max 500 chars)
- [ ] Character counter updates
- [ ] Comic Book: line weight + halftone sliders appear
- [ ] Magazine Cover: masthead, cover lines, date, barcode toggle appear
- [ ] Pro Headshot: backdrop color, softness, vignette appear
- [ ] Other styles: no style-specific controls shown
- [ ] Advanced Controls section visible with Micro Detail, Studio Relight, Background Pro sliders
- [ ] Pro sliders disabled with lock overlay + PRO badge for free users
- [ ] Tapping locked pro slider shows Paywall modal
- [ ] Pro sliders functional for pro users
- [ ] Output Size picker shows Standard (1K), High-Res (2K), Ultra (4K)
- [ ] High-Res and Ultra show PRO badge for free users
- [ ] Tapping pro output size as free user shows Paywall modal
- [ ] DailyLimitBanner shows remaining generations for free users
- [ ] DailyLimitBanner hidden for pro users
- [ ] Generate button navigates to Generating screen

### Generation
- [ ] Progress animation plays smoothly
- [ ] Fun messages cycle
- [ ] Progress bar updates from API polling
- [ ] Successful generation navigates to Result screen
- [ ] Failed generation shows error message
- [ ] Error screen has "Go Back" button
- [ ] Moderation refusal shows friendly message
- [ ] Free user: daily limit check before generation starts
- [ ] Free user at daily limit: error shown with "Upgrade to Pro" button
- [ ] Free user: `X-QuipPix-Tier: free` header sent to API
- [ ] Pro user: `X-QuipPix-Tier: pro` header sent to API
- [ ] Pro user: no daily limit check
- [ ] After successful generation: daily count incremented for free users
- [ ] Backend returns 403 for pro-only style with free tier header

### Result Screen
- [ ] Generated image displays correctly
- [ ] Save button adds to local gallery
- [ ] Share button opens system share sheet
- [ ] Post button opens Platform Picker bottom-sheet
- [ ] Remix Link shares deep link with style settings
- [ ] Try Again navigates back to Generating
- [ ] Done button returns to Home
- [ ] Watermark appears when enabled
- [ ] Watermark hidden when disabled (default)
- [ ] Footer link to motiontography.com works
- [ ] Soft upsell: after 2 generations, free user sees paywall on save (once)
- [ ] Soft upsell dismissal prevents re-showing

### Gallery
- [ ] Saved images appear in reverse chronological order
- [ ] Image thumbnails load
- [ ] Style name and date shown
- [ ] Long press shows delete option
- [ ] Clear All shows confirmation dialog
- [ ] Motiontography Spotlight appears after ~7 creations
- [ ] Spotlight appears at most once per cycle
- [ ] Spotlight link opens motiontography.com
- [ ] Empty state shown when no creations

### Challenges
- [ ] 8 challenges listed
- [ ] Each shows icon, title, description

### Settings
- [ ] QuipPix Pro section visible at top
- [ ] Free user: shows benefits promo text and "Upgrade to Pro" button
- [ ] Free user: "Upgrade to Pro" opens Paywall modal
- [ ] Pro user: shows plan type (Monthly/Annual/Lifetime)
- [ ] Pro user: shows renewal date if subscription
- [ ] Pro user: "Manage Subscription" opens platform subscription settings
- [ ] Restore Purchases button works (always visible)
- [ ] Restore Purchases updates entitlement state
- [ ] Watermark toggle works and persists
- [ ] Delete All Local Data works
- [ ] View Portfolio link opens motiontography.com
- [ ] Book a Real Shoot link opens motiontography.com/contact
- [ ] Privacy Policy link works
- [ ] Terms of Service link works
- [ ] Version number displayed

### Interstitial (Soft Promo)
- [ ] Appears once per session only
- [ ] Appears after first successful export
- [ ] Skip button always visible and works
- [ ] CTA opens motiontography.com
- [ ] Does not block usage

### Privacy
- [ ] EXIF metadata stripped (verify with exiftool on uploaded file)
- [ ] Server deletes files after TTL
- [ ] Signed URLs expire after 15 minutes
- [ ] No user accounts or tracking

### Safety
- [ ] NSFW prompt blocked with friendly message
- [ ] Violence prompt blocked
- [ ] Hate speech prompt blocked
- [ ] Provider-flagged content blocked post-generation
- [ ] Safe alternative suggested on block

### Performance
- [ ] Home screen loads in <1s
- [ ] Style grid scrolls smoothly
- [ ] Slider adjustments are lag-free
- [ ] Generation polling doesn't freeze UI
- [ ] Gallery with 50+ items scrolls smoothly

### Deep Links
- [ ] Remix link format: https://quippix.app/remix?t={encoded_params}
- [ ] Link opens app (when installed)
- [ ] Link opens app store (when not installed)
- [ ] Decoded params pre-fill style + settings

### Edge Cases
- [ ] App handles network errors gracefully
- [ ] App handles server downtime (health check fails)
- [ ] App handles very slow generation (timeout at 3 min)
- [ ] App handles rapid back/forward navigation
- [ ] App handles device rotation (if supported)
- [ ] App works on iOS 15+ and Android 10+
- [ ] App works on small screens (iPhone SE)
- [ ] App works on tablets

### Paywall
- [ ] Paywall modal appears when tapping pro-only style (free user)
- [ ] Paywall modal appears when tapping pro-only output size (free user)
- [ ] Paywall modal appears when tapping locked pro slider (free user)
- [ ] Paywall modal appears from "Upgrade to Pro" in Settings
- [ ] Paywall modal appears on soft upsell trigger (after 2 generations)
- [ ] Paywall does NOT appear on first app launch
- [ ] Paywall "Not now" / close button always visible and functional
- [ ] 3 pricing cards load from RevenueCat (Monthly, Annual, Lifetime)
- [ ] Annual plan shows "Best Value" badge and is default-selected
- [ ] Purchase flow completes successfully (sandbox testing)
- [ ] After purchase: entitlement updates, paywall closes, pro features unlock
- [ ] Restore Purchases recovers pro entitlement
- [ ] Paywall fires `paywall_shown` analytics event
- [ ] Successful purchase fires `paywall_converted` event
- [ ] Dismissal fires `paywall_dismissed` event
- [ ] Paywall trigger parameter tracked correctly (settings, soft_upsell, style_gate, etc.)

### Daily Limits (Free Tier)
- [ ] Free user: 5 generations per day
- [ ] Daily limit resets at midnight (date change)
- [ ] DailyLimitBanner shows remaining count accurately
- [ ] At limit: generation blocked with clear error message
- [ ] At limit: "Upgrade to Pro" button shown
- [ ] Pro user: no daily limit, banner hidden
- [ ] Limit fires `daily_limit_reached` analytics event

### Social Upload (Platform Picker)
- [ ] "Post" button visible on Result screen
- [ ] Platform picker bottom-sheet slides up on tap
- [ ] All 6 platforms displayed: IG Story, IG Feed, TikTok, Facebook, X, Snapchat
- [ ] Uninstalled apps appear dimmed
- [ ] IG Story: image resized to 1080x1920, opens Instagram Stories intent
- [ ] IG Feed: image shared, caption copied to clipboard, toast shown
- [ ] TikTok: general share fallback with clipboard caption
- [ ] Facebook: image shared via Facebook share intent
- [ ] X (Twitter): image shared via Twitter share intent with caption
- [ ] Snapchat: general share fallback with clipboard caption
- [ ] "Include QuipPix frame" toggle works
- [ ] Cancel/close button dismisses picker
- [ ] Platform selection fires `post_platform_selected` analytics event
- [ ] Graceful fallback to general share on platform-specific failure

### Analytics Events
- [ ] `paywall_shown` fires when paywall modal opens
- [ ] `paywall_converted` fires on successful purchase
- [ ] `paywall_dismissed` fires on paywall close without purchase
- [ ] `share_clicked` fires when "Post" button tapped
- [ ] `post_platform_selected` fires with platform ID when platform chosen
- [ ] `generation_completed` fires after successful generation
- [ ] `daily_limit_reached` fires when free user hits daily limit
- [ ] Events include correct metadata (platform, trigger, etc.)
- [ ] Events are non-identifying (no user IDs, no PII)

---

## API Tests (curl)

### Health Check
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"quippix-api","timestamp":"..."}
```

### Generate (requires Redis + MinIO + API key)
```bash
curl -X POST http://localhost:3000/generate \
  -F "image=@test-photo.png" \
  -F 'params={"styleId":"caricature-classic","sliders":{"intensity":60,"faceFidelity":80,"backgroundStrength":40,"colorMood":"warm","detail":55},"toggles":{"keepIdentity":true,"preserveSkinTone":true},"userPrompt":"Make me look like a chef"}'
# Expected: {"jobId":"..."}
```

### Poll Status
```bash
curl http://localhost:3000/status/{jobId}
# Expected: {"jobId":"...","status":"...","progress":...}
```

### Delete Job
```bash
curl -X DELETE http://localhost:3000/job/{jobId}
# Expected: 204 No Content
```

### Tier Gating
```bash
# Free tier with pro-only style → 403
curl -X POST http://localhost:3000/generate \
  -H "X-QuipPix-Tier: free" \
  -F "image=@test-photo.png" \
  -F 'params={"styleId":"oil-painting","sliders":{"intensity":50,"faceFidelity":70,"backgroundStrength":50,"colorMood":"warm","detail":50},"toggles":{"keepIdentity":true,"preserveSkinTone":true}}'
# Expected: 403 {"error":"Style 'oil-painting' requires QuipPix Pro"}

# Free tier with free style → 202
curl -X POST http://localhost:3000/generate \
  -H "X-QuipPix-Tier: free" \
  -F "image=@test-photo.png" \
  -F 'params={"styleId":"caricature-classic","sliders":{"intensity":50,"faceFidelity":70,"backgroundStrength":50,"colorMood":"warm","detail":50},"toggles":{"keepIdentity":true,"preserveSkinTone":true}}'
# Expected: 202 {"jobId":"..."}

# Pro tier with pro-only style → 202
curl -X POST http://localhost:3000/generate \
  -H "X-QuipPix-Tier: pro" \
  -F "image=@test-photo.png" \
  -F 'params={"styleId":"oil-painting","sliders":{"intensity":50,"faceFidelity":70,"backgroundStrength":50,"colorMood":"warm","detail":50},"toggles":{"keepIdentity":true,"preserveSkinTone":true}}'
# Expected: 202 {"jobId":"..."}

# Free tier with pro output size → 403
curl -X POST http://localhost:3000/generate \
  -H "X-QuipPix-Tier: free" \
  -F "image=@test-photo.png" \
  -F 'params={"styleId":"caricature-classic","sliders":{"intensity":50,"faceFidelity":70,"backgroundStrength":50,"colorMood":"warm","detail":50},"toggles":{"keepIdentity":true,"preserveSkinTone":true},"outputSize":"2048x2048"}'
# Expected: 403 {"error":"Output size '2048x2048' requires QuipPix Pro"}

# No tier header → defaults to free
curl -X POST http://localhost:3000/generate \
  -F "image=@test-photo.png" \
  -F 'params={"styleId":"caricature-classic","sliders":{"intensity":50,"faceFidelity":70,"backgroundStrength":50,"colorMood":"warm","detail":50},"toggles":{"keepIdentity":true,"preserveSkinTone":true}}'
# Expected: 202 (defaults to free, free style allowed)
```

### Rate Limiting
```bash
# Send 31 requests rapidly
for i in $(seq 1 31); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/health; done
# Expected: last request returns 429
```
