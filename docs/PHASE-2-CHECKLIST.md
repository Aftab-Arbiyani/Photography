# Phase 2 — Completion Checklist

Phase 2 focus: **frontend build-out wired to the live API**, plus completing the backend schema migration.

All work below is **verified**: backend typecheck ✓, schema migration applied + seeded against real Postgres ✓, frontend typecheck ✓, and `next build` ✓ (21 routes, 17 static pages generated, dynamic routes server-rendered).

## ✅ Completed

### Backend

- [x] Generated the full **InitSchema migration** from the entities; applied it against a real Postgres 16 (all 9 tables + `collection_photos` join, enums, `citext`, FKs, unique constraints)
- [x] Seed verified end-to-end (admin + categories created)
- [x] Fixed the data-source entity glob to support both compiled (`.js`, migration CLI) and source (`.ts`, ts-node seed)
- [x] New endpoint `GET /collections/:slug/photos` (no schema change) so collections are first-class

### Shared `@photography/ui`

- [x] `cn` classnames helper
- [x] `ResponsiveImage` — `<picture>` AVIF → WebP → original, blur LQIP fade-in, aspect-ratio reservation (no layout shift), framework-agnostic
- [x] `MasonryGrid` — pure-CSS responsive columns (SSR + infinite-scroll friendly)
- [x] `PhotoCard` — gallery tile with hover overlay + like/bookmark controls
- [x] `Lightbox` — fullscreen viewer with keyboard nav (←/→/Esc), click-to-zoom, prev/next, body-scroll lock

### Frontend — session & auth

- [x] `authStorage` (token persistence) + `api-client` with **bearer injection, envelope unwrap, and de-duplicated auto-refresh on 401**
- [x] `AuthProvider` / `useAuth` — hydrates session on mount, login/register/logout/refresh
- [x] Nav reflects auth state (sign in ↔ account + sign out)
- [x] Pages wired to the API: **login** (+ Google button when enabled), **register**, **forgot-password**, **reset-password**, **verify-email**, **OAuth callback** (consumes redirect tokens)

### Frontend — content

- [x] **Gallery** — masonry + IntersectionObserver infinite scroll, category filter chips, search, optimistic like/bookmark, lightbox; SSR initial page + graceful API-down fallback
- [x] **Photo detail** (`/photos/[slug]`) — hero image, EXIF panel, story, optimistic like/bookmark, **comments** (list + post), **related** grid; dynamic OpenGraph metadata + `ImageObject` JSON-LD
- [x] **Albums** list + **album detail** (`/albums/[slug]`) reusing the gallery grid locked to `albumId`
- [x] **Collections** list + **collection detail** (`/collections/[slug]`) rendering the collection's photos
- [x] AntD `App` context wired for messages/notifications; reduced-motion respected

## 🔲 Pending / next phases

### Admin (next priority)

- [x] Admin dashboard shell + auth-role guard (redirect non-admins) _(`admin-shell`, 403 for non-admins)_
- [x] Upload UI (drag-drop, progress, multipart → `POST /photos`) _(`/dashboard/upload`)_
- [x] Manage photos / categories / albums / collections / users (tables + CRUD forms) _(admin categories/collections + studio for photos/albums; see [FOLLOWUP-COMPLETION](./FOLLOWUP-COMPLETION.md))_
- [x] Analytics dashboard + revenue placeholder _(`/admin` overview with revenue chart)_

### User area

- [x] Dashboard: bookmarks list, profile edit (`PATCH /users/me`), change password, my uploads _(`/dashboard/*`)_
- [x] Comment replies (threaded UI) + delete-own-comment controls _(`comments-section.tsx`)_

### Polish & platform

- [ ] Collection-filtered gallery via cursor (currently bounded, non-paginated list)
- [ ] Replace gallery hero/landing placeholder gradients with real CDN photography + art-directed `srcset`
- [ ] Skeleton loaders, error boundaries, empty states pass
- [ ] Lighthouse 90+ audit; route-level `loading.tsx`/`error.tsx`
- [ ] Backend: BullMQ async image processing, Redis cache for gallery/detail, S3 cleanup job, RSS feed
- [ ] httpOnly-cookie refresh tokens (replace localStorage) for the web client
- [ ] CI pipeline (lint + typecheck + test + build + migration check); e2e (Playwright)

## Notes

- A local Postgres 16 container is running on host port **5440** (`photography-postgres`) with the schema + seed applied — handy for dev. Stop with `docker stop photography-postgres`.
- The web client talks to the API via `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api/v1`). Start the backend (`pnpm backend:dev`) to see live data; pages degrade gracefully when it's unreachable.
