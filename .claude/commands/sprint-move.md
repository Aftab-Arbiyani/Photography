---
description: Perform one sprint-workflow transition for a ticket on the live board via the tracker MCP — with the right gate, additive time log, and side-effects
argument-hint: <ticket-id> <from-state>-><to-state>   e.g. <ticket-id> in_progress->ready_for_qa
allowed-tools: Read, Bash, Grep, Task, Skill, mcp__project-manager__get_ticket, mcp__project-manager__update_ticket, mcp__project-manager__update_ticket_status, mcp__project-manager__add_ticket_comment, mcp__project-manager__claim_ticket, mcp__project-manager__log_ticket_time, mcp__project-manager__set_test_report, mcp__project-manager__append_merge_info, mcp__project-manager__upload_proof_of_done
---

You are performing **one** sprint-workflow transition for a ticket on the **live board** via the tracker MCP. Requires the tracker MCP named in project-context §7. The full rulebook is the workflow rulebook from project-context §7 (if present) — this command applies a single edge of it.

User input: $ARGUMENTS
(Expected format: `<ticket-id> <from-state>-><to-state>`, e.g. `<ticket-id> in_progress->ready_for_qa`. Ticket ID format and type prefixes (story / bug / task / epic) per project-context §7.)

## Project facts

Load `project-context` first. This command needs:

- **§4** — the gate set that must be green before `ready_for_qa`.
- **§7** — tracker MCP + project selection, ticket ID format and types, agent identity, PoD rules, workflow rulebook.
- **§8** — git host CLI (`glab` for GitLab, `gh` for GitHub), integration branch, branch naming per ticket type, merge policy.

Use the project selected per project-context §7 — do not switch projects. If a slot is missing or a placeholder, discover it from the repo and state the assumption. One transition per `update_ticket_status` call. **Never skip a state.**

## State machine

```
planned → in_progress → ready_for_qa → qa_progress → ready_for_publish → done
                           │
                      qa_failed → in_progress   (retry; needs Fix Comment)
```

Tickets enter the board as `planned` (the "To Do" column — there is no `todo` status key; where older docs say `todo`, it maps to `planned`, and the DoR gate applies to `planned → in_progress`). `on_hold` sits outside the flow — parked by the operator; take **no action** on it and say so. `qa_failed → in_progress` is the only loop-back; every other edge is forward-only.

## Time logging — use `log_ticket_time` (ADDITIVE minutes, at phase-END)

Always log with `log_ticket_time(ticket_id, minutes, note)` — it **adds** to the running total. Never write `update_ticket(time_logged_minutes=…)`, which overwrites and silently wipes prior logs. Log the minutes spent in the phase that **just ended**:

| Transition                        | Log this turn                        |
| --------------------------------- | ------------------------------------ |
| `planned → in_progress`           | nothing                              |
| `in_progress → ready_for_qa`      | implementation + rework + validation |
| `ready_for_qa → qa_progress`      | nothing                              |
| `qa_progress → ready_for_publish` | QA time                              |
| `qa_progress → qa_failed`         | QA + failure-investigation           |
| `qa_failed → in_progress`         | nothing                              |
| `ready_for_publish → done`        | bookkeeping (if any)                 |

## Your task

1. Parse `<ticket>`, `<from>`, `<to>` from `$ARGUMENTS`.
2. `get_ticket(ticket_id=<ticket>)` — verify the **actual current status equals `<from>`**; read prior history (any past `qa_failed`?), `parent_task_id`/children, acceptance criteria, story points, `dod_checklist`, `time_logged_minutes`.
3. If the edge is **not** legal (or the ticket is `on_hold`) → respond ❌ and list the allowed transitions from the real current state. Stop.
4. If legal, run the gate for this edge (below), make exactly **one** `update_ticket_status` call plus the required side-effects, then emit the §7 four-line ack.

## Per-edge gate + side-effects

### `planned → in_progress` — Definition of Ready

Block if missing **AC + story points + agreed tech approach** (plus any extra DoR items in project-context §7; 🚫 names what's gone). Else:

- `claim_ticket(ticket_id, assignee=<agent identity from project-context §7>)`.
- Cut the branch off the integration branch: `git checkout <integration-branch> && git pull && git checkout -b <prefix>/<ticket-id>-<slug>` — branch prefix per ticket type, per project-context §7/§8 (kit default: `feature/` for stories, `bugfix/` for bugs, `chore/` for tasks).
- `update_ticket_status(ticket_id, status="in_progress", reason="DoR passed: AC + SP + approach")`. Log nothing.

### `in_progress → ready_for_qa`

- If the ticket has a prior `qa_failed`, the **Fix Comment gate** applies: a `## 🔧 Fix Comment` citing the QA Failure Report timestamp in `**Refs:**` must already exist in comments — if absent, 🚫 block (run `/sprint-fix`).
- Project gates green: run the gate set from project-context §4.
- Tick **every `dod_checklist` item `done=true` EXCEPT the PoD item**, which stays false until publish: `update_ticket(ticket_id, dod_checklist=[{text, done:true}, …])`.
- Commit, push, open the MR/PR to the integration branch with the git host CLI from project-context §8 — `glab mr create --target-branch <integration-branch> --source-branch <branch> --title "<ticket-id>: <summary>" --description "…"` or `gh pr create --base <integration-branch> --head <branch> --title "<ticket-id>: <summary>" --body "…"` (title format per project-context §8 if it defines one).
- `log_ticket_time(ticket_id, minutes=<impl+rework+validation>, note="implementation")`.
- `update_ticket_status(ticket_id, status="ready_for_qa", reason="MR !N opened; gates green")`.

### `ready_for_qa → qa_progress`

- Log nothing. `update_ticket_status(ticket_id, status="qa_progress", reason="QA claimed")`.
- Dispatch a QA agent (`qa-backend` / `qa-frontend`) to author + run the test(s). Dev does not write the QA cases.

### `qa_progress → ready_for_publish` (QA passed)

- `set_test_report(ticket_id, suite, summary, status="passed", passed, failed, coverage?, cases=[{name, status:"passed"}], executed_by=<agent identity / runner label from project-context §7>, artifact?)`. (Enum is `passed`/`failed` — not "pass".)
- `log_ticket_time(ticket_id, minutes=<QA time>, note="QA")`.
- `update_ticket_status(ticket_id, status="ready_for_publish", reason="QA pass N/N; MR !M ready")`.

### `qa_progress → qa_failed` — QA Failure Report gate

- BLOCKED until a structured **QA Failure Report** is attached — an `add_ticket_comment` (`## ❌ QA Failure Report — <ts>`) AND/OR `set_test_report(status="failed")` with the failing case. Required fields: **Tested · Expected · Actual · Broken AC · Severity · Reproduction**.
- `log_ticket_time(ticket_id, minutes=<QA + investigation>, note="QA + failure investigation")`.
- `update_ticket_status(ticket_id, status="qa_failed", reason="QA fail — see Failure Report <ts>")`.
- Re-entry to `in_progress` later needs the developer's `## 🔧 Fix Comment` citing that timestamp (run `/sprint-fix`) + `claim_ticket(assignee=<agent identity from project-context §7>)`.

### `ready_for_publish → done` (publish)

Run the full flow in `/sprint-publish` (push → MR/PR to the integration branch → merge → poll the integration branch → append_merge_info → PoD → flip done). Merge only if project-context §8 says agent merges into the integration branch are pre-authorized; otherwise ask before merging. Promotion to the release branch and tags stay human-gated. PoD per project-context §7 is REQUIRED before `done` (kit default: dual-kind — `kind=fixed` QA card AND `kind=evidence` PM frame); if the tracker hard-gates `done` on a PoD kind, the flip is rejected without it.

> **Parent close:** a ticket with children may flip `ready_for_publish → done` only after every child is `done` (or `cancelled` with a comment). Otherwise 🚫 block.

## §7 acknowledgement (always end with this four-line shape)

```text
✅ <action taken, with the new status>
⏱ <minutes logged this turn> min (via log_ticket_time; cumulative now <total>)
🔲 <gates run — DoR / Fix-Comment / DoD ticked / test_report set / merge_info appended / PoD kind=fixed+evidence>
🚫 <blocks remaining with the gate name; "none" if clean>
```

Don't promote a status while 🚫 is non-empty. If a status won't move or a PoD upload returns 400/401/403/409, report the backend error verbatim and stop — never bypass a gate.
