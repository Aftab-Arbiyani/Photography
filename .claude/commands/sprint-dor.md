---
description: Run the Definition of Ready checklist for a ticket (from live board data) before planned → in_progress
argument-hint: <ticket-id>
allowed-tools: Read, mcp__project-manager__get_ticket, mcp__project-manager__add_ticket_comment
---

You are running the Definition of Ready (DoR) check for ticket: $ARGUMENTS, reading the live ticket via the tracker MCP (the project selected per project-context §7 — do not switch).

Requires the tracker MCP named in project-context §7. **Project facts:** load `project-context` first; needs §7 (Definition of Ready/Done, proof-of-done rules, workflow rulebook). Where §7 adds project-specific DoR/DoD items, check them too.

## Definition of Ready checklist

A ticket can move `planned → in_progress` only when ALL items hold:

- [ ] Acceptance criteria written and clear
- [ ] Design/mockup attached (if UI work)
- [ ] Dependencies resolved or explicitly noted
- [ ] Story estimated (`story_points` or `time_estimate_minutes` set)
- [ ] Tech approach agreed upon (for complex tickets)

## Your task

1. `get_ticket(ticket_id=<id>)` — read `acceptance_criteria`, `story_points`, `time_estimate_minutes`, `issue_type`, labels, description, and any dependency notes.
2. For each item: ✅ if satisfied from the ticket data, ❌ if missing — name exactly what is needed.
3. At the end:
   - **All pass** → confirm the ticket is **READY** for `in_progress`.
   - **Any fail** → **BLOCK** the transition and list what's missing. Optionally record the gap with `add_ticket_comment`.

Keep the response short and use a checklist format. Do not move the ticket here — that's `/sprint-move` / `/sprint-run`.
