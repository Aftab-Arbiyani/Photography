---
description: Invoke Security Auditor for auth, RBAC, privacy, upload, and abuse-risk review of the current project.
argument-hint: <scope>
---

Use `.claude/agents/security-auditor.md` as the authoritative role definition.

Scope:
$ARGUMENTS

Return security findings ordered by severity. Cover authn/authz, RBAC, data access scope, sensitive fields, file uploads, secrets, audit trails, rate limiting, injection risk, CSRF/CORS, and privacy impact. Check the project-specific auth model, scoping key, and invariants in project-context §6.
