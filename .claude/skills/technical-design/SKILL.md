---
name: technical-design
description: Produce a technical design or ADR for a feature — approach, data model, API shape, component structure, tradeoffs, and risks. Use whenever designing the technical approach before implementation, defining an API shape, or recording an architecture decision.
---

# Technical design & ADR

_Choose the simplest design that could work — every abstraction you add is one the next reader must decode. Settle the exact request/response shapes up front, because without a generated contract the design doc is the only thing standing between two builders and silent drift._

Architecture rules and repo layout come from project-context §3 and §6; they override the defaults below.

## Workflow

1. Understand the requirement; study the current architecture and conventions (the backend modules/services and controllers, the frontend pages and API client, the schema source — project-context §3).
2. Define the shared API shape FIRST when work will run in parallel. If the project has a contract artifact (OpenAPI spec, shared types, generated client), change it first; if not, the design doc itself is the contract the two builders code against.
3. Choose the simplest design that fits; document the tradeoff.

## Where the "contract" lives

The backend **owns** the API shape: the controller route + the service response is the truth. If the frontend consumes it through an untyped API client, no types guard drift, so the design doc must spell out request/response shapes exactly. When dispatching a parallel build, hand both `nestjs-backend-dev` and `frontend-engineer` this doc's API section. Any change is edited here first, then flagged to both builders.

## Design doc template

Output: write to the project's docs dir (project-context §3; default `docs/`).

- Context & goal: <what + why>
- Approach: <how it fits the existing modules/services and frontend pages; what changes>
- Data model: <entities, relations, schema/migration change> (hand details to `database-architect`; note the persistence pattern used and any lockstep rules from project-context §6)
- API shape: per endpoint — METHOD /api/<resource>/... — auth (per project-context §6) — request body — response — error statuses and error shape
- Frontend structure: which page/panel, which API-client calls, states to handle (loading / empty / error / success)
- Ownership & order: which agent builds what, in what sequence
- Tradeoffs (ADR): options considered, decision, rationale, what would change it
- Risks & unknowns; high-level test strategy (the project's backend/frontend test runners, project-context §2)

## API entry (example)

POST /api/<resource>/:id/dependencies — auth: <per project-context §6> — req: { blocks_id } — res 200: { id, ... } — errors: 400 invalid, 404 not found, 409 cycle

## Principles

Simplicity over cleverness; consistency with the repo's existing patterns (by default thin controllers with logic in services, and the persistence pattern from project-context §6); explicit request/response shapes so FE/BE cannot drift; security (authorization in the service) and performance designed in.
