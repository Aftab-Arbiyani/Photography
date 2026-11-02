---
description: Reconcile and report the live task board via the task-manager (done / in progress / blocked / next)
argument-hint: [optional: focus area or task ids]
allowed-tools: Read, Grep, Glob, Bash
---

# Track: $ARGUMENTS

Use the task-manager subagent to keep the board accurate and report where things stand. Requires the tracker MCP named in project-context §7.

**Project facts:** load `project-context` first. Needs §7 (tracker + project selection, status flow, workflow rulebook) and §8 (integration branch, to reconcile against git).

1. Read the board — the tracker tickets for the project selected per project-context §7 (follow the workflow rulebook from project-context §7, if present).
2. Reconcile "done" claims against git history and test results; update statuses, owners, and dependencies. Never silently drop or duplicate tasks — preserve history.
3. Report a digest: Done since last check · In progress (owner) · Blocked (on what) · Pick up next (unblocked).

Tracking only — do not change scope or priority (that's project-manager / sprint-planner), and do not edit application source.
