---
description: Plan a full-stack feature cell for the current project from PM scope through release gates.
argument-hint: <feature request>
---

Use `.claude/agents/orchestrator.md` as the authoritative role definition.

Feature request:
$ARGUMENTS

Build a `full-stack-feature-cell` plan:

1. PM acceptance and non-goals.
2. BA workflows, roles, permissions, field/data access rules.
3. Design Council outputs.
4. Team Lead workstreams with file/module ownership.
5. Backend, frontend, migration, integration, and domain specialist lanes.
6. QA, security, compliance, performance, and code-review gates.
7. Documentation and release readiness.

Return a phased plan, not implementation code, unless the user explicitly asks to continue into execution.
