# Installation Guide

## Prerequisites

| Tool             | Version                  |
| ---------------- | ------------------------ |
| Node.js          | ≥ 20.11                  |
| pnpm             | ≥ 9 (`corepack enable`)  |
| Docker + Compose | latest (for infra)       |
| PostgreSQL       | 16 (if not using Docker) |
| Redis            | 7 (if not using Docker)  |

## 1. Clone & configure

```bash
cp .env.example .env
```

Edit `.env`. **Required** before first boot:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_VERIFICATION_SECRET`, `JWT_RESET_SECRET` — each ≥ 32 chars.
- `DATABASE_*` — connection details.
- `REDIS_*` — connection details.

The backend **fails fast** at boot if any required variable is missing or invalid (Joi-validated).

## 2. Install dependencies

```bash
pnpm install
```

## 3. Start infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis mailhog
```

Postgres auto-enables the `uuid-ossp` and `citext` extensions on first init
(`docker/postgres/initdb/01-extensions.sql`).

## 4. Build shared packages

The backend & frontend consume compiled workspace packages:

```bash
pnpm --filter @photography/types --filter @photography/utils build
```

## 5. Database migrations

```bash
pnpm --filter @photography/backend build
# generate the schema migration from the entities (first time only):
pnpm --filter @photography/backend exec pnpm migration:generate src/database/migrations/InitSchema
pnpm db:migrate
```

> The repo ships an `EnableExtensions` migration that runs first. After building,
> generate the schema migration from the entity definitions, then run migrations.
> For quick local spikes you may instead set `DATABASE_SYNCHRONIZE=true` — **never in production.**

## 6. Seed initial data

```bash
pnpm --filter @photography/backend seed
```

Creates an admin account and baseline categories (idempotent).

## 7. Run

```bash
pnpm dev          # backend + frontend (watch)
# or individually
pnpm backend:dev
pnpm frontend:dev
```

- Swagger: http://localhost:4000/api/v1/docs
- Web: http://localhost:3000

## Optional integrations

### AWS S3 (image storage)

Set `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.
When unset, the backend transparently uses **local-disk storage** (`uploads/`),
served at `/api/v1/uploads/...`. For local S3, point `AWS_S3_ENDPOINT` at the
bundled MinIO (`http://localhost:9000`) and set `AWS_S3_FORCE_PATH_STYLE=true`.

### Google OAuth

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.
The Google strategy & `/auth/google` routes activate only when configured;
`GET /auth/providers` reports availability so the frontend can hide the button.

### Email

In dev, Mailhog catches all mail at http://localhost:8025. For production set
real SMTP credentials in `MAIL_*`.

## Troubleshooting

- **Boot error about a missing env var** → it’s required; see `.env.example`.
- **`type "citext" does not exist`** → the extensions migration/init didn’t run; ensure step 3 or run the `EnableExtensions` migration first.
- **`sharp`/`argon2` install issues** → ensure build tools are present (the Docker image installs `python3` + `build-essential`).
