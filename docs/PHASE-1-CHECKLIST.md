# Phase 1 — Completion Checklist

Phase 1 focus (agreed): **backend-first**, on **pnpm + Turborepo**.

## ✅ Completed

### Monorepo & tooling

- [x] pnpm workspaces + Turborepo (`turbo.json`, pipelines)
- [x] Shared `tsconfig.base.json`, Prettier, root scripts, `.env.example`, `.gitignore`, `.dockerignore`
- [x] `packages/types` — domain enums + API contracts (single source of truth)
- [x] `packages/utils` — slug, offset & cursor pagination, formatting (+ Vitest tests)
- [x] `packages/ui` — design tokens (Apple/NatGeo system)

### Backend (NestJS) — feature-complete

- [x] Config module with **Joi env validation** (fail-fast) + typed namespaces
- [x] PostgreSQL + TypeORM, `BaseEntity` (uuid, timestamps, soft-delete, version)
- [x] Migrations data-source + `EnableExtensions` migration + Postgres init SQL
- [x] Redis module (shared client + service) used by health/cache/throttle foundation
- [x] Global **exception filter**, **transform interceptor** (response envelope), logging interceptor, **pino** structured logging
- [x] Global **ValidationPipe**, **ThrottlerGuard**, **JwtAuthGuard**, **RolesGuard**
- [x] Helmet, CORS, URI versioning (`/api/v1`), graceful shutdown
- [x] **Swagger / OpenAPI** at `/api/v1/docs`
- [x] **Auth**: register, login, JWT access + **rotating refresh with reuse detection**, email verification, forgot/reset password, change password, **Google OAuth** (conditional), **RBAC**, Argon2id hashing
- [x] **Users**: profile self-service + admin management
- [x] **Photos**: multipart upload → **sharp pipeline** (thumbnail/WebP/AVIF/blur LQIP) + **EXIF extraction**, cursor-paginated gallery with filters, by-slug + view count, related photos
- [x] **Engagement**: likes, bookmarks, threaded comments (counters kept in sync via transactions)
- [x] **Categories / Albums / Collections**: CRUD with ownership/RBAC; collection↔photo m2m membership
- [x] **Storage** as a port with **S3 adapter + local-disk fallback** (zero-config dev)
- [x] **Mail** service (nodemailer) + verification/reset/welcome templates
- [x] **Health** check (Terminus: db + redis)
- [x] Idempotent **seed** (admin + categories) + unit tests (AuthService, utils)

### Frontend (Next.js 15) — scaffold + landing

- [x] App Router, TypeScript, Tailwind (token-mapped), Ant Design (SSR registry + themed)
- [x] **Apple + National Geographic landing page** — full-bleed hero, alternating tiles, Framer Motion
- [x] **Dark mode** (persisted, system-aware) + Lenis smooth scroll (reduced-motion aware)
- [x] **SEO**: metadata builder (OpenGraph + Twitter + canonical), JSON-LD, `robots.ts`, `sitemap.ts`
- [x] Accessibility baseline: skip-link, focus-visible rings, ARIA labels, reduced-motion
- [x] Routing scaffold for all listed pages + 404; typed API client wired to the backend envelope

### Ops & docs

- [x] Dockerfiles (backend + frontend, multi-stage), `docker-compose` (postgres, redis, mailhog, minio, apps)
- [x] README, Installation, Architecture, API reference, this checklist

## 🔲 Pending / deferred to next phases

### Frontend (next phase — the big one)

- [x] Gallery: masonry grid, infinite scroll (consume cursor API), filters, search UI _(Phase 2)_
- [x] Fullscreen lightbox: zoom, keyboard nav, EXIF panel, story, related _(Phase 2; slideshow autoplay still TODO)_
- [x] Photo detail, album detail, collection detail pages (live data) _(Phase 2)_
- [x] Auth UI: login/register/forgot/reset/verify + Google button + token storage/refresh _(Phase 2)_
- [x] Admin dashboard: manage photos/categories/albums/collections/users, upload UI, analytics _(categories/collections admin CRUD + studio for photos/albums; see [FOLLOWUP-COMPLETION](./FOLLOWUP-COMPLETION.md))_
- [x] Like/bookmark/comment interactions, user dashboard (bookmarks, profile) _(Phase 2 + dashboard)_
- [x] `@photography/ui` component library (Button, PhotoCard, MasonryGrid, Lightbox…) _(Phase 2)_

### Backend hardening

- [x] Generate & commit the full schema migration (entities → SQL) _(Phase 2 `InitSchema`; CI migration check still pending)_
- [x] Redis-backed throttler storage + response caching for gallery/detail _(Redis throttler storage + search/discovery caching)_
- [ ] Storage cleanup job for soft-deleted photos (prune S3 objects)
- [x] BullMQ queue for async image processing (offload sharp from the request) _(BullMQ `media` queue + `MediaProcessor`)_
- [x] Analytics aggregation + revenue placeholder endpoints _(Phase 4 analytics + Phase 5 revenue)_
- [x] RSS feed endpoint; per-photo JSON-LD (ImageObject) _(`/seo/rss.xml` + `ImageObject` JSON-LD)_
- [ ] Refresh-token cookie option (httpOnly) as an alternative to body transport
- [ ] Broader test coverage (e2e with Supertest, photos/engagement services, guards)

### Platform

- [x] CI pipeline (lint + typecheck + test + build + migration check) _(`.github/workflows/ci.yml`)_
- [ ] Observability (OpenTelemetry traces, metrics), Sentry
- [ ] Rate-limit & WAF tuning, secrets manager integration
- [ ] Lighthouse 90+ audit pass on real pages

## 💡 Suggested improvements for the next phase

1. **Build the `@photography/ui` library first** — gallery, card and lightbox primitives unblock every page.
2. **Move image processing to a BullMQ worker** — uploads return immediately; derivatives generate async with a `processing` status.
3. **Add response caching** (Redis) keyed by gallery query/cursor; invalidate on publish.
4. **Cookie-based refresh tokens** (httpOnly, SameSite) for the web client to reduce XSS token exposure.
5. **CI from day one** of the next phase to keep the migration + types contract honest across both apps.
