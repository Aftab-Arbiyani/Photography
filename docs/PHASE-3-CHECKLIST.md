# Phase 3 — Completion Checklist (Digital Marketplace)

Extends Phases 1–2 **additively** — no existing table, column, endpoint or module was rewritten or removed. Albums became the sellable product via new columns + new tables.

**Verified:** backend typecheck ✓ · `nest build` ✓ · migration generated + applied to the live Postgres on top of existing Phase 1/2 data (admin user + 6 categories preserved) ✓ · **full app boots** (entire DI graph incl. 9 new modules) ✓ · live endpoint probes: `health` up, `categories` intact, `marketplace/albums` live, `coupons/validate` → 400 via filter, protected routes → 401 ✓.

## ✅ Completed (backend-first, as in prior phases)

### Schema (additive migration `MarketplacePhase3`)

- [x] **ALTER `albums`**: `is_for_sale`, `is_featured`, `trailer_url`, `discount_percent`, `discount_active`, `rating_average`, `rating_count`, `sales_count`
- [x] 12 new tables: `album_pricing`, `album_assets`, `reviews`, `wishlist_items`, `coupons`, `carts`, `cart_items`, `orders`, `order_items`, `entitlements`, `downloads`, `notifications`
- [x] `order_items.photographer_id` snapshot → **multi-photographer revenue split is ready** with no further schema change

### Albums / catalog

- [x] **Multiple pricing tiers** per album (license type, download limit, RAW inclusion) — owner/admin CRUD
- [x] **Album-level discounts** (percent, toggle) reflected in `effectivePriceCents`
- [x] **Featured albums**, **for-sale toggle**, **album trailer URL**
- [x] **Deliverable assets** (HIGH_RES / ZIP / EXCLUSIVE / RAW) with **signed private-bucket upload URLs** + registration
- [x] **Marketplace reads**: browse (filters: featured/search/sort), detail, **related albums**, viewer flags (`wishlisted`/`purchased`)
- [x] **Recently Viewed** via Redis (per-user list, no table)
- [x] **Reviews + ratings** (1–5), unique per user×album, **verified-purchase** flag, denormalized album rating recompute
- [x] **Wishlist**

### Shopping

- [x] Persistent **cart** (add/re-tier/remove/clear)
- [x] **Coupons** (percent/fixed, validity window, min-subtotal, max-redemptions) — admin CRUD + public validate
- [x] **PricingService** — pure, tested-by-construction money math: subtotal → album discount → coupon → **tax** (basis points) → total (integer cents)
- [x] **Orders** + **order items** (immutable snapshots), invoice numbers, **order history**
- [x] **Stripe payments (USD)**: PaymentIntent checkout, **signed webhook** (raw-body verified), free-order (100%-off) fast path
- [x] **Refund-ready architecture**: admin full/partial refund → Stripe refund → entitlement deactivation + status tracking (`refunded_cents`, `PARTIALLY_REFUNDED`)

### Digital delivery & protection

- [x] **Entitlements** = single source of truth for download rights (limit, used, expiry, RAW flag)
- [x] **Signed AWS URLs** for downloads (S3 adapter) + local-disk fallback
- [x] **Limited downloads** enforced **atomically** (conditional SQL update — no race), **download expiration**
- [x] **Purchase verification** before any download; **RAW gated** by license tier
- [x] **Buyer-email watermark** baked into delivered images + **visible preview watermark** (sharp)
- [x] **Audit logging**: every issuance records IP, user-agent, device fingerprint, expiry, watermark flag → **download history**
- [x] Private deliverables never exposed publicly; hotlink-resistant (short-lived signed URLs only)

### Notifications & emails

- [x] In-app **notifications** (purchase success, order failed, refund) + unread count + mark-read
- [x] Transactional **emails**: purchase successful, invoice, download ready, order failed (extends existing MailService)

### Performance

- [x] **Redis** for recently-viewed + existing cache/session foundation
- [x] Cursor/offset pagination, denormalized counters (sales/rating), batched viewer-flag lookups (no N+1)
- [x] Image variants (AVIF/WebP/blur) from Phase 1 → **CDN-ready** signed/public URLs

### Fixes made during verification

- [x] Broke a latent **circular import** (`redis.module` ↔ `redis.service`) by extracting the `REDIS_CLIENT` token — was dormant until first boot
- [x] Relaxed `MAIL_FROM_ADDRESS` Joi validation to accept dev TLDs (`…@photography.local`)

## 🔲 Pending / next phase (Phase 4)

### Marketplace frontend (the big one)

- [x] Storefront: marketplace browse/detail, pricing selector, trailer, sample images, reviews UI, related, wishlist toggle **+ recently-viewed rail** _(`/store`, `/store/[slug]`)_
- [x] **Cart + checkout** pages with **Stripe Elements** _(`/cart`, `/checkout`)_
- [x] User dashboard: **purchases, downloads (library), notifications, order history, profile + PDF invoices** _(`/dashboard/*`)_
- [x] Admin: orders, payments, **revenue analytics**, sales reports, refund management UI, coupon/featured management, deliverable upload UI _(featured/deliverable mgmt via studio; **CSV sales export** on `/admin/orders`)_

### Backend hardening

- [x] **Invisible/steganographic watermark** (real LSB on the blue channel; `extractInvisibleWatermark` recovers payload)
- [x] **PDF invoices** (`GET /orders/:id/invoice.pdf` via pdfkit)
- [x] Move watermark to a **BullMQ worker** (offload via `media` queue + `MediaProcessor`) _(ZIP packaging still TODO)_
- [x] **Revenue analytics** aggregation + materialized ledger + per-photographer payout reports
- [ ] S3 lifecycle rule / cleanup job for `tmp/watermarked/*`
- [ ] Idempotency keys on checkout; Stripe event de-dup table
- [ ] Sales/coupon reports export (CSV)

### Platform

- [ ] e2e tests for the purchase → entitlement → download flow (Supertest + Stripe test webhooks)
- [ ] CI: lint + typecheck + test + build + migration check
- [ ] Rate-limit tuning on download issuance; per-IP hotlink throttling

## 💡 Suggested improvements

1. **Build the checkout vertical slice first in Phase 4** (cart → Stripe Elements → webhook → download library) — it exercises every new backend module end-to-end.
2. **BullMQ for delivery**: heavy watermark/ZIP work shouldn't block the request; return a job + notify when ready.
3. **Idempotency** on `/payments/checkout` to avoid duplicate pending orders on retries.
4. **Per-photographer payouts**: `order_items.photographer_id` is captured today — add a payouts/ledger module when onboarding multiple photographers.

## Notes

- New env vars added (see `.env.example`): `STRIPE_*`, `COMMERCE_*`, `DOWNLOAD_*`, `WATERMARK_*`. Payments are **optional** — without `STRIPE_SECRET_KEY` the app boots and `/payments/checkout` returns 503 (free orders still work).
- Dev Postgres with full schema (3 migrations) + seed is running on host port **5440** (`photography-postgres`).
