# QuipPix

AI-powered photo stylization app that transforms user photos into stylized art using ChatGPT 5.2 Image Mode. Built with React Native (iOS + Android) and a Fastify backend.

## Features

- **15 art styles** across 6 categories: caricatures, illustrated, drawn, painted, digital, and pro
- **Freemium model** — 6 free styles with 5 daily generations; Pro unlocks all 15 styles, high-res/ultra exports, priority processing, and advanced controls
- **Full creative control** — sliders for intensity, detail, face fidelity, color mood, and more
- **Direct social posting** — share to Instagram Stories, IG Feed, TikTok, Facebook, X, and Snapchat with auto-sized images
- **Remix links** — deep links that encode style + settings so friends can try them with their own photos
- **Privacy-first** — no account required, EXIF stripped, server storage auto-deleted within 1 hour

## Architecture

```
packages/
  backend/     Fastify API + BullMQ job queue + S3 storage
  mobile/      React Native app (iOS + Android)
docs/          Product spec, store copy, QA checklist, deployment guide
```

### Backend

- **Fastify** REST API with multipart upload
- **BullMQ** job queue on Redis with tier-based priority (pro=1, free=5)
- **S3-compatible** temporary storage with TTL cleanup
- **OpenAI** ChatGPT 5.2 Image Mode integration via adapter pattern
- **Tier gating** middleware — validates style and output size access per tier
- **Zod** request validation, **pino** structured logging

### Mobile

- **React Native 0.73** with TypeScript
- **Zustand** + AsyncStorage for state management
- **RevenueCat** (`react-native-purchases`) for anonymous in-app purchases
- **React Navigation** with modal paywall presentation
- **react-native-share** for platform-specific social posting
- **react-native-compressor** for platform-optimized image resizing

## Getting Started

### Prerequisites

- Node.js >= 20
- Redis
- S3-compatible storage (MinIO for local dev)
- OpenAI API key with ChatGPT 5.2 Image Mode access
- Xcode 15+ (iOS) / Android Studio (Android)

### Setup

```bash
# Install dependencies
npm install

# Start Redis
brew services start redis
# or: docker run -d -p 6379:6379 redis:7-alpine

# Start MinIO
docker run -d -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"

# Create bucket
brew install minio/stable/mc
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/quippix-temp

# Configure backend
cp packages/backend/.env.example packages/backend/.env
# Edit .env with your IMAGE_ENGINE_API_KEY

# Start backend
npm run backend:dev

# Start mobile (iOS)
cd packages/mobile/ios && pod install && cd ../../..
npm run mobile:ios

# Start mobile (Android)
npm run mobile:android
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run backend:dev` | Start backend in dev mode (hot reload) |
| `npm run backend:build` | Build backend for production |
| `npm run backend:start` | Start production backend |
| `npm run backend:test` | Run backend tests |
| `npm run mobile:start` | Start Metro bundler |
| `npm run mobile:ios` | Run iOS app |
| `npm run mobile:android` | Run Android app |
| `npm run mobile:test` | Run mobile tests |
| `npm test` | Run all tests |
| `npm run lint` | Lint all packages |

## API

### POST /generate

Submit a photo for stylization. Accepts multipart form data with an image file and JSON params.

```
Headers: X-QuipPix-Tier: free|pro
```

Returns `202` with a `jobId` for polling.

### GET /status/:jobId

Poll for generation progress. Returns status (`queued`, `running`, `done`, `failed`), progress percentage, and result URL when complete.

### DELETE /job/:jobId

Cancel and clean up a job.

### GET /health

Health check endpoint.

## Free vs Pro

| | Free | Pro |
|---|---|---|
| Styles | 6 | All 15 |
| Output size | Standard (1K) | + High-Res (2K), Ultra (4K) |
| Daily generations | 5 | Unlimited |
| Queue priority | Normal | Priority |
| Advanced controls | — | Micro Detail, Studio Relight, Background Pro |

## Docs

- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — Full product specification
- [`docs/STORE_COPY.md`](docs/STORE_COPY.md) — App store listings and privacy disclosures
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — Manual and automated QA checklist
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Deployment instructions and RevenueCat setup

## License

Proprietary. All rights reserved.

---

Built by [Motiontography](https://motiontography.com)
