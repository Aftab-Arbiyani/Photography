# Deployment Guide

Aperture is a pnpm + Turborepo monorepo: **NestJS API** + **Next.js frontend** + Postgres + Redis, fronted by **Nginx** and run under **PM2** (or Docker/Kubernetes).

## Topology

```
            ┌─────────── CDN (images, _next/static) ───────────┐
Client ──▶ Nginx (TLS, gzip, rate-limit) ──┬──▶ Next.js (SSR/stream)  :3000  (PM2 cluster ×N)
                                            └──▶ NestJS API           :4000  (PM2 cluster ×N)
                                                   │
                                  ┌────────────────┼─────────────────┐
                              Postgres 16        Redis 7        S3 / MinIO (images + private deliverables)
                                                   ▲
                                       aperture-cron worker (single instance, RUN_CRON=true)
```

## 1. Provision

- **Postgres 16** with the `uuid-ossp` and `citext` extensions (created by the first migration / docker init).
- **Redis 7** (cache, sessions/denylist, pub/sub for realtime SSE).
- **Object storage**: AWS S3 (or MinIO). Two logical namespaces: public previews and `deliverables/*` + `tmp/watermarked/*` (private, served only via signed URLs).
- **CDN** in front of the public image bucket and `/_next/static`.

## 2. Configure

Copy `.env.example` → `.env` and set production values. **Required:** `JWT_*` secrets (≥32 chars, unique per environment), `DATABASE_*`, `REDIS_*`. **For commerce/membership:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, plan `stripePriceId`s. **For storage:** `AWS_*`. **For mail:** `MAIL_*`.

Point Stripe webhooks at:

- `POST /api/v1/payments/webhook` (orders)
- `POST /api/v1/subscriptions/webhook` (memberships)

## 3. Build

```bash
pnpm install --frozen-lockfile
pnpm build            # turbo: builds packages → backend → frontend
```

## 4. Migrate (always before starting new code)

```bash
pnpm --filter @photography/backend migration:run
pnpm --filter @photography/backend seed   # first deploy only (admin, plans, settings, CMS)
```

Migrations are forward-only and additive across phases (`EnableExtensions` → `InitSchema` → `MarketplacePhase3` → `CommunityPhase4` → `ScalePhase5` → `AddScaleIndexes`). CI should run `migration:run` against a disposable DB to verify before deploy.

## 5. Run

### PM2 (VM / bare metal)

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save && pm2 startup
```

- `aperture-backend` — API in cluster mode (`RUN_CRON=false`).
- `aperture-cron` — **single** instance owning scheduled jobs (`RUN_CRON=true`).
- `aperture-frontend` — Next.js in cluster mode.

### Docker Compose

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

Add the Nginx service mounting `docker/nginx/nginx.conf` + TLS certs for production.

### Nginx

Use `docker/nginx/nginx.conf` — TLS termination, gzip, edge rate-limit, **SSE buffering disabled** for `/notifications/stream`, long-cache for `/_next/static`.

## 6. Scaling notes (one → thousands of photographers)

- **API**: stateless → scale horizontally behind Nginx/ALB. Sessions live in Postgres (refresh tokens) + Redis, not memory.
- **Cron**: exactly one worker (`RUN_CRON`); for multi-region add a Redis lock.
- **DB**: composite indexes added in `AddScaleIndexes`. Add read replicas for analytics/search; move search to Postgres FTS or OpenSearch as volume grows.
- **Images/millions of files**: all derivatives are CDN-served; private deliverables are signed-URL only. Offload watermark/ZIP to a queue (BullMQ) — see roadmap.
- **Redis**: caches search/discovery/settings/flags/membership; use a managed cluster.

## 7. Observability

- **Health**: `GET /api/v1/health` (Postgres + Redis) — wire to your load balancer + uptime monitor.
- **Logs**: pino JSON to stdout → ship to your aggregator (Loki/Datadog/CloudWatch).
- **Audit**: `audit_logs` table (admin: `GET /api/v1/audit-logs`).
- **Swagger**: `/api/v1/docs` (gate behind auth/IP in production, or `ENABLE_SWAGGER`).

See [`docs/PRODUCTION-CHECKLIST.md`](PRODUCTION-CHECKLIST.md) before go-live.
