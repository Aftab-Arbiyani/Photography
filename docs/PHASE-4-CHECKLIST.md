# Phase 4 — Completion Checklist (Community / Social + Search + Analytics)

Extends Phases 1–3 **additively** — no existing table/column/endpoint/module was rewritten. Edits to existing files were additive only (DI injection, decorators, enum members).

**Verified:** types build ✓ · backend typecheck ✓ · `nest build` ✓ · 4th migration generated + applied to the live Postgres on top of existing data (admin + categories preserved) ✓ · **full app boots** (all modules, 90+ routes mapped, global audit interceptor, SSE controller) ✓ · live probes: search/facets/discovery/tags/analytics-capture work, protected routes → 401, **SSE rejects bad token → 401** ✓.

## Already existed before this phase (NOT duplicated)

Likes, comments, replies, bookmarks (Phase 1) · in-app notifications + email (Phase 3) · Redis, pagination/filter/sort, rate-limiting (Throttler), Helmet, global ValidationPipe, parameterized SQL (TypeORM).

## ✅ Completed

### Social graph

- [x] **Follow / unfollow** photographers; **followers** + **following** lists (paginated, `isFollowing` flags); denormalized `followers_count` / `following_count`; follow → notification
- [x] **Photographer public profile** (`GET /photographers/:id`) with social + photo counts

### Engagement & moderation

- [x] **Report abuse** on photo / album / collection / **comment** / user (reason + details); **admin moderation queue** + resolve/dismiss (notifies reporter)
- [x] Social **notifications wired**: new comment + new reply (additive hook in `EngagementService`), new follower, report resolved
- [x] **Share** tracking (photo/album/collection, per channel) + share counts + canonical share URL

### Tags

- [x] `Tag` entity + `photo_tags` m2m (Photo entity untouched), tag assignment (owner/admin), **popular tags**, **tag search/autocomplete**, usage counts

### Search (global + faceted)

- [x] **Global search** across photos, albums, collections, categories, tags (grouped, Redis-cached, records the query)
- [x] **Faceted photo search**: free-text + **camera / lens / location / tag / category** filters
- [x] **Facets** endpoint (cameras, lenses, tags, categories) for filter UIs

### Discovery

- [x] **Trending photos** (weighted recent engagement), **popular albums** (sales + rating), **featured collections** (curated) — all Redis-cached

### Analytics

- [x] Client **event capture** (pageview / search / …) with anonymous visitor id
- [x] **Admin dashboard**: visitors, **returning users**, pageviews, sales + revenue, downloads, **conversion rate**, popular photos, popular albums, **top searches**, **revenue graph**, visitors graph (time-series)
- [x] Google-Analytics-ready: events endpoint + visitor id flow for GA/GTM on the frontend

### Notifications / realtime

- [x] Extended `NotificationType` for social events (additive enum members; safe enum-widening migration)
- [x] **Realtime SSE stream** (`GET /notifications/stream`) backed by **Redis pub/sub** (horizontally scalable); token via query param, validated by a guard (clean 401)
- [x] Notifications fan out live on `emit()`; existing email path retained

### Security

- [x] **Audit logs**: `audit_logs` table + **global AuditInterceptor** recording every authenticated mutation (actor, action, IP, user-agent, status) + admin browse endpoint; explicit hooks available for sensitive ops
- [x] **XSS protection**: `@SanitizeText()` transform strips HTML/script from user content — applied to comments, reviews, bios, report details, tags
- [x] **SQL-injection**: all queries parameterized via TypeORM (raw fragments use bound params)
- [x] Rate limiting (Throttler), Helmet, strict CORS, global validation — confirmed in place
- [x] **CSRF posture documented** (see below) + reusable SSE token guard

### Caching / performance

- [x] Redis caching for global search (60s) and discovery (5m); query/visitor tracking; batched viewer-flag lookups; denormalized counters for trending

## CSRF note (important)

The API authenticates with **Bearer JWTs in the `Authorization` header**, not cookies. CSRF attacks rely on the browser auto-attaching ambient credentials (cookies) — which this API never uses — so traditional CSRF does not apply, and adding `csurf` (deprecated) would be theater. Defenses in place: no cookie auth, strict CORS allow-list, Helmet, and the Stripe webhook verified by signature (not session). **If/when** refresh tokens move to an httpOnly cookie (Phase-2 roadmap item), enable a double-submit CSRF token on cookie-authenticated mutations — the guard pattern is already established.

## 🔲 Pending / next phase

### Frontend (the big one — community + search + analytics UI)

- [x] Photographer profiles, follow buttons, followers/following **+ activity feed** _(`/photographers/[id]`, `/dashboard/feed`)_
- [x] Global search bar + results page + faceted photo search UI (camera/lens/location/tag filters) _(`nav-search` + `/search`)_
- [x] Trending / popular / featured discovery sections; tag cloud _(`/discover`)_
- [x] Report dialogs; share sheet (channels) _(`photo-social`)_
- [x] Notification bell + dropdown consuming the **SSE stream**; mark-read _(`notification-bell`)_
- [x] **Admin analytics dashboard** (charts for revenue/visitors, top searches, conversion) + moderation queue + audit-log viewer _(`/admin`, `/admin/reports`, `/admin/audit`)_
- [x] GA4/GTM script wiring + visitor-id cookie _(`components/analytics/analytics.tsx` + first-party pageview capture)_

### Backend hardening

- [x] Move search to Postgres full-text (`tsvector` + GIN, `ts_rank`) — replaced ILIKE _(see [FOLLOWUP-COMPLETION](./FOLLOWUP-COMPLETION.md))_
- [ ] Trending as a scheduled job (BullMQ) writing a materialized ranking, instead of per-request weighted query
- [ ] Like notifications (debounced/batched to avoid spam) — comments/replies/follows wired this phase
- [ ] Analytics rollups (daily aggregate tables) for large-volume dashboards
- [ ] WebSocket gateway option alongside SSE; push/email digest for notifications
- [ ] Moderation actions that auto-hide reported content above a threshold

### Platform

- [ ] e2e tests (follow → notification → SSE; search; report → resolve)
- [ ] CI: lint + typecheck + test + build + migration check

## 💡 Suggested improvements

1. **Postgres full-text search** (`tsvector` + GIN index, `ts_rank`) replaces ILIKE for relevance + speed — biggest win.
2. **Scheduled trending** via BullMQ → materialized table; serve O(1) from cache.
3. **Notification digests** (email) + per-type user preferences.
4. **Analytics daily rollups** so the dashboard scales past millions of events.

## Notes

- Migration `CommunityPhase4` (4th) applied: 7 new tables (`follows`, `reports`, `tags`, `photo_tags`, `analytics_events`, `share_events`, `audit_logs`) + `users.followers_count/following_count` + `photos.shares_count/location_name`. `NotificationType` enum widened safely.
- Dev Postgres (4 migrations + seed) runs on host port **5440** (`photography-postgres`).
