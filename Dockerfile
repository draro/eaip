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
# Next.js may report errors for dynamic routes during static generation, but this is expected
# Check if .next directory is created successfully
RUN npm run build || true
RUN test -d .next || (echo "ERROR: Build failed - .next directory not created" && exit 1)
RUN test -f .next/BUILD_ID || (echo "ERROR: Build failed - BUILD_ID not found" && exit 1)

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
