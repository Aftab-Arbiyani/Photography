---
name: documentation
description: Write and maintain technical, admin, and user documentation plus release notes for the current project — grounded in the code and the real API routes, audience-scoped, with runnable examples. Use whenever behaviour changes (new endpoint, config flag, workflow, schema change) so docs stay true, or when writing a user/admin guide, runbook, or changelog.
---

# Documentation

_Docs that drift are worse than none, because people trust them. Document what the code verifiably does — read the handler, not the intention — and when code and doc disagree, the doc loses and you flag the code._

Keep the docs true to the running system. Document code as it is — read the source (the controller + service, or the schema/migrations from project-context §3) before describing it; never document intended-but-unverified behaviour, and never invent an endpoint, flag, or option. If the project has no OpenAPI/Swagger spec, the route handler and the service method behind it ARE the reference — read them. project-context overrides anything generic here.

## Procedure

1. Read the change (diff / merged work / feature) and the code it documents.
2. Pick the audience and the surface (user / admin / technical / release notes) — one audience per doc.
3. Write or update; include a runnable example; match the existing format and voice (`CLAUDE.md`, `AGENTS.md`, `README.md`, the docs dir from project-context §3).
4. If the doc reveals a code bug, flag it to the specialist — don't fix code from a doc task.

You may Write/Edit documentation files only — not production code, schema, or tests.

## Audiences & surfaces

- **User** — the product's core workflows (project-context §1 key domain terms).
- **Admin** — config/env flags (read the env example / config module; never the real `.env` values), CORS origins, API tokens, storage settings, user/role admin, upload limits.
- **Technical** — API reference read from the controllers, architecture notes, runbooks, schema/ER docs, setup.
- **Release notes** — user-facing summary grouped Added / Changed / Fixed / Security, breaking changes called out (`CHANGELOG.md` or the project's equivalent).
- Keep `CLAUDE.md` / `AGENTS.md` / `README.md` in sync when behaviour drifts.

## Quality bar

- Show, don't just tell: exact command, request/response example, or config snippet. Keep examples runnable — use the real commands from project-context §4 and the health/readiness probes from §5 as the smoke check.
- Be precise on security-sensitive behaviour (which routes are public, where auth is enforced, the CORS policy, upload caps — project-context §6) — these docs read as the contract.
- Never put a real secret/token in an example; use obvious placeholders (`<API_TOKEN>`).
- No `any` in TypeScript examples beyond what the real handlers use; match project patterns.
- Note the auth requirement in every API example, including the exact unauthenticated response shape the project returns (project-context §6 error shape).
- Update, don't duplicate, an existing doc.

## Templates

API endpoint:

```md
### POST /api/<resource>/:id/comments

Add a comment to a <resource>. **Auth:** <auth mechanism from project-context §6>.

Request
{ "body": "<markdown>" }

Response 200
{ "id": "<uuid>", "<resource>\_id": "<id>", "body": "...", "created_at": "..." }

Errors: 400 invalid body · 401 unauthenticated · 404 <resource> not found
```

Release notes:

```md
## vX.Y.Z — YYYY-MM-DD

### Added — <user-facing capability>

### Changed — <behaviour change; note if it alters an existing route>

### Fixed — <bug, user impact>

### Security — <hardening / advisory>

**Breaking:** <what breaks + migration step> (omit if none)
```

Runbook:

```md
# <Operation> runbook

Pre-checks: <what must be true first>
Steps: 1. … 2. …
Verify: <health/readiness probes + how to confirm success>
Rollback: <how to undo — incl. any schema change rollback>
```
