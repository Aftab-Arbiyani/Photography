# Aperture — Photography Platform

A production-grade, monorepo photography platform.

- **Frontend** — Next.js 15 (App Router) · TypeScript · Tailwind · Ant Design · Framer Motion · GSAP · Lenis
- **Backend** — NestJS · PostgreSQL · TypeORM · Redis · JWT · Swagger
- **Architecture** — Clean Architecture · SOLID · Repository pattern · DTO validation · Guards · Global exception filter · Structured logging

> **Status:**
>
> - **Phase 1 (backend-first)** — backend feature-complete: auth, schema, photo pipeline, gallery, engagement, admin API. See [`docs/PHASE-1-CHECKLIST.md`](docs/PHASE-1-CHECKLIST.md).
> - **Phase 2 (frontend build-out)** — schema migration applied; shared UI library; auth session + pages; gallery (masonry/infinite-scroll/lightbox); photo detail (EXIF/story/comments/related); albums & collections — all wired to the live API and verified (`next build` green). See [`docs/PHASE-2-CHECKLIST.md`](docs/PHASE-2-CHECKLIST.md).
> - **Phase 3 (marketplace backend)** — digital marketplace, additive on Albums: pricing tiers, discounts, featured, reviews/ratings, wishlist, recently-viewed (Redis), cart, coupons, tax, **Stripe** checkout + webhook + refunds, entitlements, **signed/limited/expiring/watermarked downloads** with full audit, notifications + transactional emails. Verified: migration applied to live Postgres + full app boots + endpoints probed. See [`docs/PHASE-3-CHECKLIST.md`](docs/PHASE-3-CHECKLIST.md).
> - **Phase 4 (community backend)** — additive social/discovery layer: follows + followers, reports/moderation, share tracking, tags, **global + faceted search** (camera/lens/location/tag), **discovery** (trending/popular/featured), **analytics dashboard** (visitors, sales, revenue graph, top searches, conversion), **realtime notifications via SSE + Redis pub/sub**, audit logs + XSS sanitization. (Likes/comments/replies/bookmarks already existed from Phase 1.) Verified: 4th migration applied to live Postgres + full app boots (90+ routes) + probed. See [`docs/PHASE-4-CHECKLIST.md`](docs/PHASE-4-CHECKLIST.md).
> - **Phase 5 (scale / platform backend)** — additive future-proofing for thousands of photographers: **membership/subscriptions** (Stripe) + premium gating, **photographer onboarding** (apply → verify → role upgrade), **revenue sharing** (commission + payouts + earnings) + **photographer dashboard**, **platform admin** (settings, feature flags, email templates, CMS pages), **cron jobs**, **DB indexing migration**, **dynamic sitemap**. Plus ops: **Nginx, PM2, deployment guide, production checklist, ER diagram**. Verified: 2 migrations applied to live Postgres + full app boots + 16 unit tests. See [`docs/PHASE-5-CHECKLIST.md`](docs/PHASE-5-CHECKLIST.md).
> - **Next:** the frontend for marketplace + community + platform admin (Stripe checkout, photographer & admin dashboards, search UI, CMS rendering, SSR/streaming/CDN perf).

### Documentation

- [Architecture](docs/ARCHITECTURE.md) · [ER Diagram](docs/ER-DIAGRAM.md) · [Deployment](docs/DEPLOYMENT.md) · [Production Checklist](docs/PRODUCTION-CHECKLIST.md)
- Phase checklists: [1](docs/PHASE-1-CHECKLIST.md) · [2](docs/PHASE-2-CHECKLIST.md) · [3](docs/PHASE-3-CHECKLIST.md) · [4](docs/PHASE-4-CHECKLIST.md) · [5](docs/PHASE-5-CHECKLIST.md)

---

## Monorepo layout

```
photography-platform/
├── apps/
│   ├── backend/      # NestJS API (full)
│   └── frontend/     # Next.js 15 web client (landing + scaffold)
├── packages/
│   ├── types/        # Shared domain types, enums, API contracts
│   ├── utils/        # Framework-agnostic helpers (slug, pagination, cursor)
│   └── ui/           # Design tokens (components in the frontend phase)
├── docker/           # Dockerfiles + docker-compose + postgres init
├── docs/             # Architecture, installation, API, checklist
└── scripts/
```

Tooling: **pnpm workspaces** + **Turborepo**.

---

## Quick start (Docker — everything)

```bash
cp .env.example .env          # adjust secrets (JWT_* must be ≥ 32 chars)
pnpm docker:up                # postgres, redis, mailhog, minio, backend, frontend
```

- API → http://localhost:4000/api/v1
- Swagger → http://localhost:4000/api/v1/docs
- Web → http://localhost:3000
- Mailhog (emails) → http://localhost:8025

## Quick start (local dev)

```bash
pnpm install
# start infra only
docker compose -f docker/docker-compose.yml up -d postgres redis mailhog
pnpm build --filter @photography/types --filter @photography/utils   # build shared pkgs
pnpm --filter @photography/backend build
pnpm db:migrate                 # run migrations
pnpm --filter @photography/backend seed   # create admin + categories
pnpm dev                        # turbo: backend + frontend in watch mode
```

Default seeded admin: `admin@photography.local` / `Admin123!` (override via `ADMIN_EMAIL`/`ADMIN_PASSWORD`).

Full step-by-step: [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

---

## Common scripts (root)

| Command                                      | Description                            |
| -------------------------------------------- | -------------------------------------- |
| `pnpm dev`                                   | Run all apps in watch mode (Turborepo) |
| `pnpm build`                                 | Build every package + app              |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality gates across the workspace     |
| `pnpm db:migrate` / `pnpm db:revert`         | TypeORM migrations                     |
| `pnpm docker:up` / `pnpm docker:down`        | Full stack via docker-compose          |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — layering, modules, request lifecycle, schema
- [Installation](docs/INSTALLATION.md) — prerequisites, env, migrations, S3, Google OAuth
- [API](docs/API.md) — endpoint reference + response envelope
- [Phase 1 checklist](docs/PHASE-1-CHECKLIST.md) — done / pending / next phase

## License

UNLICENSED — private project.
