---
name: orchestration-playbook
description: Coordinate a multi-agent build — decompose a goal into tasks, delegate to the right specialist, run work in parallel vs sequence, keep the API shape central, and route through QA/security/review. Use whenever orchestrating the team or planning how to deliver a feature across roles.
---

# Orchestration playbook

_Parallelize only genuinely independent work — two agents in one file cost more than they save. The integration step is where multi-agent builds are won or lost, so budget for it, and settle the contract before anyone writes a line of code._

Repo layout, gates, and tracker come from project-context §3, §4, and §7; they override the defaults below.

## Delivery flow

discovery (`business-analyst` / `ux-designer`) → scope (`project-manager`, `sprint-planner`) → design (`solution-architect` / `team-lead` + `database-architect`, API shape first) → build (`nestjs-backend-dev` + `frontend-engineer` in parallel, `deployment-engineer` for CI) → integrate (wire FE+BE, resolve any drift) → verify (`qa-backend`, `qa-frontend`, `security-reviewer`, `code-reviewer`) → release (`release-manager`).

## Delegation rules

- Match each task to the specialist whose description fits; do not do their work yourself.
- Parallelize only independent work; sequence dependent work and pass context forward.
- **Contract-first.** If the project has a contract artifact (OpenAPI spec, shared types, generated client), update it first and have both builders code against it. If it has none, settle the API shape in the design doc — request/response per endpoint — and pass that doc to both builders. The backend owns the shape; when the frontend consumes it through an untyped API client, the doc is the only thing preventing drift.
- Partition files so two agents never edit the same file at once.

## Ownership map (default lanes)

- backend dirs — `nestjs-backend-dev` · frontend dirs — `frontend-engineer` (paths per project-context §3)
- schema / migrations + entity mappings — `database-architect` (single writer; keep any lockstep persistence rules from project-context §6 in sync)
- the design doc / API shape — `solution-architect` / `team-lead` (single writer)
- CI / deploy config — `deployment-engineer` · docs prose — `documentation-writer`
- Never run two instances of the same specialist concurrently on the same files.

## Integrate & loop back

- After the parallel build, run an explicit integration step: wire FE+BE and confirm they agree on the shape the contract/design doc specified (without generated types, nothing else catches a mismatch).
- On drift or a failed check, route the fix to the owner — `solution-architect`/`team-lead` re-issues the design doc if the shape is wrong; otherwise the responsible builder re-aligns. The orchestrator coordinates and re-delegates; it does not patch source itself.
- Loop verify → fix → re-verify until the gate set from project-context §4 is green before release.
- Escalate to the human if the same task fails twice or a shape conflict can't be resolved by the named owners.

## Parallel vs team

- Parallel subagents: independent tasks, results report back (cheaper).
- Agent team: when workers must share the design doc and talk to each other. Give the team concrete shared surfaces to coordinate through — the design doc in the docs dir and the tracker board (project-context §7) the `task-manager` maintains.

## Board integration

Real delivery runs on the tracker from project-context §7: each task is a ticket walked through the status flow defined there, with the proof-of-done requirements from project-context §7 (e.g. a QA test-report plus live evidence) satisfied before `done`.

## Per-round status

Done; In progress; Blocked (on what); Next actions. Wait for delegated work to finish before declaring a milestone done; escalate high-stakes decisions to the human.
