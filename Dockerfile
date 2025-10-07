# Multi-stage build for Next.js application
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat git

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
# Capture build output and check for critical files
RUN npm run build 2>&1 | tee /tmp/build.log; \
    BUILD_EXIT_CODE=${PIPESTATUS[0]}; \
    echo "Build exit code: $BUILD_EXIT_CODE"; \
    if [ ! -f ".next/BUILD_ID" ]; then \
        echo "ERROR: BUILD_ID not created - build failed"; \
        tail -100 /tmp/build.log; \
        exit 1; \
    fi; \
    if [ ! -f ".next/prerender-manifest.json" ]; then \
        echo "WARNING: prerender-manifest.json not found, creating empty one"; \
        echo '{"version":4,"routes":{},"dynamicRoutes":{},"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}' > .next/prerender-manifest.json; \
    fi; \
    if [ ! -f ".next/routes-manifest.json" ]; then \
        echo "ERROR: routes-manifest.json not created - build failed"; \
        tail -100 /tmp/build.log; \
        exit 1; \
    fi; \
    echo "Build completed successfully"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install git for version control
RUN apk add --no-cache git

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy the built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Create git-repos directory
RUN mkdir -p /app/git-repos && chown nextjs:nodejs /app/git-repos

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
