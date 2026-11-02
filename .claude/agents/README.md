# Reusable Claude Code agent kit

Specialised Claude Code subagents, skills, and commands that work in any project. The default stack is NestJS + TypeORM backend, React (Vite SPA) or Next.js (App or Pages Router) frontend with Tailwind, PostgreSQL; agents follow the repo's existing patterns where it differs. Every project-specific fact (paths, commands, URLs, rules, tracker, git flow) lives in one place: the `project-context` skill.

## Install in a project

1. Copy the kit into the project's `.claude/` directory:
   - `agents/` → `.claude/agents/`
   - `skills/` → `.claude/skills/`
   - `commands/` → `.claude/commands/`
2. Fill in `.claude/skills/project-context/SKILL.md` (the template ships in `skills/project-context`). Replace every `<placeholder>`; reference credentials by env var name only. Nothing else is project-specific.
3. The sprint commands additionally need the tracker MCP named in project-context §7.

Invoke via the Agent tool with `subagent_type: <name>`.

For coordinated work, use `/orchestrate <request>` or invoke `subagent_type: orchestrator` directly. For all-agent collaboration, use `/agent-council <request>`.

## Frontmatter conventions

Every agent carries full frontmatter so routing, cost, and permissions are explicit:

- **`name` / `description`** — the description says _when_ to invoke, specifically enough that the agent gets picked at the right time.
- **`tools`** — an explicit allow-list, not "all tools":
  - **Read-only roles** (`code-reviewer`, `security-reviewer`, `diff-reviewer`, `pre-release-auditor`, `performance-optimizer`, `qa-lead`, `business-analyst`, `explorer`, `test-runner`, `data-analyst`, `incident-commander`) get `Read, Grep, Glob, Bash, Skill` — **no** `Edit`/`Write`/`NotebookEdit`.
  - **Implementation roles** get the full authoring set (`Read, Write, Edit, Grep, Glob, Bash, Skill`).
  - **Coordinators** (`orchestrator`, `team-lead`, `project-manager`) get `Agent, Read, Grep, Glob, Bash, Skill`.
- **`model`** — tiered by cost: `haiku` for light/operational agents, `sonnet` for mid-complexity, `opus` for heavy reasoning, `fable` for the most demanding reasoning + long-horizon roles.
- **`skills`** — links to the shared skills in `.claude/skills/`; `project-context` is always first (e.g. `nestjs-conventions`, `code-review`, `db-schema-design`, `test-strategy`).
- **`memory: project`** — persistent per-project agent memory.

## Inventory (33 agents)

### Orchestration (1)

| Agent          | Model | Tools | Use for                                                                                                        |
| -------------- | ----- | ----- | -------------------------------------------------------------------------------------------------------------- |
| `orchestrator` | fable | coord | Advanced routing, workstream sequencing, Full Council Mode, release/incident coordination, integrated handoffs |

### Engineering specialists (8)

| Agent                     | Model  | Tools | Use for                                                                                            |
| ------------------------- | ------ | ----- | -------------------------------------------------------------------------------------------------- |
| `nestjs-backend-dev`      | opus   | rw    | NestJS controllers/services/modules, TypeORM/SQL persistence, auth, uploads, backend reliability   |
| `frontend-engineer`       | opus   | rw    | React (Vite) or Next.js pages, server/client components, design tokens, styling, API client wiring |
| `database-architect`      | opus   | rw    | Schema, entities, indexes, data-shape evolution                                                    |
| `api-designer`            | sonnet | rw    | REST contracts for the backend routes, error/status semantics, idempotency                         |
| `email-template-engineer` | sonnet | rw    | Mail transport, lifecycle + digest email, escaping, push-notification adjacency                    |
| `integration-specialist`  | sonnet | rw    | Git webhook, object storage, external systems, inbound-endpoint hardening                          |
| `postman-jmeter-engineer` | sonnet | rw    | Postman collections, JMeter plans, Newman/JTL latency reports                                      |
| `performance-optimizer`   | sonnet | ro    | Backend hot paths, query hot spots, frontend render/bundle perf                                    |

### Architecture + coordination (5)

| Agent                | Model  | Tools | Use for                                                                 |
| -------------------- | ------ | ----- | ----------------------------------------------------------------------- |
| `solution-architect` | fable  | rw    | System design across backend/frontend/DB/integrations                   |
| `team-lead`          | opus   | coord | Scope vs effort, decomposition, sequencing, delegation                  |
| `project-manager`    | opus   | coord | Intake, readiness, capacity, dependencies, WIP/status, ticket lifecycle |
| `sprint-planner`     | sonnet | rw    | Sprint + backlog decomposition, capacity, WIP limits                    |
| `task-manager`       | haiku  | rw    | Story→task decomposition, WIP tracking, stuck items                     |

### Review + quality (7)

| Agent                 | Model  | Tools | Use for                                                               |
| --------------------- | ------ | ----- | --------------------------------------------------------------------- |
| `code-reviewer`       | fable  | ro    | Full-diff correctness, idiom, dead code, test parity, merge decision  |
| `security-reviewer`   | fable  | ro    | Auth gate, injection, tenant/project scoping, secrets, uploads        |
| `diff-reviewer`       | sonnet | ro    | Fast narrow single-diff gut-check before an MR                        |
| `pre-release-auditor` | sonnet | ro    | Final pre-merge / pre-release checklist and verdict                   |
| `qa-lead`             | sonnet | ro    | Test strategy, regression scope, release readiness                    |
| `qa-backend`          | sonnet | rw    | Backend route/service/persistence + integration QA                    |
| `qa-frontend`         | sonnet | rw    | React or Next.js page/flow, hydration, dark mode, a11y, responsive QA |

### Ops + reliability (4)

| Agent                  | Model  | Tools | Use for                                                            |
| ---------------------- | ------ | ----- | ------------------------------------------------------------------ |
| `deployment-engineer`  | sonnet | rw    | CI pipelines, deploys, probes, schema rollout, observability       |
| `migration-specialist` | opus   | rw    | Schema rollout, persistence-style moves, cross-subsystem refactors |
| `incident-commander`   | sonnet | ro    | Live production response and containment                           |
| `postmortem-author`    | sonnet | rw    | Blameless postmortem after resolution                              |

### Process + docs (4)

| Agent                  | Model  | Tools | Use for                                                          |
| ---------------------- | ------ | ----- | ---------------------------------------------------------------- |
| `business-analyst`     | sonnet | ro    | Requirement decomposition, acceptance criteria, edge cases       |
| `documentation-writer` | sonnet | rw    | README, CLAUDE.md, AGENTS.md, project-context, docs, inline docs |
| `release-manager`      | sonnet | rw    | Versioning, changelog, tags, branch/merge flow                   |
| `ux-designer`          | sonnet | rw    | UX flows, layouts, copy, a11y, dark mode (specs, not code)       |

### Discovery + data (3)

| Agent          | Model  | Tools | Use for                                                                      |
| -------------- | ------ | ----- | ---------------------------------------------------------------------------- |
| `explorer`     | haiku  | ro    | Read-only codebase discovery — locate files/symbols/refs, line-cited answers |
| `test-runner`  | haiku  | ro    | Run the suites/type-check/build, report only failures + likely causes        |
| `data-analyst` | sonnet | ro    | Read-only SQL over the project schema for cycle time, throughput, velocity   |

### Domain (1)

| Agent         | Model  | Tools | Use for                                                                        |
| ------------- | ------ | ----- | ------------------------------------------------------------------------------ |
| `test-writer` | sonnet | rw    | Extend backend + frontend test coverage, strengthen assertions, stub externals |

`rw` = full authoring tools · `ro` = read-only (`Read, Grep, Glob, Bash, Skill`) · `coord` = coordinator (`Agent` + read tools + `Bash` + `Skill`).

## Org chart

```
orchestrator
└── team-lead
    ├── solution-architect
    │   ├── nestjs-backend-dev
    │   ├── frontend-engineer
    │   ├── database-architect
    │   ├── api-designer
    │   ├── email-template-engineer
    │   ├── integration-specialist
    │   ├── postman-jmeter-engineer
    │   ├── performance-optimizer  (read-only)
    │   └── migration-specialist
    ├── sprint-planner
    ├── project-manager
    │   └── task-manager
    ├── qa-lead  (read-only)
    │   ├── qa-backend
    │   ├── qa-frontend
    │   ├── test-writer
    │   ├── test-runner  (read-only)
    │   └── pre-release-auditor  (read-only)
    ├── code-reviewer  (read-only; parallel to security-reviewer)
    ├── security-reviewer  (read-only)
    ├── diff-reviewer  (read-only; fast per-diff)
    ├── deployment-engineer
    ├── incident-commander  (read-only)
    │   └── postmortem-author
    ├── business-analyst  (read-only)
    ├── documentation-writer
    ├── release-manager
    ├── ux-designer  (pairs with frontend-engineer)
    ├── explorer  (read-only; serves any agent)
    └── data-analyst  (read-only; serves PM/lead)
```

## Routing matrix

| Request shape                                | Primary owner                         | Required collaborators                                                    |
| -------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| NestJS endpoint, controller/service contract | `api-designer`                        | `nestjs-backend-dev`, `qa-backend`, `security-reviewer` for mutating/auth |
| Backend implementation, persistence, uploads | `nestjs-backend-dev`                  | `database-architect`, `qa-backend`, `security-reviewer`                   |
| Frontend page, view, UI component, a11y      | `frontend-engineer`                   | `ux-designer`, `qa-frontend`, `api-designer` if contract changes          |
| Schema, table/column, index, data-shape      | `database-architect`                  | `migration-specialist`, `nestjs-backend-dev`, `deployment-engineer`       |
| Email/notification, mail transport, push     | `email-template-engineer`             | `security-reviewer`, `qa-backend`                                         |
| Git webhook, object storage, external system | `integration-specialist`              | `nestjs-backend-dev`, `security-reviewer`                                 |
| Postman/JMeter, latency budgets              | `postman-jmeter-engineer`             | `api-designer`, `performance-optimizer`, `qa-backend`                     |
| Performance, hot paths, bundle               | `performance-optimizer`               | affected owner, `qa-lead`                                                 |
| CI, deploy, probes, schema rollout           | `deployment-engineer`                 | `security-reviewer`, `pre-release-auditor`                                |
| Schema migration / cross-subsystem refactor  | `migration-specialist`                | `solution-architect`, `database-architect`, affected owners               |
| Sprint/backlog/capacity                      | `sprint-planner`                      | `project-manager`, `task-manager`, `team-lead`                            |
| Ticket lifecycle, readiness, WIP, schedule   | `project-manager`                     | `orchestrator`, `task-manager`, QA owner                                  |
| Vague requirement                            | `business-analyst`                    | `team-lead`, relevant owner after clarification                           |
| "Where is X / what references Y"             | `explorer`                            | — (serves the dispatching agent)                                          |
| Metrics/KPIs from the data                   | `data-analyst`                        | `project-manager`                                                         |
| Run the suites / did it pass                 | `test-runner`                         | `test-writer` for gaps                                                    |
| Quick per-diff gut-check                     | `diff-reviewer`                       | `code-reviewer` if risk exceeds the diff                                  |
| Whole-app audit, readiness baseline          | `code-reviewer` + `security-reviewer` | `qa-lead`, `pre-release-auditor`                                          |
| Release/changelog/tag                        | `release-manager`                     | `qa-lead`, `pre-release-auditor`, `deployment-engineer`                   |
| Production incident                          | `incident-commander`                  | affected owner, `deployment-engineer`, `postmortem-author` after          |
| Documentation-only                           | `documentation-writer`                | relevant owner for fact-checking                                          |

## Cross-agent coordination

- **Orchestration entry point:** use `orchestrator` when a request spans domains, needs sequencing, or the right specialist is unclear. It picks the smallest useful squad and returns one integrated answer.
- **Orchestrator + PM:** for non-trivial ticket/sprint work, pair with `project-manager` first to confirm readiness, acceptance criteria, capacity/WIP, dependencies, and the next transition.
- **Explorer + test-runner as force multipliers:** any agent can dispatch `explorer` to locate code (line-cited, no crawl) or `test-runner` to run the suites — both read-only, both keep verbose output out of the main thread.
- **Diff vs full review:** `diff-reviewer` gives a fast per-diff gut-check; `code-reviewer` owns the full-MR, architectural, merge-or-not review. Both are read-only.
- **Code vs security review:** both review every non-trivial change — `code-reviewer` for quality, `security-reviewer` for exploitability (injection, the auth gate, tenant/project scoping, secrets).
- **Frontend vs UX:** `ux-designer` defines flows + tokens; `frontend-engineer` implements. UX never edits product logic; frontend doesn't invent new design tokens unilaterally.
- **Architecture → migration:** `solution-architect` decides; `migration-specialist` sequences the cutover; `database-architect` owns the schema; `deployment-engineer` rolls it out.
- **Incident → postmortem:** `incident-commander` resolves live; `postmortem-author` writes the blameless writeup after.

## Adding a new agent

Drop a `<name>.md` here with full frontmatter:

```markdown
---
name: <kebab-case-name>
description: <when to invoke — specific enough to get picked at the right time>
tools: Read, Grep, Glob, Bash, Skill # read-only; add Write, Edit for implementation roles
model: opus # tier alias: opus | sonnet | haiku (each resolves to the latest model of that tier)
memory: project
effort: max # reasoning effort; high for cheap mechanical roles
skills:
  - project-context # always first
  - <skill-name>
color: blue # role-group hue: reviewers green, security/incident red, coordination purple, backend blue, frontend/ux cyan/pink, ops orange, docs yellow
---

<system prompt body: role, procedure, checklists, output format — no project facts>
```

Then reference it via `subagent_type: <name>`. Keep agent bodies project-agnostic: describe the role's expertise and procedure, and point to project-context sections (e.g. "run the gate set from project-context §4", "ticket ID format from project-context §7") instead of hardcoding paths, commands, URLs, ticket IDs, or invariants. Start the body with a short "Orient first" step: read project-context, fall back to CLAUDE.md / AGENTS.md / README / manifests if it is missing or still has placeholders (and say what was assumed), and use `explorer` to locate code. Project facts belong in project-context, never in an agent.
