# QuipPix — Deployment Instructions

## Prerequisites
- Node.js >= 20
- Yarn >= 1.22 (classic)
- Redis (for BullMQ job queue)
- S3-compatible storage (MinIO for local, AWS S3 for production)
- OpenAI API key with ChatGPT 5.2 Image Mode access
- For mobile: Xcode 15+ (iOS), Android Studio (Android)
- RevenueCat account (for in-app purchases)

---

## Local Development

### 1. Clone & Install
```bash
cd QuipPix
yarn install
```

### 2. Start Redis
```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Or Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 3. Start MinIO (S3-compatible local storage)
```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```

Create the bucket:
```bash
# Install MinIO client
brew install minio/stable/mc

mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/quippix-temp
```

### 4. Configure Backend
```bash
cp packages/backend/.env.example packages/backend/.env
# Edit .env with your IMAGE_ENGINE_API_KEY
```

### 5. Start Backend
```bash
yarn backend:dev
# Server starts at http://localhost:3000
# Health check: GET http://localhost:3000/health
```

### 6. Start Mobile App
```bash
# iOS
cd packages/mobile
npx pod-install  # Install CocoaPods dependencies
cd ../..
yarn mobile:ios

# Android
yarn mobile:android

# Metro bundler only
yarn mobile:start
```

---

## Production Deployment

### Backend (Cloud)

#### Option A: Docker
```dockerfile
# Dockerfile (place in packages/backend/)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
COPY packages/backend/package.json packages/backend/
RUN yarn install --frozen-lockfile
COPY packages/backend/ packages/backend/
COPY tsconfig.base.json ./
RUN yarn backend:build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

#### Option B: AWS / Railway / Render
1. Set environment variables from `.env.example`
2. Build: `yarn backend:build`
3. Start: `yarn backend:start`
4. Ensure Redis is accessible (AWS ElastiCache, Railway Redis, etc.)
5. Ensure S3 bucket exists with appropriate IAM permissions

#### Production Environment Variables
```
NODE_ENV=production
IMAGE_ENGINE_API_KEY=sk-prod-key
IMAGE_ENGINE_BASE_URL=https://api.openai.com/v1
IMAGE_ENGINE_MODEL=gpt-5.2
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=quippix-prod-temp
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=secret
S3_FORCE_PATH_STYLE=false
STORAGE_TTL_SECONDS=3600
SIGNED_URL_EXPIRY_SECONDS=900
RATE_LIMIT_MAX=30
RATE_LIMIT_WINDOW_MS=60000
MODERATION_ENABLED=true
FREE_DAILY_GENERATION_LIMIT=5
FREE_COOLDOWN_MINUTES=30
```

#### S3 Lifecycle Rule (recommended)
Set an S3 lifecycle rule to auto-delete objects older than 2 hours as a safety net:
```json
{
  "Rules": [
    {
      "ID": "auto-delete-temp",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "Expiration": { "Days": 1 }
    }
  ]
}
```

### Mobile (App Stores)

#### iOS
1. Open `packages/mobile/ios/QuipPix.xcworkspace` in Xcode
2. Set bundle identifier: `com.motiontography.quippix`
3. Configure signing with your Apple Developer account
4. Set API base URL in `src/api/client.ts` for production
5. Archive and upload to App Store Connect

#### Android
1. Generate signing key:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore packages/mobile/android/app/release.keystore \
     -alias quippix -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Set `applicationId "com.motiontography.quippix"` in `android/app/build.gradle`
3. Set API base URL in `src/api/client.ts` for production
4. Build release:
   ```bash
   cd packages/mobile/android
   ./gradlew bundleRelease
   ```
5. Upload `.aab` to Google Play Console

---

## RevenueCat Setup (In-App Purchases)

### 1. RevenueCat Dashboard

1. Create a project at [app.revenuecat.com](https://app.revenuecat.com)
2. Add an iOS app:
   - Bundle ID: `com.motiontography.quippix`
   - App Store Connect Shared Secret: from App Store Connect > App > App Information > Shared Secret
3. Add an Android app:
   - Package Name: `com.motiontography.quippix`
   - Service Account JSON: from Google Play Console > API Access
4. Copy the **Public API Keys** (one per platform):
   - iOS: `appl_XXXXXXXX`
   - Android: `goog_XXXXXXXX`
5. Update the API keys in `packages/mobile/src/services/purchases.ts`

### 2. RevenueCat Products & Offerings

Create the following products in RevenueCat:
- **Entitlement**: `pro` (identifier used in code)
- **Products** (mapped from App Store Connect / Google Play):
  - `quippix_pro_monthly` — monthly auto-renewing subscription
  - `quippix_pro_annual` — annual auto-renewing subscription
  - `quippix_pro_lifetime` — one-time (non-consumable) purchase
- **Offering**: `default`
  - Package: Monthly → `quippix_pro_monthly`
  - Package: Annual → `quippix_pro_annual`
  - Package: Lifetime → `quippix_pro_lifetime`

### 3. App Store Connect (iOS Subscriptions)

1. Go to App Store Connect > Your App > Subscriptions
2. Create a **Subscription Group**: `QuipPix Pro`
3. Add subscriptions within the group:
   - **QuipPix Pro Monthly**
     - Product ID: `quippix_pro_monthly`
     - Duration: 1 Month
     - Set pricing per region
   - **QuipPix Pro Annual**
     - Product ID: `quippix_pro_annual`
     - Duration: 1 Year
     - Set pricing per region (typically ~20% discount vs monthly × 12)
4. Add a non-consumable in-app purchase:
   - **QuipPix Pro Lifetime**
     - Product ID: `quippix_pro_lifetime`
     - Set pricing per region
5. Under App Store Connect > App > App Information:
   - Generate a Shared Secret and add it to RevenueCat dashboard
6. Enable Sandbox testing:
   - App Store Connect > Users and Access > Sandbox Testers
   - Create a sandbox Apple ID for testing

### 4. Google Play Console (Android Subscriptions)

1. Go to Google Play Console > Your App > Monetize > Products > Subscriptions
2. Create subscriptions:
   - **QuipPix Pro Monthly**
     - Product ID: `quippix_pro_monthly`
     - Billing period: Monthly
     - Set base plan pricing per region
   - **QuipPix Pro Annual**
     - Product ID: `quippix_pro_annual`
     - Billing period: Yearly
     - Set base plan pricing per region
3. Go to Products > In-app products
   - **QuipPix Pro Lifetime**
     - Product ID: `quippix_pro_lifetime`
     - Type: Non-consumable
     - Set pricing per region
4. Under API Access:
   - Create a Service Account with financial access
   - Download the JSON key and upload to RevenueCat dashboard
5. Enable License testing:
   - Google Play Console > Settings > License testing
   - Add tester email addresses

### 5. Mobile App Configuration

After RevenueCat and store products are set up:

```bash
# Install dependency
npm install react-native-purchases --workspace=@quippix/mobile

# iOS: install pods
cd packages/mobile/ios && pod install && cd ../../..
```

Update `packages/mobile/src/services/purchases.ts` with your platform API keys:
```typescript
const IOS_API_KEY = 'appl_YOUR_KEY_HERE';
const ANDROID_API_KEY = 'goog_YOUR_KEY_HERE';
```

### 6. Testing Purchases

- **iOS**: Use Sandbox Apple ID in Settings > App Store > Sandbox Account
- **Android**: Use license tester accounts; subscriptions renew on accelerated schedule
- **RevenueCat**: Dashboard shows real-time subscription events and customer status
- Verify: purchase → entitlement update → pro features unlock → restore works

---

## Deep Links Setup

### iOS (Universal Links)
Add to `ios/QuipPix/QuipPix.entitlements`:
```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:quippix.app</string>
</array>
```

Host `/.well-known/apple-app-site-association` on quippix.app:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["TEAM_ID.com.motiontography.quippix"],
        "paths": ["/remix*"]
      }
    ]
  }
}
```

### Android (App Links)
Add to `AndroidManifest.xml`:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="quippix.app" android:pathPrefix="/remix" />
</intent-filter>
```

Host `/.well-known/assetlinks.json` on quippix.app.

---

## Running Tests
```bash
# All tests
yarn test

# Backend only
yarn backend:test

# Mobile only
yarn mobile:test
```

---

## Monitoring (Production)
- Use structured logging (pino) — pipe to your log aggregator
- Monitor `/health` endpoint
- Set alerts on job failure rate
- Track S3 storage usage for TTL compliance
- Monitor RevenueCat dashboard for subscription metrics (MRR, churn, trial conversions)
- Track tier distribution in queue (pro vs free job counts)
- Monitor 403 responses for tier gating (style/size blocks)
