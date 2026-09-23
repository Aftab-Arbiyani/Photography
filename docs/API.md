# API Reference

Base URL: `/api/v1` · Interactive docs: `/api/v1/docs` (Swagger).

## Response envelope

Every success is wrapped:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {},
  "timestamp": "2026-06-26T10:00:00.000Z",
  "path": "/api/v1/photos"
}
```

Errors are normalized by the global filter:

```json
{
  "success": false,
  "statusCode": 409,
  "message": "An account with this email already exists",
  "error": "ConflictException",
  "timestamp": "2026-06-26T10:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

Auth: send `Authorization: Bearer <accessToken>` on protected routes.

## Auth — `/auth`

| Method | Path                   | Auth     | Description                                         |
| ------ | ---------------------- | -------- | --------------------------------------------------- |
| POST   | `/register`            | public   | Register (email+password), sends verification email |
| POST   | `/login`               | public   | Login, returns user + tokens                        |
| POST   | `/refresh`             | public\* | Rotate refresh → new access/refresh pair            |
| POST   | `/logout`              | bearer   | Revoke one refresh token                            |
| POST   | `/logout-all`          | bearer   | Revoke all sessions                                 |
| POST   | `/verify-email`        | public   | Verify email with token                             |
| POST   | `/resend-verification` | public   | Resend verification (rate-limited)                  |
| POST   | `/forgot-password`     | public   | Send reset email (no user enumeration)              |
| POST   | `/reset-password`      | public   | Reset password with token (revokes sessions)        |
| POST   | `/change-password`     | bearer   | Change password while logged in                     |
| GET    | `/google`              | public   | Begin Google OAuth (if configured)                  |
| GET    | `/google/callback`     | public   | OAuth callback → redirects to frontend with tokens  |
| GET    | `/providers`           | public   | Which auth providers are enabled                    |

\* `/refresh` reads the refresh token from the JSON body `{ "refreshToken": "..." }`.

## Users — `/users`

| Method | Path   | Auth   | Description                      |
| ------ | ------ | ------ | -------------------------------- |
| GET    | `/me`  | bearer | Current profile                  |
| PATCH  | `/me`  | bearer | Update own profile               |
| GET    | `/`    | admin  | List users (paginated)           |
| GET    | `/:id` | admin  | Get user                         |
| PATCH  | `/:id` | admin  | Update user (role, verification) |
| DELETE | `/:id` | admin  | Soft-delete user                 |

## Photos — `/photos`

| Method | Path                                     | Auth               | Description                                                                |
| ------ | ---------------------------------------- | ------------------ | -------------------------------------------------------------------------- |
| POST   | `/`                                      | photographer/admin | Upload photo (multipart) — derivatives + EXIF auto-generated               |
| GET    | `/`                                      | optional           | Gallery (cursor pagination + filters)                                      |
| GET    | `/:slug`                                 | optional           | Photo by slug (increments views; `likedByMe`/`bookmarkedByMe` when authed) |
| GET    | `/:slug/related`                         | public             | Related photos                                                             |
| GET    | `/:id/comments`                          | public             | List comments (paginated)                                                  |
| PATCH  | `/:id`                                   | owner/admin        | Update metadata                                                            |
| DELETE | `/:id`                                   | owner/admin        | Soft-delete                                                                |
| POST   | `/:id/like` · DELETE `/:id/like`         | bearer             | Like / unlike                                                              |
| POST   | `/:id/bookmark` · DELETE `/:id/bookmark` | bearer             | Bookmark / unbookmark                                                      |
| POST   | `/:id/comments`                          | bearer             | Add comment (supports `parentId` reply)                                    |
| DELETE | `/comments/:id`                          | author/admin       | Delete comment                                                             |

**Gallery query params:** `cursor`, `limit` (1–60), `categoryId`, `albumId`, `photographerId`, `search`, `featured`.

## Categories — `/categories`

`GET /` · `GET /:slug` (public) · `POST /` · `PATCH /:id` · `DELETE /:id` (admin).

## Albums — `/albums`

`GET /` · `GET /:slug` (published, public) · `POST /` (photographer) · `PATCH /:id` · `DELETE /:id` (owner/admin).

## Collections — `/collections`

`GET /` · `GET /:slug` (public) · `POST /` · `PATCH /:id` · `DELETE /:id` (admin)
· `POST /:id/photos` · `DELETE /:id/photos` (manage membership, admin).

## Health — `/health`

`GET /health` (public) — Terminus check of Postgres + Redis.

## Rate limiting

Global throttle via `THROTTLE_TTL` / `THROTTLE_LIMIT`. Sensitive auth routes have
tighter per-route limits (e.g. login 10/min, register 5/min, forgot-password 3/min).
