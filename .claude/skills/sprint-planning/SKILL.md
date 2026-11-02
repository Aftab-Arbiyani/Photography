---
name: sprint-planning
description: Plan a time-boxed sprint — estimate realistic capacity (accounting for PTO and meetings), pick what fits, mark P0 vs stretch, sequence by dependency, and handle carryover. Use whenever planning a sprint, sizing a backlog against capacity, or deciding what to commit to.
---

# Sprint planning

_Velocity is measured, not wished. Plan to roughly 80% and treat the buffer as part of the plan, not slack — the sprint that commits every available hour is the sprint that slips._

## Capacity formula

Per person: (working days - PTO - holidays) x focus hours/day x (1 - meeting/overhead fraction). Reserve ~20% buffer for reviews, bugs, interruptions. Sum across the team. Do not plan to 100% utilization.

## Estimation unit (shared with project-scoping)

Tasks are sized S/M/L (see `project-scoping`). Convert to ideal-days when fitting to capacity: **S ≈ 0.5d, M ≈ 1–2d, L ≈ 3–5d** (split anything bigger than L). Use the same unit for the `est` field below so backlog and capacity are comparable. Refine the mapping with the team's actual velocity over time.

## Workflow

1. Establish sprint length, team availability, and the candidate backlog (from the tracker in project-context §7, on the project selected there).
2. Compute capacity.
3. Select tasks that fit and whose dependencies are in-sprint or already done — respect the blocking edges the tracker records.
4. Split committed vs stretch; re-estimate carryover.

## Plan template

Output: write to the project's docs dir (project-context §3; default `docs/`).

- Sprint goal: <1-2 outcomes>
- Capacity: <total after deductions>
- Committed: T1 (owner, est) ... ordered by dependency
- Stretch: T# (pulled only if room)
- Carryover (re-estimated): T#
- Risks: <dependencies, unknowns>

## Board note

Seeded sprints and tickets live on the tracker (e.g. `list_sprints`, `list_tickets`); burndown/CFD/velocity charts are computed from the status-transition history, so keep ticket status honest as the sprint runs or the charts lie.

## Anti-patterns

Overcommitting to full capacity; committing tasks with out-of-sprint prerequisites; an incoherent grab-bag goal.
