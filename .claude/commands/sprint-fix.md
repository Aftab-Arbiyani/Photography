---
description: Document a fix on a ticket as a board comment via the tracker MCP (required after qa_failed) — must cite the QA Failure Report
argument-hint: <ticket-id> <fix description>
allowed-tools: Read, mcp__project-manager__get_ticket, mcp__project-manager__add_ticket_comment
---

You are documenting a fix on a sprint ticket as a **board comment** via the tracker MCP (the project selected per project-context §7 — do not switch).

Requires the tracker MCP named in project-context §7. **Project facts:** load `project-context` first; needs §7 (tracker + project selection, ticket ID format, workflow rulebook).

User input: $ARGUMENTS
(Expected format: `<ticket-id> <fix description>`)

## When this is required

Whenever a ticket has been through `qa_failed`, the developer **must** add a fix comment before it can move back to `ready_for_qa`. The fix comment MUST reference the **QA Failure Report** written at `qa_progress → qa_failed` (quote the broken AC + observed behaviour, link by timestamp). QA will not pick the ticket up again until this comment exists.

## Your task

1. Parse the ticket id and fix description from `$ARGUMENTS`.
2. `get_ticket(ticket_id=<id>)` — find the most recent `## ❌ QA Failure Report` comment (or `test_report` with status `failed`) and read its timestamp + broken AC. If none exists, tell the user QA has not filed a Failure Report yet and stop.
3. If the description is missing or too vague (under ~10 words), ask for more detail. The comment must answer: **What was broken** (quote the broken AC + observed behaviour from the Failure Report) · **What was changed** (files, functions, config) · **Verified by** (manual test, unit test, repro steps).
4. `add_ticket_comment(ticket_id=<id>, body=…)` using exactly this format:

   ```markdown
   ## 🔧 Fix Comment — <YYYY-MM-DD HH:MM>

   **What was broken:** ... (quote the broken AC + observed behaviour)
   **What was changed:** ...
   **Verified by:** ...
   **Refs:** QA Failure Report <YYYY-MM-DD HH:MM>
   ```

5. Confirm to the user with a preview, then remind:
   > ✅ Fix documented and linked to the Failure Report. Ticket is eligible to move `qa_failed → in_progress → … → ready_for_qa`.

Do not change the ticket status here — that's `/sprint-move` / `/sprint-run`. Keep the response short; use the block above verbatim so QA can find fix comments and the gate can verify the `**Refs:**` link.
