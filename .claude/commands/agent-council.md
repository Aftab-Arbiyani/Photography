---
description: Run the full agent council — every specialist contributes a bounded finding, deduplicated into one integrated plan or decision
argument-hint: <request — whole-app audit, release readiness, or cross-domain decision>
allowed-tools: Read, Grep, Glob, Bash, Task
---

# Agent Council

User request:

```text
$ARGUMENTS
```

Run Full Council Mode from `.claude/agents/orchestrator.md`.

Use this command when the user wants all agents to work together, a whole-app audit, a release-readiness review, a major roadmap decision, or a cross-domain implementation plan.

Workflow:

1. Read `CLAUDE.md`, `.claude/agents/orchestrator.md`, and `.claude/agents/README.md`.
2. Create one shared context packet for the council.
3. Ask each agent group for a bounded contribution:
   - Executive coordination: `team-lead`, `solution-architect`
   - Product/process: `business-analyst`, `sprint-planner`, `project-manager`, `task-manager`
   - Engineering owners: `frontend-engineer`, `email-template-engineer`, `database-architect`, `api-designer`, `integration-specialist`, `postman-jmeter-engineer`, `performance-optimizer`, `migration-specialist`, `deployment-engineer`
   - Quality gates: `code-reviewer`, `security-reviewer`, `qa-lead`, `qa-backend`, `qa-frontend`, `test-writer`, `pre-release-auditor`
   - Operations/learning: `incident-commander`, `postmortem-author`, `documentation-writer`, `release-manager`, `ux-designer`
4. Keep each contribution short: findings, risks, tests/checks, blockers, next step.
5. Deduplicate overlaps, resolve conflicts using the orchestrator priority order, and return one integrated plan or decision.

Do not paste raw transcripts. The final answer should show the decision, workstreams, parallelizable tasks, sequential gates, risks, and final action.
