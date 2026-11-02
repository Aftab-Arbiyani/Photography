---
description: Combined quality + security sweep (tests, security audit, code review) with one prioritized report
argument-hint: [scope, e.g. "auth module" or leave blank for recent changes]
allowed-tools: Read, Grep, Glob, Bash
---

# Audit: $ARGUMENTS

If no scope is given, default to the uncommitted/recent changes.

Recent changes for context:

- !`git diff --stat HEAD 2>/dev/null || echo '(no git repo / no commits — audit the named scope or current files)'`

Run these and consolidate into ONE prioritized report:

1. test-writer subagent: run the relevant suites from the gate set in project-context §4 (as the scope demands) and report failures.
2. security-reviewer subagent: audit the scope for auth/authz, secrets, dependency CVEs, injection/XSS/SSRF, and config issues; rank findings by severity.
3. code-reviewer subagent: review the scope for correctness, maintainability, types, and tests.

Output a single report grouped Critical / High / Medium / Low, each with file:line and a concrete fix, plus an overall go/no-go.
