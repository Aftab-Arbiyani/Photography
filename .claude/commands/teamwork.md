---
description: Plan with the orchestrator, then drive the tracker-board sprint-task workflow — every ticket walked to done through the full sprint flow with contract-first design, partitioned ownership, and quality gates. Runs until the board is drained. The default way to run multi-agent work.
argument-hint: [<ticket-id>s / goal — omit to sweep the whole board]
allowed-tools: Read, Grep, Glob, Bash, Task
---

# Teamwork: $ARGUMENTS

Requires the tracker MCP named in project-context §7.

Plan → delegate → verify — but the **execution spine is the tracker-board sprint-task workflow**: every unit of work is a ticket in the project selected per project-context §7, walked one transition at a time through the sprint state machine to `done`. The orchestrator routes; team-lead executes; gates decide done.

**This command does not finish until every actionable ticket is `done`.** Keep sweeping the board until only `on_hold` (and `done`) remain. Do not stop after a single ticket or a single pass. Only stop early on a genuine block (record it, mark blocked, move to the next ticket), the same gate failing twice, an ownership collision, or a destructive operation.

Rulebooks: the workflow rulebook from project-context §7, if present (states, gates, time-logging, DoR/DoD, PoD), and `/sprint-all` (board discovery + per-edge side-effects). Each ticket is driven exactly as `/sprint-run`.

## 0. Build the queue

- **With `$ARGUMENTS`** (ticket ids or a goal): scope to those. For a goal, file the tickets first (DoR-complete, in the active sprint, assignee/reporter = the agent identity from project-context §7, a time estimate) so the work still flows through the board.
- **Without arguments**: sweep the whole board. `list_statuses` + `list_sprints` + `list_tickets` on the selected project → filter **status NOT IN (`done`, `on_hold`)** → skip epics (epic type/prefix per project-context §7) and parents with open children → order **oldest non-epic child first**, children before their parent. Announce the queue; no confirmation prompt — proceed.

## Per ticket, walk it to done

1. **Route.** The orchestrator subagent classifies the ticket (type + changed surfaces) and emits the smallest lane plan — owner specialist + supporting agents + applicable gates. Do not implement in the main thread.
2. **Confirm scope** — restate project/tickets/files and the plan, and **get the human's go-ahead before any large build (hard rule)**. On a routine sweep of already-scoped tickets, no per-ticket prompt; a genuinely large/risky build still checks in.
3. **Contract first.** Before any cross-layer or parallel build, the solution-architect subagent (+ api-designer for endpoint shapes, database-architect for schema) locks `.claude/design/contract.md`. Schema changes follow the project's schema-management and lockstep persistence rules (project-context §2, §6) — update every place they name together — and are human-gated per environment (project-context §9).
4. **Execute via team-lead**, walking the sprint state machine one edge at a time — the status flow from project-context §7 (this tracker's default: `planned → in_progress → ready_for_qa → qa_progress → ready_for_publish → done`, retry loop `qa_failed → in_progress` needs a Fix Comment). One transition per `update_ticket_status`; never skip a state. `claim_ticket(<agent identity from project-context §7>)` on dev stages; additive `log_ticket_time` for the phase that ended (never overwrite logged time via `update_ticket`). Ownership lanes (paths per project-context §3): backend nestjs-backend-dev · frontend frontend-engineer · schema/migrations database-architect · CI/deploy deployment-engineer · docs + `.claude/**` documentation-writer. Never two agents on one file; never two instances of the same specialist (agent memory is single-writer).
5. **Track.** The task-manager subagent mirrors progress on the tracker board and the session task list.
6. **Gate.** The gate set from project-context §4 green → qa-backend + qa-frontend author + run the tests (dev does not write QA cases) → security-reviewer on auth/webhook/upload/SQL/data-access-scoping surfaces → code-reviewer. Real evidence only — test output or live-app proof; structured PASS/FAIL verdicts. `set_test_report(status="passed", failed=0)` scoped to the ticket's own cases.
7. **Ship to done.** Merge the MR/PR into `<integration-branch>` (project-context §8; only if agent merges are pre-authorized there); proof-of-done per project-context §7 (e.g. QA result + real evidence capture of the running app); `append_merge_info`; tick the DoD; closure comment; `update_ticket_status … done`. Children batch with their parent (siblings → `ready_for_qa` together, → `done` together, then the parent). Release-branch merges, tags, and deploys stay human-approved. Notify per ticket reaching `done`.

## Loop until the board is drained

After a ticket reaches `done`, re-`list_tickets` and pick the next in order. **Repeat until only `on_hold` (and `done`) remain**, then stop and print the sweep summary (tickets, final state, time logged, MR/merge SHA). A pause/stop mid-ticket finishes THAT ticket to `done` first, then halts at the next pickup.

Stop and escalate on: contract drift the named owners can't resolve, an ownership collision, the same gate failing twice, a schema/deploy step that needs human approval, or any destructive operation.
