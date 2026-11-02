---
description: Start a release or incident war-room plan with the right agents for the current project.
argument-hint: <release target or incident summary>
---

Use `.claude/agents/orchestrator.md` as the authoritative role definition.

Target:
$ARGUMENTS

Choose one mode:

- `release-war-room` for promote/tag/deploy/rollback readiness.
- `incident-war-room` for production outage, SEV, rollback, or hotfix.

Return:

- Commander/owner.
- Active agents and lanes.
- Timeline or release sequence.
- Stop conditions.
- Communication artifacts.
- Done signal.
