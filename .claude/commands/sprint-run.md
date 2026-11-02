---
description: Walk one ticket from its current state to done on the live board via the tracker MCP — gates, QA dispatch, and the publish flow inline
argument-hint: <ticket-id>
allowed-tools: Read, Bash, Grep, Skill, Task, mcp__project-manager__get_ticket, mcp__project-manager__list_tickets, mcp__project-manager__update_ticket, mcp__project-manager__update_ticket_status, mcp__project-manager__add_ticket_comment, mcp__project-manager__claim_ticket, mcp__project-manager__log_ticket_time, mcp__project-manager__set_test_report, mcp__project-manager__append_merge_info, mcp__project-manager__upload_proof_of_done, mcp__project-manager__create_ticket
---

You are walking **one** ticket from its current state to `done` on the **live board** via the tracker MCP, with gates, QA dispatch, and the publish flow handled inline. Requires the tracker MCP named in project-context §7. Rulebook: the workflow rulebook from project-context §7 (if present).

Ticket: $ARGUMENTS (a single id in the ticket ID format from project-context §7)

## Project facts

Load `project-context` first. This command needs:

- **§4** — the gate set that must be green before `ready_for_qa`.
- **§5** — frontend/backend URLs and the test-account env vars (PoD capture).
- **§7** — tracker MCP + project selection, ticket ID format and types (incl. which type is an epic), agent identity, PoD rules (kinds, scripts, artifact dir), workflow rulebook.
- **§8** — git host CLI (`glab` for GitLab, `gh` for GitHub), integration branch, branch naming per ticket type, merge policy.

Use the project selected per project-context §7 — do not switch. One transition per `update_ticket_status`; never skip a state. The per-edge gate, additive time log, and side-effects for **each** transition live in `/sprint-move` — apply them exactly; this command chains them to `done`.

## State machine

```
planned → in_progress → ready_for_qa → qa_progress → ready_for_publish → done
                           │
                      qa_failed → in_progress   (retry; needs Fix Comment)
```

Tickets enter as `planned` (the "To Do" column; there is no `todo` status key). `on_hold` is parked — if the ticket is `on_hold`, take **no action** and say so. Epics are not walked here — walk their children.

## Time logging — `log_ticket_time` (ADDITIVE minutes, at phase-END)

Never `update_ticket(time_logged_minutes=…)`. Log the phase that just ended: implementation at `in_progress → ready_for_qa`; QA at `qa_progress → ready_for_publish`; QA + investigation at `qa_progress → qa_failed`; nothing on the no-log edges.

## How you run this

1. `get_ticket(ticket_id=<ticket-id>)` — read current status, AC, story points, `parent_task_id`/children, prior `qa_failed` history, `dod_checklist`, `time_logged_minutes`.
2. **If `on_hold`** → stop; report parked. **If it's an epic or has children** → it may only reach `done` after every child is `done`; drive the children first (`/sprint-batch <child-ids>`).
3. Announce the starting state and the remaining transitions.
4. **🧭 Route once, before any transition:** use the `orchestrator` subagent to classify the ticket (type + changed surfaces: backend / frontend / schema / infra / docs) and emit the smallest lane plan — owner specialist (`nestjs-backend-dev` / `frontend-engineer` / `database-architect` / `deployment-engineer`), supporting agents, applicable gates. All implementation is dispatched to that routed owner, with a `code-reviewer` (and `security-reviewer` on auth/webhook/upload/SQL/data-boundary surfaces) gut-check before the MR — never implement outside the routed lane.
5. Walk each transition forward one at a time: apply the matching `/sprint-move` gate + side-effects, make the single `update_ticket_status` call, `log_ticket_time` for the phase that ended, `claim_ticket(<agent identity from project-context §7>)` on dev stages, and emit the §7 four-line ack. Drive autonomously — no confirmation prompts (except a merge project-context §8 does not pre-authorize); only stop on a genuine block.
6. At `ready_for_qa → qa_progress` dispatch a QA agent (`qa-backend` / `qa-frontend`) to author + run the test(s) — Dev does not write the QA cases.
7. On `qa_progress → qa_failed`: attach the structured **QA Failure Report**, then loop back through `qa_failed → in_progress` (requires the developer's `## 🔧 Fix Comment` citing the failure-report timestamp — run `/sprint-fix`) and re-walk to QA.
8. At `ready_for_publish → done`: run the inline publish flow (the full `/sprint-publish` steps).
9. Print a final per-ticket time summary.

## Progress tracker (top of each response)

```
🎯 Ticket: <ticket-id>
📍 Now: in_progress → ready_for_qa
✅ Done: planned→in_progress
⏳ Remaining: ready_for_qa, qa_progress, ready_for_publish, done
```

## Gates (full text in `/sprint-move`)

- **DoR** (`planned → in_progress`): AC + story points + agreed tech approach (+ any §7 DoR items). `claim_ticket(<agent identity>)`; cut `<prefix>/<ticket-id>-<slug>` off the integration branch — branch prefix per ticket type, per project-context §7/§8 (kit default: `feature/` stories, `bugfix/` bugs, `chore/` tasks).
- **`in_progress → ready_for_qa`**: the gate set from project-context §4 green; tick every `dod_checklist` item true EXCEPT the PoD item; commit + push + open MR/PR to the integration branch.
- **Fix Comment gate** (re-entry after `qa_failed`): `## 🔧 Fix Comment` with `**Refs:**` to the failure-report timestamp must exist, else block.
- **DoD** (`ready_for_publish → done`): all AC verified by QA, no regressions, `test_report` set, PoD item flipped at capture, time logged, `merge_info` appended, children all `done`.

## Inline publish flow (`ready_for_publish → done`)

1. Merge the MR/PR into the integration branch with the git host CLI (`glab mr merge <N> --remove-source-branch` / `gh pr merge <N> --delete-branch`) — only if project-context §8 says agent merges are pre-authorized; otherwise ask.
2. `git fetch origin <integration-branch> && git log origin/<integration-branch> -1 --oneline` — confirm it advanced; capture the merge SHA.
3. **PoD per project-context §7** (REQUIRED; kit default dual-kind — if the tracker hard-gates `done` on the QA-kind `fixed` PoD, the flip is rejected without it; the `evidence` frame is a process requirement on top): real screenshot of the running app at the frontend URL from §5 (log in with the test-account env vars from §5) → `kind="evidence"` (framed with the §7 framing script, if any) AND `kind="fixed"` (QA card). Respect the §7 status/actor gates; upload before flipping to done. Artifacts under the §7 PoD artifact dir.
4. `append_merge_info(ticket_id, mr_url, merge_sha, mr_number, source_branch, target_branch="<integration-branch>", title)`.
5. `update_ticket(ticket_id, dod_checklist=[… PoD item done:true …])`; `log_ticket_time` bookkeeping if any.
6. `update_ticket_status(ticket_id, status="done", reason="MR !N merged @ <SHA>; PoD captured")`; `add_ticket_comment` closure summary.
7. If the ticket is a **parent**, re-verify every child is `done`/`cancelled` before this flip.

## §7 ack after every transition

```text
✅ <action taken, with the new status>
⏱ <minutes this turn> min (via log_ticket_time; cumulative now <total>)
🔲 <gates verified — DoR / Fix-Comment / DoD ticked / test_report / merge_info / PoD fixed+evidence>
🚫 <blocks remaining with gate name; "none" if clean>
```

## Notifications & failure modes

Send a Claude app notification when the ticket (or its parent) reaches `done` (one line: what shipped + MR + tests green), and on any blocker needing input. If a status won't move, a change breaks tests, or a PoD upload returns 400/401/403/409 → **stop and report the backend error verbatim**; never paper over a gate.

## Start now

`get_ticket`, identify the current status, and begin walking forward — autonomously to `done` unless a gate genuinely blocks.
