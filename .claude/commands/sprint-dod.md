---
description: Run the Definition of Done checklist for a ticket (from live board data) before ready_for_publish → done
argument-hint: <ticket-id>
allowed-tools: Read, mcp__project-manager__get_ticket, mcp__project-manager__add_ticket_comment
---

You are running the Definition of Done (DoD) check for ticket: $ARGUMENTS, reading the live ticket via the tracker MCP (the project selected per project-context §7 — do not switch).

Requires the tracker MCP named in project-context §7. **Project facts:** load `project-context` first; needs §7 (Definition of Ready/Done, proof-of-done rules, workflow rulebook) and §8 (integration branch). Where §7 adds project-specific DoR/DoD items, check them too.

## Definition of Done checklist

A ticket can move `ready_for_publish → done` only when ALL items hold:

- [ ] Code ready to merge into the integration branch (project-context §8)
- [ ] All acceptance criteria verified by QA (`test_report` present, status `passed`)
- [ ] No regressions introduced
- [ ] Docs updated (if applicable)
- [ ] Time logs recorded for all phases (`time_logged_minutes` > 0 where work happened)
- [ ] All fix comments present (if the ticket had any `qa_failed` cycle)
- [ ] **PoD uploaded per project-context §7** — kit default is dual-kind: `kind="fixed"` (QA card) AND `kind="evidence"` (PM live-screenshot frame). _Carveout:_ surfaces visible only inside the git host (CI config, pipeline status) may note "PoD skipped — git-host-only surface".
- [ ] PO approved the release

## Your task

1. `get_ticket(ticket_id=<id>)` — read `test_report`, `dod_checklist`, `time_logged_minutes`, comments (fix comments + PoD uploads), `merge_info`, children.
2. For each item: ✅ if satisfied, ❌ if missing — name exactly what is needed. Confirm every required PoD kind exists; if a parent, confirm every child is `done`.
3. At the end:
   - **All pass** → confirm the ticket is **READY TO CLOSE** as `done`.
   - **Any fail** → **BLOCK** and list what's missing (if the tracker hard-gates `done` on PoD, the flip will be rejected anyway).

Keep the response short and use a checklist format. Do not move the ticket here — that's `/sprint-publish` / `/sprint-run`.
