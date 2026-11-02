---
description: One bounded continuous-improvement cycle — scout the repo for the highest-value improvements, file them as tickets on the tracker board, execute through the standard sprint flow, verify with gates. Max 3 improvements per cycle; judgment calls go on_hold for the human.
argument-hint: [optional focus: perf / security / debt / dx / docs / a11y]
allowed-tools: Read, Grep, Glob, Bash, Task, Skill, mcp__project-manager__list_tickets, mcp__project-manager__get_ticket, mcp__project-manager__list_sprints, mcp__project-manager__list_statuses, mcp__project-manager__create_ticket, mcp__project-manager__update_ticket, mcp__project-manager__update_ticket_status, mcp__project-manager__add_ticket_comment, mcp__project-manager__claim_ticket, mcp__project-manager__log_ticket_time, mcp__project-manager__set_test_report, mcp__project-manager__append_merge_info, mcp__project-manager__upload_proof_of_done
---

# Improve: $ARGUMENTS

Requires the tracker MCP named in project-context §7.

One bounded improvement cycle. Never pick destructive, prod-affecting, or judgment-heavy work — file those as `on_hold` tickets with a note for the human instead. All repo hard rules apply unchanged: every change ships via ticket + full sprint flow, branch naming from project-context §8, proof-of-done (project-context §7) before `done`.

1. **Board first.** List tickets in the project selected per project-context §7. If actionable tickets (planned / in_progress) exist, do NOT scout — report "backlog not empty" and stop; the driver runs `/sprint-all` next. One backlog, no duplicate work. (Skip `on_hold` and epics as usual.)
2. **Scout (read-only).** Use the orchestrator subagent to run a focused improvement scan (focus: $ARGUMENTS if given, else broad): Explore (dead code, TODOs, doc/code drift), performance-optimizer (hot paths, bundle size), security-reviewer (quick sweep of changed surfaces), qa-lead (coverage gaps), documentation-writer (docs vs behaviour). Each returns top findings with file:line evidence — no fixes yet.
3. **Prioritize.** Rank by impact/effort. Take the top <=3 that are unambiguous and within a single sprint-size (S/M). Everything else: create as `on_hold` with the evidence attached.
4. **File tickets.** `create_ticket` in the selected project with proper DoR: goal, acceptance criteria, size (S/M), owner agent, evidence from the scout. Set assignee/reporter to the agent identity from project-context §7 and a `time_estimate_minutes` via `update_ticket`. The board is the single source of truth.
5. **Execute.** Run the filed tickets through the standard sprint flow (the workflow rulebook from project-context §7, if present): one state at a time, contract-first if cross-layer, never two agents on one file.
6. **Gate.** The gate set from project-context §4 (as relevant to the change) -> qa-backend/qa-frontend -> security-reviewer on sensitive surfaces -> code-reviewer. Real evidence only; a failed gate twice = stop that ticket, mark blocked, continue.
7. **Report.** One line per improvement (what changed + proof), the on_hold list awaiting the human, and a stop signal if the repo scan found nothing above the noise floor ("no improvements above threshold — loop can stop").
