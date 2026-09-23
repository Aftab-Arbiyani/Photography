# syntax=docker/dockerfile:1
# ----------------------------------------------------------------------------
# Backend (NestJS) — multi-stage build for the pnpm monorepo.
# Build context is the repo root.
# ----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Build tools required for native deps (argon2). sharp ships prebuilt binaries.
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ---- install (cached on lockfile) ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/ui/package.json packages/ui/
COPY apps/backend/package.json apps/backend/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- build ----
FROM deps AS build
COPY . .
RUN pnpm --filter @photography/types --filter @photography/utils build
RUN pnpm --filter @photography/backend build
# Prune dev dependencies for the runtime image.
RUN pnpm --filter @photography/backend deploy --prod /app/deploy

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app
COPY --from=build /app/deploy ./
# Keep the full workspace layout the start command expects.
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/package.json ./package.json
EXPOSE 4000
CMD ["node", "apps/backend/dist/main.js"]
