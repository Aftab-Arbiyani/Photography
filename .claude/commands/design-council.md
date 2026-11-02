---
description: Run the design council across architecture, API, database, and UX for the current project.
argument-hint: <feature, module, or problem>
---

Use `.claude/agents/orchestrator.md` to sequence the council.
Primary owner: `.claude/agents/solution-architect.md`.
Supporting agents: `.claude/agents/api-designer.md`, `.claude/agents/database-architect.md`, `.claude/agents/ux-designer.md`.

Target:
$ARGUMENTS

Return:

- Architecture decision.
- API contract implications.
- Database/migration implications.
- UX/accessibility implications.
- Open decisions for PM or Team Lead.
- Build-ready handoff to `team-lead.md`.
