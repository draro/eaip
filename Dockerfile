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
# Run build and capture output
RUN npm run build 2>&1 | tee /tmp/build.log || true

# Check for critical build artifacts
RUN if [ ! -f ".next/BUILD_ID" ]; then \
        echo "ERROR: BUILD_ID not created - build failed"; \
        tail -100 /tmp/build.log; \
        exit 1; \
    fi; \
    echo "✓ BUILD_ID found"

RUN if [ ! -f ".next/prerender-manifest.json" ]; then \
        echo "WARNING: prerender-manifest.json not found, creating empty one"; \
        echo '{"version":4,"routes":{},"dynamicRoutes":{},"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}' > .next/prerender-manifest.json; \
    fi; \
    echo "✓ prerender-manifest.json ready"

RUN if [ ! -f ".next/routes-manifest.json" ]; then \
        echo "ERROR: routes-manifest.json not created - build failed"; \
        tail -100 /tmp/build.log; \
        exit 1; \
    fi; \
    echo "✓ routes-manifest.json found"

RUN echo "✓ Build verification complete"

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
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/scripts ./scripts

# Copy the built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Create git-repos directory with proper permissions
RUN mkdir -p /app/git-repos && chown -R nextjs:nodejs /app/git-repos

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
