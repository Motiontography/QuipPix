# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Production stage
FROM node:20-alpine AS runtime

RUN addgroup -S quippix && adduser -S quippix -G quippix

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data && chown -R quippix:quippix /app

USER quippix

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
