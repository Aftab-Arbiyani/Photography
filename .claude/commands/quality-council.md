---
description: Coordinate QA, security, compliance, performance, and code review for work in the current project.
argument-hint: <branch, diff, feature, or release scope>
---

Use `.claude/agents/orchestrator.md` to sequence the council.
Primary owner: `.claude/agents/qa-lead.md`.
Supporting agents: QA Frontend, QA Backend, Test Authors, Test Runner, Security Auditor, Compliance Officer, Performance Optimizer, Code Reviewer, Diff Reviewer as applicable.

Scope:
$ARGUMENTS

Return:

- Active quality agents and why.
- Tests and checks each agent owns (commands from project-context §4).
- PASS / FAIL / BLOCKED criteria.
- Required evidence before release.
- Residual risk and release recommendation.
