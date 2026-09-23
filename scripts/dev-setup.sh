#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# One-shot local development setup for the Photography Platform.
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "▸ Checking .env"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  created .env from .env.example — review JWT secrets before production!"
fi

echo "▸ Installing dependencies (pnpm)"
corepack enable >/dev/null 2>&1 || true
pnpm install

echo "▸ Starting infrastructure (postgres, redis, mailhog)"
docker compose -f docker/docker-compose.yml up -d postgres redis mailhog

echo "▸ Building shared packages"
pnpm --filter @photography/types --filter @photography/utils build

echo "▸ Building backend"
pnpm --filter @photography/backend build

echo "▸ Running migrations"
pnpm db:migrate

echo "▸ Seeding database"
pnpm --filter @photography/backend seed

echo "✅ Setup complete. Run 'pnpm dev' to start backend + frontend."
