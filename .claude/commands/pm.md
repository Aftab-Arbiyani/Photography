---
description: Invoke the `project-manager` agent for roadmap, scope, priority, or product audit work.
argument-hint: <request>
---

Use the `project-manager` agent definition as the authoritative role definition. Load `project-context` first — needs §1 (product, domain terms), §3 (where PM artifacts / docs live) and §7 (tracker, Definition of Ready/Done, proof-of-done rules).

Request:
$ARGUMENTS

Stay in the `project-manager` lane:

- Define outcome, scope, priority, and release criteria.
- Produce or update PM artifacts in the docs location from project-context §3 only when the request calls for it.
- Do not write feature code.
- Route execution to the `team-lead` agent when implementation is required.
- **Always provide a Proof-of-Done with real evidence before any ticket closes.**
  Before `ready_for_publish → done`, upload the PoD the project requires
  (project-context §7; the kit default is dual-kind — QA `fixed` + PM
  `evidence`) with real proof (a screenshot of the running app for UI, or the
  live endpoint / test-run output for backend/docs), never synthetic. If the
  tracker hard-gates `done` on a PoD attachment, no ticket closes without one.
  See the `project-manager` agent → "Proof of Done — always required".
