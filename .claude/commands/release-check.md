---
description: Check promote, tag, rollback, and release readiness for the current project.
argument-hint: <branch, tag, MR, or release target>
---

Use `.claude/agents/release-manager.md` as the primary role definition.
Use `.claude/agents/pre-release-auditor.md` for the mechanical pre-promote checklist.

Release target:
$ARGUMENTS

Return:

- Target and intended promote/tag action (branch flow per project-context §8).
- Required pre-release checks and owners.
- PASS/FAIL/BLOCKED status.
- Rollback target and unresolved risks.
