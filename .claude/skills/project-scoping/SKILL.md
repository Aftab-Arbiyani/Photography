---
name: project-scoping
description: Turn a goal or feature idea into a scoped plan — goals/non-goals, a task breakdown with owners and dependencies, acceptance criteria, and risks. Use whenever scoping work, breaking a feature into tasks, defining acceptance criteria, or planning delivery.
---

# Project scoping & task breakdown

_The non-goals prevent more pain than the goals. Name what you're explicitly not doing, and make every task independently verifiable — if you can't write its Given/When/Then, it isn't scoped yet._

## Workflow

1. Restate the goal and a measurable success signal.
2. Set goals AND non-goals (what is explicitly out).
3. Break into self-contained, independently verifiable tasks; assign a likely owner and dependencies.

## Owner routing (default roster)

backend → `nestjs-backend-dev`; frontend → `frontend-engineer`; schema / migration changes → `database-architect`; infra/CI (the CI config from project-context §3/§9) → `deployment-engineer`; tests → `qa-backend` / `qa-frontend`; design/UX → `ux-designer`; architecture / API shape → `solution-architect` or `team-lead`; requirements clarification → `business-analyst`.
If functional requirements are unclear, hand off to `business-analyst` before scoping — don't invent requirements.

## Plan template

Output: write to the project's docs dir (project-context §3; default `docs/`).

- Objective: <one line + success metric>
- Goals: <...> | Non-goals: <...>
- Tasks:
  - T1 <title> — owner: <agent> — size: S/M/L — deps: <none|T#> — AC: Given/When/Then
  - T2 ...
    (size S/M/L maps to ideal-days for sprint-planning: S ≈ 0.5d, M ≈ 1–2d, L ≈ 3–5d; split anything bigger than L)
- Sequencing: <what is first; what can run in parallel>
- Priorities: P0 must-ship; P1 should; P2 nice-to-have
- Risks & open questions: <...>

## Board note

Real delivery runs on the tracker from project-context §7 (e.g. the `mcp__project-manager__*` MCP, on the project selected there): each scoped task becomes a ticket walked through the status flow defined there. Size and AC here should be concrete enough to seed those tickets directly.

## Acceptance-criteria rule

Write AC as Given/When/Then so QA can turn each directly into a test.
