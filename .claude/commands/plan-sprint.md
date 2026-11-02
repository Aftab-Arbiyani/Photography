---
description: Plan a time-boxed sprint from the backlog and team capacity via the sprint-planner
argument-hint: [sprint length + team/availability, e.g. "2 weeks, 3 devs, 1 on PTO Tue-Thu"]
allowed-tools: Read, Grep, Glob, Bash, Write
---

# Plan sprint: $ARGUMENTS

Use the sprint-planner subagent to turn the backlog into a realistic, time-boxed plan.

1. Establish sprint length, team availability (PTO, holidays, meeting load), and the candidate backlog (from the project-manager's tasks on the tracker board — the project selected per project-context §7).
2. Compute realistic capacity (not 100% utilization), converting task sizes S/M/L to ideal-days (S ≈ 0.5d, M ≈ 1–2d, L ≈ 3–5d).
3. Select tasks that fit and whose dependencies are in-sprint or already done.
4. Produce the plan: sprint goal, committed vs stretch (P0 vs nice-to-have), owners and estimates ordered by dependency, re-estimated carryover, and risks.

Output a sprint plan ready for the task-manager to track (`/track`). Do not write application code.
