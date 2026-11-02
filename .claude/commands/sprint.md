---
description: Run a sprint cycle end to end — plan from capacity (sprint-planner), then seed and track the board (task-manager)
argument-hint: [sprint length + team/availability, e.g. "2 weeks, 3 devs, 1 on PTO Tue-Thu"]
allowed-tools: Read, Grep, Glob, Bash, Write
---

# Sprint: $ARGUMENTS

Orchestrate a sprint end to end. Delegate to specialists — do not do their work yourself. Requires the tracker MCP named in project-context §7.

**Project facts:** load `project-context` first. Needs §7 (tracker + project selection, ticket ID format, agent identity, workflow rulebook).

1. Plan. Use the sprint-planner subagent to compute realistic capacity (deduct PTO/holidays/meetings, keep ~20% buffer; convert sizes S≈0.5d / M≈1–2d / L≈3–5d) and select committed vs stretch from the backlog, sequenced by dependency.
2. Seed the board. Use the task-manager subagent to create/update the committed tickets on the tracker board (the project selected per project-context §7) with owner, status, dependencies, and acceptance criteria carried over from the PM/BA. Agent-created tickets get assignee/reporter = the agent identity from project-context §7 and a time estimate via `update_ticket`.
3. Report. Output the sprint goal, committed and stretch lists, total capacity, and risks; surface what's unblocked and ready to start first.

Mid-sprint, use `/track` for live board status and `/plan-sprint` to re-plan. This plans and tracks only — do not write application code.
