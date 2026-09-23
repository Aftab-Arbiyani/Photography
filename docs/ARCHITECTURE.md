# Architecture

## Principles

- **Clean Architecture / layering** — controllers (transport) → services (use-cases) → repositories (TypeORM) → entities (domain). Cross-cutting concerns live in `common/` and infrastructure modules (`redis/`, `mail/`, `storage/`, `database/`).
- **SOLID** — single-responsibility services (e.g. `TokenService` is separate from `AuthService`; `PhotosService` is separate from `EngagementService`). The storage layer is a **port** (`StorageService` abstract class) with swappable **adapters** (S3 / local disk) — open/closed + dependency inversion.
- **Repository pattern** — services depend on TypeORM repositories, never on the request/response.
- **DTO + validation** — every input is a class-validated DTO; `ValidationPipe` runs globally with `whitelist` + `forbidNonWhitelisted` + transform.
- **Shared contracts** — `@photography/types` is the single source of truth for enums and API shapes, imported by both apps.

## Backend module map

```
src/
├── config/            # env.validation (Joi) + typed namespaced config
├── common/            # BaseEntity, guards, decorators, filters, interceptors, DTOs, validators
├── database/          # TypeOrmModule wiring, data-source (CLI), migrations, seeds
├── redis/             # global ioredis client + RedisService
├── mail/              # nodemailer MailService + templates
├── storage/           # StorageService port, S3 + local adapters, ImageProcessingService (sharp/EXIF)
├── health/            # Terminus health check (db + redis)
└── modules/
    ├── auth/          # register/login/refresh/verify/forgot/reset/google + strategies + TokenService
    ├── users/         # profile + admin user management
    ├── photos/        # upload pipeline, gallery (cursor), likes/bookmarks/comments, related
    ├── categories/    # taxonomy
    ├── albums/        # owner-scoped albums
    └── collections/   # curated m2m groupings
```

## Request lifecycle

```
HTTP → Helmet/CORS → Global prefix /api/v1
     → ThrottlerGuard (rate limit)
     → JwtAuthGuard (skips @Public; sets request.user)
     → RolesGuard (@Roles RBAC)
     → ValidationPipe (DTO validation + transform)
     → Controller → Service → Repository → Postgres
     → TransformInterceptor (wraps in { success, data, … } envelope)
     → AllExceptionsFilter (normalizes errors to { success:false, … })
```

## Authentication & sessions

- **Access token** (short-lived, default 15m) — Bearer, validated by `JwtStrategy`.
- **Refresh token** (long-lived, default 7d) — JWT whose `jti` maps to a persisted
  `refresh_tokens` row storing only a **SHA-256 hash** of the token.
- **Rotation + reuse detection** — refreshing revokes the consumed token and issues
  a new one linked via `replaced_by_token_id`. Presenting an already-revoked token
  triggers revocation of **all** the user’s sessions.
- **Password hashing** — Argon2id (OWASP parameters).
- **RBAC** — `admin` / `photographer` / `user` via `@Roles` + `RolesGuard`.
- **Single-purpose tokens** — email verification & password reset are separately-signed
  JWTs with their own secrets and short TTLs.

## Image pipeline

On upload (`POST /photos`, multipart):

1. `ImageProcessingService` (sharp) derives **thumbnail (JPEG)**, **WebP**, **AVIF**, and a base64 **blur placeholder** (LQIP), and reads dimensions.
2. EXIF is parsed (`exif-reader`): camera, lens, ISO, shutter, aperture, focal length, GPS, capture date — normalized onto columns + a raw `jsonb` bag.
3. All variants upload in parallel via the `StorageService` port (S3 or local disk).
4. The `Photo` row persists object keys; URLs are resolved at serialization time by the mapper, so the storage provider can change without a data migration.

## Data model (high level)

```
users ──< photos >── categories
  │         │  │
  │         │  └──< albums (owner = user)
  │         │
  │         ├──< likes (user × photo, unique)
  │         ├──< bookmarks (user × photo, unique)
  │         └──< comments (threaded, self-ref parent)
  │
  └──< refresh_tokens

collections >──< photos   (m2m via collection_photos)
```

- Every entity extends `BaseEntity`: `uuid` PK, `created_at`/`updated_at` (timestamptz), soft-delete `deleted_at`, optimistic-lock `version`.
- **Multi-photographer ready:** `photos.photographer_id` and `albums.photographer_id`
  exist today; single-photographer operation is just a dataset with one owner. No
  schema change is needed to onboard more photographers.

## Pagination

- **Offset** (`PaginationQueryDto`) — admin lists, comments, albums, collections.
- **Cursor / keyset** (`CursorQueryDto`) — the public gallery infinite scroll, ordered
  by `(published_at, id)` for stable, index-friendly paging at scale.

## Frontend (scaffold)

- App Router with server components, `buildMetadata()` SEO helper (OpenGraph + Twitter + canonical), `robots.ts`, `sitemap.ts`, JSON-LD.
- Design tokens from `@photography/ui` mapped into both Tailwind config and the AntD theme.
- Providers: AntD SSR registry, dark/light `ThemeProvider`, Lenis smooth-scroll (reduced-motion aware).
- Typed `api` client unwraps the backend envelope using shared types.
