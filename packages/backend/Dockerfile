# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache build-base python3

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Remove dev dependencies so only production deps are copied to runtime
RUN npm prune --omit=dev

# Production stage
FROM node:20-alpine AS runtime

RUN addgroup -S quippix && adduser -S quippix -G quippix

WORKDIR /app

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY public ./public

RUN mkdir -p /app/data && chown -R quippix:quippix /app

USER quippix

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
