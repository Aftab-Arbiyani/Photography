---
description: Walk a specified list of tickets through the full sprint workflow to done on the live board via the tracker MCP — gates, QA dispatch, fix-comment + publish inline
argument-hint: <ticket-ids…>   e.g. <id-1> <id-2> <id-3>
allowed-tools: Read, Bash, Grep, Skill, Task, mcp__project-manager__list_tickets, mcp__project-manager__get_ticket, mcp__project-manager__update_ticket, mcp__project-manager__update_ticket_status, mcp__project-manager__add_ticket_comment, mcp__project-manager__claim_ticket, mcp__project-manager__log_ticket_time, mcp__project-manager__set_test_report, mcp__project-manager__append_merge_info, mcp__project-manager__upload_proof_of_done, mcp__project-manager__create_ticket
---

You are running the full sprint workflow for a **specified list** of tickets, one at a time, each from its current state to `done`, on the live board via the tracker MCP. Gates, QA dispatch, fix-comment, and publish are handled inline. Requires the tracker MCP named in project-context §7. Rulebook: the workflow rulebook from project-context §7 (if present).

Tickets input: $ARGUMENTS
(Expected: a list of ids in the ticket ID format from project-context §7.)

## Project facts

Load `project-context` first. This command needs:

- **§4** — the gate set that must be green before `ready_for_qa`.
- **§5** — frontend/backend URLs and the test-account env vars (PoD capture).
- **§7** — tracker MCP + project selection, ticket ID format and types (incl. which type is an epic), agent identity, PoD rules (kinds, scripts, artifact dir), workflow rulebook.
- **§8** — git host CLI (`glab` for GitLab, `gh` for GitHub), integration branch, branch naming per ticket type, merge policy.

Use the project selected per project-context §7 — do not switch. One transition per `update_ticket_status`; never skip a state. Each ticket is driven exactly as `/sprint-run`; each edge follows `/sprint-move`.

## State machine (per ticket)

```
planned → in_progress → ready_for_qa → qa_progress → ready_for_publish → done
                           │
                      qa_failed → in_progress   (retry; needs Fix Comment)
```

Tickets enter as `planned` (the "To Do" column; there is no `todo` status key). **Skip `on_hold`** ids (parked) and **epics** (walk their children). If the batch mixes siblings under one parent, batch them through QA together and close them together before the parent.

## Time logging — `log_ticket_time` (ADDITIVE minutes, at phase-END)

Never `update_ticket(time_logged_minutes=…)`. Log implementation at `in_progress → ready_for_qa`; QA at `qa_progress → ready_for_publish`; QA + investigation at `qa_progress → qa_failed`; nothing on the no-log edges.

## Step 1 — Build the queue

`get_ticket` each id; read its current status. Order **oldest non-epic, non-on_hold first**, children before their parent. Skip `on_hold`/epic ids with a one-line note. Announce (ids illustrative):

```
🚀 Sprint Batch — 3 tickets
<id-1> (planned) → <id-2> (in_progress) → <id-3> (ready_for_publish)
Order: children before parents; on_hold + epics skipped.
```

No confirmation prompt — proceed straight into Step 2.

## Step 2 — Walk each ticket to done

For each ticket, drive it exactly as `/sprint-run`:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Ticket 1 of 3: <id-1>
📍 Current: planned
🛣  Remaining: in_progress → ready_for_qa → qa_progress → ready_for_publish → done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- **🧭 Route first** (once per ticket): `orchestrator` subagent classifies + emits the smallest lane plan; implementation goes to the routed owner (`nestjs-backend-dev` / `frontend-engineer` / `database-architect` / `deployment-engineer`) with a `code-reviewer` (+ `security-reviewer` on auth/webhook/upload/SQL surfaces) gut-check before the MR.
- Apply each `/sprint-move` gate + side-effects, make the single `update_ticket_status` call, `log_ticket_time` for the phase that ended, `claim_ticket(<agent identity from project-context §7>)` on dev stages, emit the §7 ack.
- **DoR** (`planned → in_progress`): AC + story points + agreed approach; cut `<prefix>/<ticket-id>-<slug>` off the integration branch — prefix per ticket type, per project-context §7/§8.
- **`in_progress → ready_for_qa`**: the gate set from project-context §4 green; tick every `dod_checklist` item true EXCEPT the PoD item; commit + push + MR/PR to the integration branch.
- **`ready_for_qa → qa_progress`**: dispatch `qa-backend` / `qa-frontend` to author + run tests.
- **`qa_progress → qa_failed`**: attach the structured QA Failure Report; loop `qa_failed → in_progress` needs the developer's `## 🔧 Fix Comment` citing the failure-report timestamp (run `/sprint-fix`), then re-walk to QA.
- **`ready_for_publish → done`**: run the inline publish flow (Step 3).

## Step 3 — Inline publish flow

1. Merge into the integration branch with the git host CLI (`glab mr merge <N> --remove-source-branch` / `gh pr merge <N> --delete-branch`) — only if project-context §8 says agent merges are pre-authorized; otherwise ask. Promotion to the release branch + tags stay human-gated.
2. `git fetch origin <integration-branch> && git log origin/<integration-branch> -1 --oneline` — confirm it advanced; capture the merge SHA.
3. **PoD per project-context §7** (REQUIRED; kit default dual-kind — if the tracker hard-gates `done` on the QA-kind `fixed` PoD, the flip is rejected without it; the `evidence` frame is a process requirement on top): real screenshot of the running app at the frontend URL from §5 (log in with the test-account env vars from §5) → `kind="evidence"` (framed with the §7 framing script, if any) AND `kind="fixed"` (QA card). Artifacts under the §7 PoD artifact dir.
4. `append_merge_info(...)`; `update_ticket(dod_checklist=[… PoD item done:true …])`; `log_ticket_time` bookkeeping if any.
5. `update_ticket_status(status="done", reason="MR !N merged @ <SHA>; PoD captured")`; `add_ticket_comment` closure summary.
6. **Parent close:** after the last child in the batch reaches `done`, re-verify every sibling is `done`/`cancelled`, then flip the parent `ready_for_publish → done`.

## §7 ack after every transition

```text
✅ <action taken, with the new status>
⏱ <minutes this turn> min (via log_ticket_time; cumulative now <total>)
🔲 <gates verified — DoR / Fix-Comment / DoD ticked / test_report / merge_info / PoD fixed+evidence>
🚫 <blocks remaining with the gate name; "none" if clean>
```

## Step 4 — Final summary

```
📊 Batch Summary
┌────────┬──────────────────┬───────────────┬─────────────────────┐
│ Ticket │ Final State      │ Time logged   │ MR / merge SHA      │
├────────┼──────────────────┼───────────────┼─────────────────────┤
│ <id-1> │ ✅ done          │ 270 min       │ !214  @ 7i8j9k0      │
│ <id-2> │ ✅ done          │ 180 min       │ !213  @ e4f5g6h      │
│ <id-3> │ ⛔ blocked (DoR) │ 0 min         │ —                   │
└────────┴──────────────────┴───────────────┴─────────────────────┘

✅ Done: 2  ⛔ Blocked: 1
Total time logged: 450 min   MRs merged: 2 (→ <integration-branch>)
```

## Notifications & failure modes

Send a Claude app notification when each ticket (or its parent) reaches `done`, and on any blocker. If a status won't move, a change breaks tests, or a PoD upload returns 400/401/403/409 → stop on that ticket, report the backend error verbatim, continue with the next; never bypass a gate.

## Start now

`get_ticket` each id → skip on_hold/epics → sequence children-first → walk each to `done` autonomously → print the summary.
