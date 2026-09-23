# Phase 5 — Completion Checklist (Scale to thousands of photographers)

Extends Phases 1–4 **additively** — no existing table/endpoint rewritten. Verified: types build ✓ · backend typecheck ✓ · `nest build` ✓ · 2 migrations (`ScalePhase5` + `AddScaleIndexes`) applied to the **live Postgres** on top of existing data ✓ · seed (plans/settings/CMS) ✓ · **full app boots** (all modules + ScheduleModule + cron) ✓ · endpoints probed (plans, settings, flags, CMS, sitemap, auth-gated 401s) ✓ · **16 unit tests pass** ✓.

## Already existed (NOT duplicated)

Multi-photographer-ready schema (`photographer_id` on photos/albums/order-items); 3 roles + RBAC; audit logs (P4); pino system logs; `/health` (P3); Redis caching; Swagger; Docker/compose; Stripe (P3, reused for subscriptions).

## ✅ Completed

### Membership

- [x] `SubscriptionPlan` + `Subscription`; plans seeded (free / premium-monthly / premium-yearly)
- [x] Subscribe via **Stripe Checkout (subscription mode)** + lifecycle **webhook**; free plans activate instantly
- [x] Cancel-at-period-end; cached membership state
- [x] **Premium gating** — `@RequiresPremium()` + `PremiumGuard`

### Photographer accounts (the onboarding pipeline)

- [x] `PhotographerApplication`: apply → admin queue → **approve upgrades role USER→PHOTOGRAPHER** + creates profile (transactional)
- [x] `PhotographerProfile`: verification status/badge, **commission rate**, payout method/details
- [x] Admin verification + commission endpoints; public photographer profile

### Revenue sharing

- [x] Earnings computed **on-demand from paid `order_items` × commission** (read model — zero edits to OrdersService)
- [x] Pure, unit-tested `splitRevenue()` (gross → commission/net, reconciles exactly)
- [x] `Payout` request → admin process (paid/failed) → lifetime `paid_out_cents`; available-balance guard
- [x] Platform revenue summary (gross / commission / payouts)

### Photographer dashboard

- [x] `/revenue/me/dashboard`: earnings, balance, sales, photos/albums counts, followers, top photos

### Platform admin

- [x] `PlatformSetting` (typed KV, public/private, cached) + admin CRUD + public read
- [x] `FeatureFlag` with **percentage rollout** (deterministic) + `FeatureFlagGuard` + `@RequireFeature()`
- [x] `EmailTemplate` (DB-backed, `{{var}}` render) admin CRUD
- [x] `CmsPage` (about/terms/privacy seeded, published) — public by slug + admin CRUD
- [x] Audit dashboard (P4 `audit_logs` + admin endpoint), system logs (pino), health (`/health`)

### Cron (`@nestjs/schedule`)

- [x] Refresh discovery caches (30m), regenerate sitemap (hourly), expire lapsed subscriptions (nightly), prune old analytics (nightly)
- [x] Single-instance gating via `RUN_CRON` + PM2 dedicated cron worker

### SEO

- [x] Backend **sitemap data endpoint** (static + published photos/albums/collections, lastmod, cached, cron-refreshed) → frontend `sitemap.xml` updates automatically

### Scale / performance (backend)

- [x] `AddScaleIndexes` migration — composite/partial indexes on gallery feed, photographer portfolio, trending, marketplace, revenue rollups, order history, entitlements, notifications, analytics, subscriptions
- [x] Redis caching extended (settings, flags, membership, sitemap, discovery)

### DX / Ops

- [x] **Nginx** reverse proxy (TLS, gzip, edge rate-limit, SSE no-buffer, static long-cache)
- [x] **PM2** ecosystem (API cluster + single cron worker + frontend cluster)
- [x] **Deployment guide**, **Production checklist**, **ER diagram** (Mermaid), architecture updated
- [x] Swagger (`/api/v1/docs`) covers all new endpoints

### Fix made during verification

- [x] **Latent bug across all phases**: `SlugParamDto.slug` had no validator → under the global `whitelist`/`forbidNonWhitelisted` pipe every `:slug` route 400'd ("property slug should not exist"). Added `@Matches`/`@MaxLength`; re-probed `categories/:slug` + `pages/:slug` → 200. (First time a slug route was live-probed under the strict pipe.)

## 🔲 Pending / next phase

### Frontend (large — built against this API)

- [x] Membership/pricing pages + Stripe subscription checkout; account/membership management _(`/pricing`, `/account/membership` — see [FOLLOWUP-COMPLETION](./FOLLOWUP-COMPLETION.md))_
- [x] Photographer onboarding UI (apply, status), photographer dashboard (earnings, payouts) **+ content management** _(`/dashboard/studio` — edit/delete photos, albums, pricing tiers, deliverable upload)_
- [x] Admin console: applications, verification, commissions, payouts queue, platform settings, feature flags, email-template editor, CMS editor, audit dashboard, analytics _(commission editor, email-template editor + inline settings editor now added)_
- [x] CMS page rendering; pricing-driven UI _(`/about,/contact,/faq,/terms,/privacy` from `CmsPage`, Markdown, ISR)_
- [x] Performance: ISR for content pages, AVIF/WebP `srcset` + LQIP + lazy via `ResponsiveImage` _(SSR/code-splitting default; full Lighthouse-90 audit still recommended pre-launch)_

### Backend hardening

- [x] Stripe **Connect** for real photographer payouts _(Express onboarding + Transfer on payout; needs live keys to exercise)_
- [x] Materialized revenue ledger + nightly reconciliation _(`revenue_ledger` written at fulfillment + reconcile cron)_
- [x] BullMQ workers (image/watermark, email digests) _(media + mail queues; `RUN_WORKERS` gated)_
- [x] Postgres full-text search _(generated tsvector + GIN, `websearch_to_tsquery` + `ts_rank`)_
- [x] OpenTelemetry traces; Sentry; rate-limit storage in Redis _(all wired; OTel/Sentry no-op until configured)_
- [ ] Multi-region cron lock (Redis) if scaling cron beyond one worker

### Testing

- [ ] Integration + e2e (Supertest): onboarding → upload → sale → payout; subscription lifecycle _(public-endpoint e2e scaffold added; full flow still TODO)_
- [x] Performance/load tests (k6) on gallery, search, marketplace, discovery _(`tests/load/browse.k6.js`)_
- [x] CI pipeline: lint + typecheck + test + build + migration check _(`.github/workflows/ci.yml`)_

## 💡 Suggested improvements

1. **Stripe Connect** is the one piece that turns revenue-sharing from "records" into real automated payouts — highest commercial-value next step.
2. **Materialize the ledger** at payment time (event from OrdersService) once volume makes live aggregation costly.
3. **Search engine** (Postgres FTS first) for relevance + speed at millions of photos.
4. **Queue heavy work** (BullMQ) so uploads/downloads/emails never block requests.

## Notes

- New env vars (in `.env.example`): `@nestjs/schedule` cron is gated by `RUN_CRON`. Stripe subscription `stripePriceId`s must be set on the premium plans for paid checkout.
- 6 migrations now applied to the dev Postgres on host port **5440** (`photography-postgres`).
