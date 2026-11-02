---
name: code-review
description: Review code changes for correctness, security, maintainability, tests, and consistency, with prioritized, actionable feedback. Use whenever reviewing a diff, a PR, or recent changes. Read-only — report issues, do not edit.
---

# Code review

_Triage like time is scarce: an unauthorized mutation or an unparameterized query outranks every style nit. If you read only two things, read the auth path and the data access._

## Procedure

1. Read project-context (§6 architecture rules, §7 ID rules) so you review against the project's real invariants; if missing, infer from CLAUDE.md / README and say so.
2. Diff the change (`git diff <integration-branch>...HEAD`) and focus on it plus directly affected code.
3. Review against the checklist.
4. Report by priority with specific file:line and a concrete fix.

Read-only: report findings; do not edit files — hand fixes to the author or the relevant specialist.

## Checklist

- Correctness: logic, edge cases, race conditions.
- Security: input validated per the project's validation pattern; the actor's role/ownership/tenant checked on every mutating path (authentication does not imply authorization); public routes added only deliberately; no committed secrets; parameterized queries only; no injection/XSS.
- Persistence: lockstep rules from project-context §6 honored (every place they name is updated — a missed one can silently drop writes); schema changes go through the project's mechanism (migration or schema file) with a rollback.
- Errors: correct exception and status; nothing leaks internals past the project's error filter/shape; nothing swallowed.
- Contracts: the backend owns the API shape; confirm frontend callers of the API wrapper match what the controller/service now returns (check by hand when no generated types guard it).
- Invariants: ID formats (project-context §7) and UI invariants (project-context §6) preserved.
- Maintainability: naming, duplication, size, follows the thin-controller / service-logic pattern and the repo's existing conventions.
- Tests: meaningful coverage incl. error/edge/auth-rejection cases, in the project's runners (project-context §2).
- Next.js (if used): `"use client"` at the smallest leaf; no server-only code/secrets crossing into client components or `NEXT_PUBLIC_*`; route handlers and server actions authenticate + authorize + validate; caching/revalidation explicit and mutations revalidate; no hydration mismatches.
- Performance: N+1, unbounded loads, React re-renders, bundle / RSC payload size.

## Output format

- Critical (block merge): <file:line> — <issue> — <fix>
- Warning (should fix): ...
- Suggestion (consider): ...
  Note what is solid; approve clearly if it is good.
