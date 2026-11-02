---
name: nestjs-conventions
description: Build backend features the way the current NestJS + TypeORM codebase already does it — thin controllers, logic in services, the project's validation and error-shape conventions, safe persistence, and real test coverage. Use whenever creating or modifying NestJS controllers, service methods, persistence, or backend tests. project-context overrides these defaults.
---

# NestJS conventions

_The mechanics of NestJS are the easy part; the risk is drifting from what the repo already does. Before adding to a service, read three neighbouring methods and mimic them — in a large file, consistency beats local cleverness — and honor every lockstep persistence rule the project names, or a write can vanish with no error._

## Check the repo first

This is the default stack this kit targets. Where the repo differs, the repo wins: match its existing patterns, and treat project-context §6 (architecture rules) as the list of the project's real rules. Use project-context §3 to find the bootstrap, modules, persistence, and tests; if it is missing or still has placeholders, discover from CLAUDE.md / AGENTS.md / README / `package.json` and say what you assumed.

## App shape (match it, don't reinvent it)

Find how `AppModule` wires TypeORM (is `synchronize` off? which modules/controllers/providers exist?). Controllers are thin and delegate straight into a service. Add a route by adding a thin handler to the controller that already owns that resource and putting the logic in its service. Don't spin up new modules/providers for a feature that fits an existing one; do create a module when the feature is a genuinely new bounded area and the repo is modular.

## Request handling

- Validation follows the project's pattern (project-context §6): either DTOs + a global `ValidationPipe` (class-validator, whitelist + forbidNonWhitelisted), or explicit checks at the service boundary. Don't assume one exists — check `main.ts` / bootstrap. Either way: required fields checked, types coerced, bad input rejected by throwing.
- Throw Nest `HttpException` subclasses (`BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`, or `new HttpException('CODE', status)`) with the right status, or the project's domain exceptions. Know which exception filter shapes the error body (project-context §6) and never leak internals in a thrown message — unknown errors must surface as a generic server error and be logged server-side only.
- Never return secrets or password/hash columns; shape the response deliberately.

## Auth

Find where authentication is enforced (project-context §6): per-route/global guards, or bootstrap middleware with a public allow-list. A new route should be protected by default — only touch the public allow-list (or `@Public()` marker) deliberately. Authentication is not authorization: role/ownership/tenant checks against the request actor must exist for every mutating path, wherever the project puts them (guard, policy, or inside the service).

## Data access

- Use the persistence pattern the repo uses — repositories, QueryBuilder, or raw SQL. Any raw SQL is **always parameterized**, never string-concatenated.
- Avoid queries in loops (N+1); bound list loads; use a transaction when several writes must succeed together.
- **Lockstep rules:** if the project has persistence pieces that must be updated together (e.g. a state builder/writer, change-detection signatures, an entity registry — see project-context §6), update every place it names. A missed entry can silently drop writes.
- Schema changes go through the project's mechanism (migrations, or a schema file applied out-of-band — project-context §2/§9). See `db-schema-design`.

## Stable identifiers

If the project has human-visible ID formats (ticket keys, counters — project-context §7), preserve the format, prefix, and padding exactly; they are visible to users and external links.

## Testing

Use the project's backend test runner (project-context §2 — Jest is the common default; some repos use `node:test` or Vitest). Cover happy + error + auth-rejection (401/403) paths. Before finishing, run the gate set from project-context §4 (type-check, tests) and, for API changes, smoke the health probe from project-context §5. (See `test-strategy` for the full pyramid.)
