---
description: Invoke QA Lead routing for test strategy, coverage, and release-quality gates in the current project.
argument-hint: <scope>
---

Use `.claude/agents/qa-lead.md` as the authoritative role definition.

Scope:
$ARGUMENTS

Return a QA route and verification plan:

- Frontend, backend, test-author, and test-runner ownership as needed.
- Required smoke, regression, RBAC, migration, and accessibility coverage.
- Release gate status: PASS, FAIL, or BLOCKED with reasons.
