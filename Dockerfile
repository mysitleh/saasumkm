# saasumkm — Next.js 16 (standalone) + Prisma 7 + libSQL (file SQLite on a volume).
# Multi-stage: deps → build (prisma generate + next build) → slim runner.

# ---- deps: install node_modules (with dev deps for the build) ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json* ./
# Skip the postinstall "prisma generate" here (schema not copied yet); we run it explicitly in the build stage.
RUN npm ci --ignore-scripts

# ---- build: generate Prisma client + compile Next standalone ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma client must be generated against the schema before next build.
RUN npx prisma generate
# Build needs SOME env to satisfy zod validation at import time. These are
# build-time placeholders only; real values are injected at runtime.
ENV NODE_ENV=production \
    DATABASE_URL="file:/app/prisma/dev.db" \
    NEXTAUTH_SECRET="build-time-placeholder-secret-32chars-min"
RUN npm run build

# ---- runner: minimal standalone image ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# Next standalone bundle + static assets + public.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Prisma generated client + schema (standalone traces most, but ship the engine + schema explicitly).
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma

# Writable dir for the SQLite file (mounted as a volume in compose).
RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app/prisma
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
