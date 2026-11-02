---
description: Log time for a sprint-workflow transition on the live board via log_ticket_time (additive), with rule validation
argument-hint: <ticket-id> <transition> <minutes>   e.g. <ticket-id> in_progress->ready_for_qa 200
allowed-tools: mcp__project-manager__get_ticket, mcp__project-manager__log_ticket_time
---

You are logging time for a sprint-workflow transition on the live board via the tracker MCP (the project selected per project-context §7 — do not switch).

Requires the tracker MCP named in project-context §7. **Project facts:** load `project-context` first; needs §7 (tracker + project selection, ticket ID format, workflow rulebook).

User input: $ARGUMENTS
(Expected format: `<ticket-id> <transition> <minutes>`, e.g. `<ticket-id> in_progress->ready_for_qa 200`. Accept `3h 20m` and convert to minutes.)

## Time logging rules — log at phase-END, ADDITIVELY

Always use `log_ticket_time(ticket_id, minutes, note)` — it **adds** to the running total and writes an audit entry. **Never** `update_ticket(time_logged_minutes=…)`; that overwrites and can silently wipe prior logs.

| Transition                        | What to log                          |
| --------------------------------- | ------------------------------------ |
| `planned → in_progress`           | nothing — work just starting         |
| `in_progress → ready_for_qa`      | implementation + rework + validation |
| `ready_for_qa → qa_progress`      | nothing — QA just starting           |
| `qa_progress → ready_for_publish` | QA time                              |
| `qa_progress → qa_failed`         | QA + failure investigation           |
| `qa_failed → in_progress`         | nothing — rework just starting       |
| `ready_for_publish → done`        | bookkeeping (if any)                 |

## Your task

1. Parse ticket id, transition, and minutes from the input.
2. If the transition logs **nothing** → ❌ reject: "This transition does not log time. Log it when the next active phase ends." Make no MCP call.
3. If the transition logs time → `log_ticket_time(ticket_id=<id>, minutes=<n>, note="<phase that ended>")`. Optionally `get_ticket` first to report the new cumulative `time_logged_minutes`.
4. ✅ Confirm the log, name the categories the time covers, and state the new cumulative total.

Keep the response short and actionable.
