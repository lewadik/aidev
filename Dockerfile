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

# Create non-root user for security
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

# Copy production deps and build output
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/next.config.* ./

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Environment
ENV PORT=3000 \
    WS_PORT=3001

# Keep uploads persisted
VOLUME ["/app/uploads"]

EXPOSE 3000
EXPOSE 3001

CMD ["npm", "run", "start"]
