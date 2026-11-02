---
description: Produce a build-ready delivery plan (discovery -> scope -> design) without writing code
argument-hint: [feature description]
allowed-tools: Read, Grep, Glob, Bash, Write
---

# Plan feature: $ARGUMENTS

Produce a complete, build-ready plan. Do NOT implement anything.

1. If user-facing or fuzzy: use the business-analyst subagent for requirements and edge cases, then the ux-designer subagent for a UX spec.
2. Use the project-manager subagent for goals/non-goals and a task breakdown with acceptance criteria, owners, and dependencies.
3. Use the solution-architect subagent for the technical design, the api-designer subagent for the API contract, and the database-architect subagent for the data model/migrations (respect the schema source of truth and management mode in project-context §2 and §6).
4. Optional: if I provide team capacity, use the sprint-planner subagent to fit the tasks into a sprint.

Consolidate everything into one plan: requirements, UX spec (if any), task list with acceptance criteria, technical design + API contract, and data model. Flag risks and open questions. No code is written.
