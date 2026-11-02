---
name: project-context
description: The single source of project-specific facts — product, stack, repo layout, run/check/test commands, local URLs, auth and persistence model, ticket/ID conventions, git host and branch flow, CI/deploy, tracker MCP, and test-account env vars. Every agent, skill, and command reads this first instead of hardcoding project details. Install a filled-in copy per project at `.claude/skills/project-context/SKILL.md`.
---

# Project context

_Everything else in this kit is project-agnostic. This file is where a project becomes concrete. Agents read it before acting; if a slot is still a `<placeholder>`, discover the fact from the repo (CLAUDE.md, AGENTS.md, README, package.json / manifest, CI config, `.mcp.json`) and state that you did — never invent a path, command, URL, or credential._

## How to use this file

- **Per project:** copy this skill into the project's `.claude/skills/project-context/` and replace every `<placeholder>`. Delete sections that don't apply rather than leaving them blank.
- **No secrets here.** Reference credentials by environment variable name only (e.g. `$E2E_USER_PASSWORD`). Never paste a password, token, or key into this file.
- **Precedence:** facts here override the generic defaults in other skills (e.g. `nestjs-conventions`, `reactjs-conventions`). The repo's own CLAUDE.md / AGENTS.md override this file if they disagree — then fix this file.

## 1. Product

- Name: `<product name>`
- One-line purpose: `<what it does, who uses it>`
- Key domain terms: `<glossary: entities, statuses, roles>`

## 2. Stack

- Backend: `<framework + version, ORM, language>`
- Frontend: `<React (Vite SPA) | Next.js (App Router | Pages Router)> + version, styling, router>`; rendering: `<CSR | SSR | SSG/ISR | mixed>`; hosting: `<static | Node server / standalone | Vercel-style platform>`
- Database: `<engine + version>`; schema managed by `<migrations | schema file applied out-of-band | ORM sync>`
- Test runners: backend `<runner>`, frontend `<runner>`, e2e `<runner or none>`
- Other infra: `<queue, cache, object storage, email, push, ...>`

## 3. Repo map

| Area                                         | Path      | Notes                              |
| -------------------------------------------- | --------- | ---------------------------------- |
| Backend entry / bootstrap                    | `<path>`  | `<auth middleware, filters, CORS>` |
| Backend modules / services                   | `<path>`  |                                    |
| Persistence (entities / schema / migrations) | `<path>`  |                                    |
| Frontend entry / routes                      | `<path>`  |                                    |
| Frontend API client                          | `<path>`  |                                    |
| Design tokens / styles                       | `<path>`  | `<token naming convention>`        |
| Tests                                        | `<paths>` |                                    |
| Docs (architecture, schema, ADRs)            | `<paths>` |                                    |
| CI / deploy config                           | `<paths>` |                                    |

## 4. Commands

| Purpose                   | Command |
| ------------------------- | ------- |
| Install                   | `<cmd>` |
| Backend type-check / lint | `<cmd>` |
| Build                     | `<cmd>` |
| Frontend tests            | `<cmd>` |
| Backend tests             | `<cmd>` |
| E2E / integration         | `<cmd>` |
| Run locally               | `<cmd>` |

**Gate set before handing to QA / opening an MR:** `<the commands that must be green>`

## 5. Local runtime

- Frontend URL: `<http://localhost:PORT>`
- Backend URL: `<http://127.0.0.1:PORT>`
- Health / readiness probes: `<paths>`
- Test login: user `$<USER_ENV_VAR>`, password `$<PASSWORD_ENV_VAR>` (`<OTP? SSO?>`)

## 6. Architecture rules (project-specific)

- Auth model: `<session / JWT / API token; where enforced; public allow-list>`
- Authorization / scoping: `<tenant or project scoping key; where it must be enforced>`
- Validation: `<DTO + ValidationPipe | service-boundary checks | other>`
- Error shape: `<response envelope / error filter>`
- Persistence pattern: `<repository / query builder / raw SQL; transactions; anything that must be updated in lockstep>`
- Uploads / storage: `<backend, compatibility rules>`
- Invariants that must never regress: `<list>`
- Don'ts: `<deprecated paths, removed dependencies, banned patterns>`

## 7. Work items and tracker

- Tracker: `<tool>`; MCP server: `<server name>` (tool prefix `mcp__<server>__`); project selection: `<how it is fixed, e.g. .mcp.json default>`
- Ticket ID format: `<e.g. PREFIX-NNNN>`; types and prefixes: `<story / bug / task / epic → prefix>`
- Status flow: `<state machine>`
- Agent identity used when claiming work: `<bot account email or name>`
- Runner labels written to tracker fields: test reports `executed_by` = `<label>`, merge info `merged_by` = `<label>`
- Definition of Ready / Done: `<where they live; key items>`
- Proof-of-done requirements: `<screenshot / evidence rules, scripts, artifact dir>`
- Workflow rulebook: `<path, e.g. .claude/memory/sprint-workflow.md>`

## 8. Git and release

- Host: `<GitHub | GitLab (self-hosted URL)>`; CLI: `<gh | glab>`
- Repo: `<group/name>`
- Integration branch: `<develop | main>`; release branch: `<main>`; tags: `<when, who>`
- Branch naming: `<feature/|bugfix/|chore/ + id-slug>`
- Merge policy: `<who may merge; is auto-merge pre-authorized for agents?>`
- Commit / MR title format: `<convention>`

## 9. CI / deploy / ops

- CI: `<system, pipeline layout>`
- Deploy: `<process manager / container / platform; environments>`
- Schema rollout: `<how and when schema changes reach each environment>`
- Observability: `<logs, metrics, alerts, dashboards>`
