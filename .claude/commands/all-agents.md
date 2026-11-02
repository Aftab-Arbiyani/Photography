---
description: Build an advanced all-tier agent collaboration plan for the current project without blind dispatch.
argument-hint: <request>
---

Use `.claude/agents/orchestrator.md` as the authoritative role definition.

Request:
$ARGUMENTS

Create an advanced collaboration plan that shows how all agent tiers work together (read project-context first for stack, repo map, and rules):

- PM / BA intake tier.
- Design Council.
- Team Lead / Task Manager planning tier.
- Delivery Pod with lane ownership.
- Quality Council.
- Release, DevOps, Docs, Data validation, and Incident/Postmortem lanes where relevant.

Do not route every agent by default. Mark agents as `Active`, `Consulted`, `Gate`, `Standby`, or `Not needed`, and explain why. Include file ownership and sequencing rules so agents do not collide.
