---
description: Build backend + frontend in parallel against a shared contract, then run the tests
argument-hint: [feature or contract description]
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Parallel build: $ARGUMENTS

1. If the API contract is not already defined, use the solution-architect subagent (with the api-designer subagent for endpoint shapes) to lock it first (method / path / auth / request / response / errors), written to `.claude/design/contract.md`. If schema changes are needed, use the database-architect subagent (follow the schema-management and lockstep persistence rules in project-context §2 and §6 — update every place they name together).
2. Build in parallel against `.claude/design/contract.md`, partitioning files so they do not collide (paths per project-context §3):
   - nestjs-backend-dev subagent: backend endpoints + validation + tests (backend source tree).
   - frontend-engineer subagent: frontend UI + data fetching via the project's frontend API client + tests (frontend source tree).
3. Integrate. Wire the two sides together and confirm they match the contract. On drift, route the fix to the owner (solution-architect re-issues the contract if it's wrong, otherwise the responsible builder re-aligns), then re-check.
4. Use the test-writer subagent to run the suites (the gate set from project-context §4) and report failures; loop fixes back to the responsible builder until green.

Report what was built (endpoints, components), the contract used, and any failures to fix.
