---
name: security-audit
description: Audit code and dependencies for security issues — authn/authz, secrets, dependency CVEs, injection/XSS/SSRF/CSRF, config hardening — and report findings by severity. Use before releases and after auth/upload/data changes, or whenever a security review is needed. Read-only.
---

# Security audit (OWASP-minded)

_The finding that matters is the exploitable one. Authentication is usually centralized and authorization usually isn't — a missing ownership check will hurt you long before a transitive CVE does, so spend your hours there and prove exploitability before you raise the alarm._

## Scope & method

Read project-context §6 (auth model, scoping, uploads, invariants) first. Read auth, data-access, and user-input paths end to end. Run the dependency audit for each package (`npm audit` / `pnpm audit` in every workspace). Confirm exploitability before reporting; never invent findings. Read-only: report findings and remediations for the engineers to apply.

Shape the audit to how the project actually works:

- **Where authentication is enforced** — global guard, bootstrap middleware with a public allow-list, or per-route guards. Real risks: a route wrongly made public, and **missing authorization** — role/ownership/tenant checks that live in services or guards and are easy to forget (IDOR: does the actor own the resource they're mutating?).
- **Unauthenticated write endpoints** (webhooks, callbacks) — confirm signature/shared-secret verification, body-size limits, and rate limits are intact.
- **Raw SQL / query builders** — verify every query is parameterized, never string-built.
- **Frontend bundles ship to the browser** — no secret may live in client code or client-exposed env (`VITE_*`, `NEXT_PUBLIC_*`). In Next.js, check server-only modules aren't imported into `"use client"` files and server components don't pass secrets as props.
- **Next.js server surfaces** — route handlers and server actions are public endpoints: each must authenticate, authorize, and validate input itself; middleware-only auth is bypassable if the matcher misses a path.

## Checklist

- AuthN/AuthZ: session/token handling (rotation, expiry, cookie flags); **authorization on every mutating path** (ownership + role + tenant scope); public allow-list minimal and correct; IDOR on resource ids.
- Input: validation per the project's pattern; SQL/NoSQL injection; XSS in rendered user content; SSRF (webhooks, any outbound fetch); unsafe deserialization.
- CSRF: if state-changing requests use cookie sessions, confirm SameSite/CSRF protections hold; CORS is an allow-list, not wide-open.
- Secrets/config: no hardcoded secrets; nothing in logs or the client bundle; API-token handling; verbose prod errors (the error filter returns a generic message for unknown errors — confirm nothing bypasses it); security headers (helmet).
- Uploads: size caps enforced on every upload path; type checks; object-store keys not attacker-controllable; JSON body limits not raised carelessly.
- Dependencies: critical/high in direct deps are blocking; transitive-only medium/low are informational unless an exploit path is evident.
- Frontend: `dangerouslySetInnerHTML`; server secrets leaking to the client; open redirects (incl. Next.js `redirect()` / `callbackUrl` params); `next.config` `images.remotePatterns` not wide-open (SSRF via the image optimizer).

## Severity rubric

Critical (remote exploit / data breach) > High > Medium > Low. Rank by real impact x exploitability (see `finding-format` if present).

## Output format

- [SEVERITY] <title> — <file:line> — why exploitable — remediation
- Overall go/no-go for release when asked.
