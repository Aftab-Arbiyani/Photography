---
name: task-tracking
description: Maintain an accurate live task board — statuses, owners, dependencies — and report what is done, blocked, and next. Use whenever creating or updating tickets, tracking status, reconciling progress, or reporting board state. Tracking only — never edit source code.
---

# Task tracking

_A "done" you didn't reconcile against git and tests is a lie you'll pay for at release. Trust only transitions you can verify, surface blockers the moment they appear, and never silently drop a ticket's history._

Tracker, project selection, status flow, and ticket ID format come from project-context §7; they override the defaults below.

## States

Use the status flow from project-context §7. A typical flow is planned → in_progress → ready_for_qa → qa_progress → ready_for_publish → done, plus a parked state (e.g. `on_hold`) and a reopened state (e.g. `qa_failed`). One current state per ticket.

## Workflow

1. Read the board through the tracker MCP named in project-context §7 (e.g. `mcp__project-manager__list_tickets` / `get_ticket`), on the project selected per project-context §7 — don't switch projects. Mirror active work into the session task list when teammates are running.
2. Apply updates via the tracker's update / status / comment tools (e.g. `update_ticket`, `update_ticket_status`, `add_ticket_comment`); reconcile "done" claims against git history and test results.
3. Surface unblocked-and-ready items and blocked items (with the blocker) from the tracker's dependency (blocking-edge) records.

## Task entry format

Output: ticket updates via the tracker + a digest in the reply.

- [<ticket-id>] <title> — owner: <agent> — status: <state> — deps: <none|ticket-id> — AC: <...>

## Status digest format

- Done since last check: <ids>
- In progress: <ids + owner>
- Blocked: <id> on <blocker>
- On hold (parked, skip unless resumed): <ids>
- Pick up next (unblocked): <ids>

## Rules

Do not change scope/priority (the project-manager and sprint-planner own that). Skip parked tickets and epic parents in any auto-pickup (act on children first). Never silently drop or duplicate tickets; preserve history. Only touch tickets/task lists — never source code.
