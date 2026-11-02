---
description: Sweep the board — discover every actionable ticket via the tracker MCP and walk each from current state to done (orchestrator-routed lanes, gates, QA dispatch, publish inline) until only on_hold remains
argument-hint: [optional status/id filter]
allowed-tools: Read, Bash, Grep, Skill, Task, mcp__project-manager__list_tickets, mcp__project-manager__get_ticket, mcp__project-manager__list_sprints, mcp__project-manager__list_statuses, mcp__project-manager__create_ticket, mcp__project-manager__update_ticket, mcp__project-manager__update_ticket_status, mcp__project-manager__add_ticket_comment, mcp__project-manager__claim_ticket, mcp__project-manager__log_ticket_time, mcp__project-manager__set_test_report, mcp__project-manager__append_merge_info, mcp__project-manager__upload_proof_of_done
---

You are running the **full board sweep**: discover every actionable ticket via the tracker MCP and walk each one from its current state to `done`, with gates, QA dispatch, and the publish flow handled inline. Requires the tracker MCP named in project-context §7. Rulebook: the workflow rulebook from project-context §7 (if present).

Optional input (filter / single-id override): $ARGUMENTS

## Project facts

Load `project-context` first. This command needs:

- **§4** — the gate set that must be green before `ready_for_qa`.
- **§5** — frontend/backend URLs and the test-account env vars (PoD capture).
- **§7** — tracker MCP + project selection, ticket ID format and types (incl. which type is an epic), agent identity, PoD rules (kinds, scripts, artifact dir), workflow rulebook.
- **§8** — git host CLI (`glab` for GitLab, `gh` for GitHub), integration branch, branch naming per ticket type, merge policy.

> Use the project selected per project-context §7 — do not switch. One transition per `update_ticket_status`; never skip a state. Drive autonomously — no confirmation prompts (except a merge project-context §8 does not pre-authorize); only stop on a genuine block or when only `on_hold` remains.

## State machine (per ticket)

```
planned → in_progress → ready_for_qa → qa_progress → ready_for_publish → done
                           │
                      qa_failed → in_progress   (retry; needs Fix Comment)
```

The per-edge gate, additive time-log (`log_ticket_time` — never `update_ticket(time_logged_minutes)`), and side-effects for each transition are defined in `/sprint-move`; each ticket is driven exactly as `/sprint-run`.

## Step 1 — Discover the queue

1. `list_statuses()` and `list_sprints()` to ground the state set + active sprint, then `list_tickets()` (narrow to `$ARGUMENTS` if it's a filter/id).
2. Filter **status NOT IN (`done`, `on_hold`)**.
3. **Skip `on_hold` entirely** — no transitions, impl, or comments. Only act on it if the user names it explicitly.
4. **Skip epics (the epic type per project-context §7) and parents until all their children are `done`.** A ticket with children is sequenced after them; it reaches `done` only once every child is `done` (or `cancelled` w/ comment).
5. Order the remaining tickets **oldest non-epic, non-on_hold first**, children before their parent. Announce (ids illustrative):

```
📋 Board — 6 actionable tickets

🟣 ready_for_publish (1): <id-1>
🟢 ready_for_qa (1):      <id-2>
🟡 in_progress (2):       <id-3>, <id-4>
🔵 planned (2):           <id-5>, <id-6>
⏸ on_hold (skipped):     <id-7>
```

No confirmation prompt — proceed straight into Step 2.

## Step 2 — Walk each ticket to done (one transition at a time)

For each ticket in order:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Ticket 3 of 6: <id-3>
📍 Current: in_progress
🛣  Remaining: ready_for_qa → qa_progress → ready_for_publish → done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Walk forward one edge at a time, applying the matching `/sprint-move` gate + side-effects, making the single `update_ticket_status` call, `log_ticket_time` for the phase that ended, `claim_ticket(<agent identity from project-context §7>)` on dev stages, and emitting the §7 four-line ack:

- **🧭 Route first** (once per ticket, before any transition): the `orchestrator` subagent classifies the ticket (type + changed surfaces) and emits the smallest lane plan — owner specialist (`nestjs-backend-dev` / `frontend-engineer` / `database-architect` / `deployment-engineer`), supporting agents, and applicable gates. Implementation is dispatched to that owner (with a `code-reviewer`, plus `security-reviewer` on auth/webhook/upload/SQL surfaces, gut-check before the MR) — never implement outside the routed lane.
- **DoR** (`planned → in_progress`): AC + story points + agreed approach. `claim_ticket(<agent identity>)`; cut `<prefix>/<ticket-id>-<slug>` off the integration branch — prefix per ticket type, per project-context §7/§8. Fail → record the gap, mark blocked, move to the next ticket.
- **`in_progress → ready_for_qa`**: the gate set from project-context §4 green; tick every `dod_checklist` item true EXCEPT the PoD item; commit + push + MR/PR to the integration branch.
- **`ready_for_qa → qa_progress`**: dispatch a QA agent (`qa-backend` / `qa-frontend`) to author + run the test(s) — Dev does not write QA cases.
- **`qa_progress → ready_for_publish`**: `set_test_report(status="passed", …)`.
- **`qa_progress → qa_failed`**: attach the structured QA Failure Report (Tested · Expected · Actual · Broken AC · Severity · Reproduction). Loop `qa_failed → in_progress` needs the developer's `## 🔧 Fix Comment` citing the failure-report timestamp, then re-walk to QA.
- **`ready_for_publish → done`**: run the inline publish flow (Step 3).

**Children batch with their parent:** siblings under one parent flip to `ready_for_qa` together, then to `done` together, then the parent flips `done`. No solo child closures.

## Step 3 — Inline publish flow (`ready_for_publish → done`)

1. Merge into the integration branch with the git host CLI (`glab mr merge <N> --remove-source-branch` / `gh pr merge <N> --delete-branch`) — only if project-context §8 says agent merges are pre-authorized; otherwise ask. Promotion to the release branch + tags stay human-gated.
2. `git fetch origin <integration-branch> && git log origin/<integration-branch> -1 --oneline` — confirm it advanced; capture the merge SHA.
3. **PoD per project-context §7** (REQUIRED; kit default dual-kind — if the tracker hard-gates `done` on the QA-kind `fixed` PoD, the flip is rejected without it; the `evidence` frame is a process requirement on top): real screenshot of the running app at the frontend URL from §5 (log in with the test-account env vars from §5) → `kind="evidence"` (framed with the §7 framing script, if any) AND `kind="fixed"` (QA card). Respect the §7 status/actor gates; upload before flipping to done. Artifacts under the §7 PoD artifact dir.
4. `append_merge_info(ticket_id, mr_url, merge_sha, mr_number, source_branch, target_branch="<integration-branch>", title)`.
5. `update_ticket(ticket_id, dod_checklist=[… PoD item done:true …])`; `log_ticket_time` bookkeeping if any.
6. `update_ticket_status(ticket_id, status="done", reason="MR !N merged @ <SHA>; PoD captured")`; `add_ticket_comment` closure summary.
7. **Parent close:** after the last child reaches `done`, re-verify every sibling is `done`/`cancelled`, then flip the parent `ready_for_publish → done` ("All N children done").

## §7 ack after every transition

```text
✅ <action taken, with the new status>
⏱ <minutes this turn> min (via log_ticket_time; cumulative now <total>)
🔲 <gates verified — DoR / Fix-Comment / DoD ticked / test_report / merge_info / PoD fixed+evidence>
🚫 <blocks remaining with the gate name; "none" if clean>
```

## Step 4 — Stop condition + final sweep table

Re-`list_tickets` until **only `on_hold` (and `done`) remain**. Then stop the loop and emit:

```
📊 Board Sweep Summary
┌──────────┬──────────────────┬───────────────┬─────────────────────┐
│ Ticket   │ Final State      │ Time logged   │ MR / merge SHA      │
├──────────┼──────────────────┼───────────────┼─────────────────────┤
│ <id-1>   │ ✅ done          │ 40 min        │ !212  @ a1b2c3d      │
│ <id-2>   │ ✅ done          │ 180 min       │ !213  @ e4f5g6h      │
│ <id-4>   │ ⛔ blocked (DoR) │ 0 min         │ —                   │
│ <id-7>   │ ⏸ on_hold       │ —             │ — (parked)          │
└──────────┴──────────────────┴───────────────┴─────────────────────┘

✅ Done: 2   ⛔ Blocked: 1   ⏸ On-hold: 1
Total time logged: 220 min   MRs merged: 2 (→ <integration-branch>)
```

## Notifications & failure modes

Send a Claude app notification on: (1) each ticket (or its parent) reaching `done` (one line: what shipped + MR + tests green); (2) any blocker needing input; (3) the loop stopping because only `on_hold` remains. If a status won't move, a change breaks tests, or a PoD upload returns 400/401/403/409 → stop on that ticket, report the backend error verbatim, continue with the next; never bypass a gate. A stop/pause mid-ticket finishes THAT ticket to `done` first, then pauses at the next pickup.

## Start now

`list_statuses` + `list_sprints` + `list_tickets` → filter `status NOT IN (done, on_hold)` → skip epics/parents-with-open-children → sequence oldest-child-first → walk each to `done` autonomously → stop when only `on_hold` remains → print the sweep table.
