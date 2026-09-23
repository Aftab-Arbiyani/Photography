# Production Readiness Checklist

Run through this before exposing Aperture to real traffic / real money.

## Secrets & config

- [ ] All `JWT_*` secrets are unique, random, ≥32 chars (rotate from `.env.example` placeholders)
- [ ] `DATABASE_SYNCHRONIZE=false` (migrations only)
- [ ] `NODE_ENV=production`; Swagger gated (`ENABLE_SWAGGER` unset or auth-protected)
- [ ] `CORS_ORIGINS` restricted to real frontend origin(s)
- [ ] Stripe **live** keys + both webhook secrets set; webhooks verified reaching `/payments/webhook` and `/subscriptions/webhook`
- [ ] S3 buckets: public previews vs private `deliverables/*`; bucket policy denies public read on deliverables
- [ ] SMTP/live mail provider configured; `MAIL_FROM_ADDRESS` on a verified domain

## Database

- [ ] Migrations run on a disposable copy in CI, then prod (`migration:run`)
- [ ] Seed run once (admin, plans, settings, CMS) — then rotate the admin password
- [ ] `AddScaleIndexes` applied; `EXPLAIN ANALYZE` the gallery/search/revenue hot queries
- [ ] Backups + PITR enabled; restore tested
- [ ] Connection pool sized for instance count

## Security

- [ ] Helmet on (default), HSTS at Nginx, TLS 1.2/1.3 only
- [ ] Rate limiting: Throttler (app) + Nginx `limit_req` (edge); tighter limits on auth + downloads
- [ ] Bearer-token auth (no cookie auth → CSRF N/A); if cookies are added, enable CSRF guard
- [ ] XSS: `@SanitizeText()` on all user-generated content (comments/reviews/bios/reports/CMS meta)
- [ ] SQL injection: all queries parameterized (TypeORM); no string-interpolated SQL
- [ ] Audit log interceptor active; `audit_logs` retained/exported
- [ ] Signed download URLs short-lived; download limits + expiry enforced; buyer-email watermark on
- [ ] Secrets in a manager (not committed); `.env` never in the image

## Performance & scale

- [ ] CDN in front of images + `/_next/static`; `Cache-Control: immutable` on hashed assets
- [ ] Redis managed/HA; caches: search (60s), discovery (5m), settings/flags, membership
- [ ] API stateless + horizontally scaled; **cron on exactly one** worker (`RUN_CRON`)
- [ ] Next.js: SSR + streaming, code-splitting (default), `next/image` for responsive images
- [ ] Health check wired to LB; graceful shutdown (`enableShutdownHooks`) verified

## Money & compliance

- [ ] Revenue split / commission rates reviewed per photographer
- [ ] Payout flow tested (request → admin process → balance decrement)
- [ ] Refund flow tested (Stripe refund → entitlement deactivation)
- [ ] Tax (`COMMERCE_TAX_BASIS_POINTS`) configured for jurisdiction; invoices retained
- [ ] Terms / Privacy CMS pages published

## Observability & ops

- [ ] Structured logs shipped to aggregator; error alerting (Sentry/equiv)
- [ ] Uptime + health monitoring; on-call runbook
- [ ] Metrics/tracing (OpenTelemetry) — **wired** (`initObservability`); set `OTEL_EXPORTER_OTLP_ENDPOINT` + `SENTRY_DSN` in prod
- [ ] PM2 `startup` + `save` (or k8s liveness/readiness on `/health`)
- [ ] Load test the gallery, search, checkout, and download paths

## Tests / CI

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green in CI
- [ ] Migration check in CI; e2e for auth → purchase → entitlement → download
- [ ] Lighthouse 90+ on key frontend routes (after frontend phase)
