# Multi-stage Dockerfile for Linux deployment
# Use Debian-based images to support native modules like node-pty

FROM node:20-bullseye-slim AS base
ENV NODE_ENV=production
WORKDIR /app

# ---------- Builder ----------
FROM base AS builder
# Tools for native builds (node-pty)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential git \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runner ----------
FROM base AS runner
# Copy production deps and build output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/src ./src

# Environment
ENV PORT=3000 \
    WS_PORT=3001

# Keep uploads persisted
VOLUME ["/app/uploads"]

EXPOSE 3000
EXPOSE 3001

CMD ["npm", "run", "start"]
