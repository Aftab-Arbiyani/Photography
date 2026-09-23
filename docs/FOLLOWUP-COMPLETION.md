# Follow-up Completion — Roadmap Close-out

This pass implements the remaining roadmap items previously listed as pending
across the Phase 1–5 checklists. **All verified:** shared types build ✓ ·
backend typecheck ✓ · `nest build` ✓ · 3 new migrations applied to the live
Postgres ✓ · full app boots (incl. new modules) ✓ · endpoint probes pass ✓ ·
16 unit tests pass ✓ · frontend typecheck ✓ · `next build` ✓ (**49 routes**).

## Frontend (built against existing APIs)

- [x] **CMS public rendering** — `/about`, `/contact`, `/faq`, `/terms`, `/privacy`
      rendered from `CmsPage` (Markdown via `marked`), ISR (5-min revalidate), graceful
      placeholder fallback when unauthored.
- [x] **Membership / pricing** — `/pricing` (plan cards + subscribe → Stripe Checkout
      or instant free activation) and `/account/membership` (status, renew date, cancel-at-period-end).
- [x] **Admin content CRUD** — `/admin/categories`, `/admin/collections` (create/edit/delete),
      `/admin/photographers` (commission editor + verify), `/admin/email-templates` (editor),
      inline platform-settings editor on `/admin/settings` (create/edit/delete + JSON values).
- [x] **Photographer studio** — `/dashboard/studio`: edit/delete photos, create/edit/delete
      albums, manage sale settings (for-sale/featured/discount/trailer), pricing tiers,
      and **deliverable upload** (signed URL → PUT → register).
- [x] **Marketplace admin** — featured/deliverable management (via studio, admin-capable),
      **CSV sales-report export** on `/admin/orders`.
- [x] **Community** — recently-viewed rail (store), **threaded comment replies + delete-own**,
      **activity feed** (`/dashboard/feed`, merges followed photographers' uploads),
      **GA4 + first-party pageview capture** with an anonymous visitor-id cookie.
- [x] **PDF invoice download** button on `/dashboard/orders`.

## Backend

- [x] **Redis throttler storage** (`nestjs-throttler-storage-redis`) — rate limits hold across instances.
- [x] **RSS feed** — `GET /seo/rss.xml` (raw XML via new `@RawResponse()` decorator, Redis-cached).
- [x] **Postgres full-text search** — generated `tsvector` (weighted) + GIN index on `photos`;
      search now uses `websearch_to_tsquery` + `ts_rank` instead of ILIKE.
- [x] **Invisible watermark** — real LSB steganography (blue-channel, PNG) baked into delivered
      downloads alongside the visible buyer stamp; `extractInvisibleWatermark()` recovers the payload.
- [x] **Materialized revenue ledger** — `revenue_ledger` table, written per order-item at
      fulfillment (commission snapshotted), plus a **nightly reconciliation cron** that backfills gaps.
- [x] **PDF invoices** — `GET /orders/:id/invoice.pdf` (pdfkit).
- [x] **BullMQ workers** — `media` + `mail` queues with `QueueService` producer; `MediaProcessor`
      (offload invisible-watermark) and `MailProcessor` (digest); daily-digest producer cron.
      Workers consume only where `RUN_WORKERS=true`.
- [x] **Stripe Connect** — Express onboarding (`POST /photographers/me/connect/onboard`,
      `GET /photographers/me/connect/status`), `stripe_account_id` on the profile, and a real
      Transfer on payout when the connected account is onboarded.
- [x] **OpenTelemetry + Sentry** — `initObservability()` boots before Nest; auto-instrumentation
  - OTLP trace export and Sentry error capture in the global exception filter. No-ops unless configured.

## Platform

- [x] **CI pipeline** — `.github/workflows/ci.yml`: install → build packages → lint → typecheck
      (FE+BE) → unit tests → backend build → **migration check** (ephemeral Postgres) → frontend build.
- [x] **Load test** — `tests/load/browse.k6.js` (k6) over gallery/search/marketplace/discovery.
- [x] **e2e** — `apps/backend/test/public-endpoints.e2e-spec.ts` (plans, FTS, RSS, auth-guard).
- [x] **Perf** — CMS pages ISR; existing `ResponsiveImage` already does AVIF/WebP `srcset` + LQIP + lazy.

## New migrations (applied)

1. `AddPhotoSearchVector` — generated tsvector + GIN index.
2. `AddRevenueLedger` — `revenue_ledger` table + indexes.
3. `AddStripeConnectAccount` — `photographer_profiles.stripe_account_id`.

## New env vars

`RUN_WORKERS`, `APP_NAME`, `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`,
`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `NEXT_PUBLIC_GA_ID` (see `.env.example`).

## Runtime-verification caveats (need external services / config)

- **Stripe Connect** transfers + **subscription** paid checkout need live Stripe keys.
- **OpenTelemetry** export needs an OTLP collector; **Sentry** needs a DSN (both no-op otherwise).
- **BullMQ** job _consumption_ needs a worker started with `RUN_WORKERS=true` (producers verified).
- **GA4** forwarding needs `NEXT_PUBLIC_GA_ID` (first-party capture works regardless).
