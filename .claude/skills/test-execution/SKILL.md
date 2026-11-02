---
name: test-execution
description: Run the project test/check suite and report only failures with errors and likely causes, keeping verbose output out of context. Use whenever running tests or checks and reporting results. Runs and triages — does not write tests or fix code.
---

# Test execution & reporting

_A green suite that never booted is more dangerous than a red one. Confirm the runner actually started (test server up, DB reachable) before you trust the summary, and report the truth — skipped is not passed._

## Commands

Take them from project-context §4 (install, type-check, build, frontend tests, backend tests, e2e) and the gate set listed there. If missing, read `package.json` scripts / CI config and say what you assumed. Typical forms:

- One file / by name: `<runner> path/to/file.test.ts`, `<runner> -t "name"` (Jest/Vitest), passed through the npm script with `--`.
- Type check and build: the project's type-check and build commands.
- Health smoke (backend/API changes): `curl -s <backend-url>/<health-path>` using project-context §5. A 401 from a protected endpoint without credentials is expected, not a failure.

## Workflow

1. Pick the right command for the scope (full suite, one file, or a type/build check).
2. Run it, plus the type check / build where relevant.
3. Report tightly.

## Report format

- Summary line: "<N passed, M failed, K skipped>" plus the exact command run.
- For each failure: test name — assertion/error — file:line — likely cause (only if evident).
- Do not paste passing output.

## Triage rules

- Distinguish real failures from flaky ones (call them out).
- If the run can't start (deps/build error, test server didn't boot, DB not reachable, port in use), say so — do not report "all failed".
- Hand fixes to `nestjs-backend-dev` / `frontend-engineer`; hand coverage gaps to the QA agents.
