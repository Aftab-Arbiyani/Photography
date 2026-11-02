---
description: Ship a feature end to end with the full agent team (scope -> design -> build -> verify -> release prep)
argument-hint: [feature description]
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Ship feature: $ARGUMENTS

Orchestrate the team to deliver this feature. Delegate to specialists — do not do their work yourself. Run independent work in parallel and dependent work in sequence, and partition files so no two agents edit the same file at once. Hard rule: the work ships as a ticket walked through the full sprint flow (the workflow rulebook from project-context §7, if present) with proof-of-done per project-context §7 before `done`.

1. Scope. Use the project-manager subagent for goals/non-goals and a task breakdown with acceptance criteria. If the feature is user-facing or the requirements are unclear, first use the business-analyst subagent (requirements) and the ux-designer subagent (UX spec).
2. Design (contract-first). Use the solution-architect subagent for the technical design, the api-designer subagent for the API contract, and the database-architect subagent for any schema/migration. Write the contract to `.claude/design/contract.md`; lock it before parallel build.
3. Build in parallel. Use the nestjs-backend-dev subagent for the backend and the frontend-engineer subagent for the frontend, both building to the contract at `.claude/design/contract.md`. Use the deployment-engineer subagent for any infra/CI changes.
4. Integrate. Wire frontend and backend together and confirm they speak the same contract. On drift, route the fix to the owner — solution-architect re-issues the contract if it's wrong, otherwise the responsible builder re-aligns — then re-check. Do not patch source yourself.
5. Verify. Use the test-writer subagent to run/extend the suites (the gate set from project-context §4), the qa-backend + qa-frontend subagents to close test gaps, the security-reviewer subagent to sweep anything touching auth/uploads/data-access scoping, and the code-reviewer subagent to review before merge. Loop fixes back to the responsible builder until checks are green.
6. Release prep. Use the release-manager subagent to prepare the version bump, changelog, checklist, go/no-go, and rollback plan. This prepares only — do NOT deploy. Hand the runbook to the deployment-engineer; the final cut/deploy goes through the human-gated `/cut-release` and human approval.

Wait for each step's delegated work to finish before moving on. End with a status summary: what shipped, what's blocked, and the recommended next action.
