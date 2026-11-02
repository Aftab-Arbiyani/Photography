---
name: test-strategy
description: Design and write tests across the stack — unit, integration, and component — using the test pyramid, with deterministic, behavior-focused coverage. Use whenever writing tests, deciding what to test at which level, covering a new feature, or improving coverage.
---

# Test strategy

_A test that can never fail teaches nothing. Spend coverage where regressions actually hide — state-transition rules, locking/conflict paths, and authorization — not on restating getters._

## Pyramid

Many fast unit tests; fewer integration tests; a focused set of end-to-end HTTP/UI checks for critical journeys. Don't push everything to the slow side.

## Runners

Use the project's runners and file conventions (project-context §2 for runners, §3 for test paths, §4 for commands). Common defaults for this stack:

- **Backend**: Jest (`@nestjs/testing` + Supertest for HTTP), or Node's built-in `node:test` / Vitest if that's what the repo uses. Integration runs may boot a real app against a throwaway DB/port — follow whatever harness exists.
- **Frontend**: Vitest (or Jest) + React Testing Library in jsdom, test files beside the code or under `__tests__/` as the repo does. Next.js: RTL for client components and pure logic; async server components, route handlers, and server actions via integration or e2e (Playwright).
  Match the existing assertion style and helpers; don't introduce a second runner.

## What to cover

Happy path + edge cases, error states, boundaries, **authorization** (a non-owner / wrong-role / other-tenant actor is rejected), domain state-transition rules and conflict/lock statuses, ID generation formats (project-context §7), the invariants in project-context §6, and a regression test for every fixed bug.

## Determinism rules

No real network/time/randomness leaking in. For the frontend, stub the network and use role/text queries, not brittle CSS selectors. For backend integration, let the harness manage its own server and DB; clean up rows a test creates. Proper setup/teardown; isolated state. Fix flakiness — do not retry around it.

## Levels

- **Unit**: pure service logic — ID generation, state transitions, scheduling/plan math, diffing — with dependencies mocked.
- **Integration**: boot the backend (or a testing module) and hit endpoints over HTTP; assert status codes, response shape, validation failures, and 401/403 behavior.
- **Component**: render a page/component with the network stubbed; assert user-visible behavior and that the right API-wrapper call was made.
- **E2E** (Playwright/Cypress, if present): critical journeys only; for Next.js also catches hydration errors and server/client boundary bugs.

## Example integration assertion

```ts
it('locked resource blocks a status transition', async () => {
  const res = await request(app.getHttpServer())
    .post(`/api/tasks/${id}/status`)
    .set(authHeaders)
    .send({ status: 'done' });
  expect(res.status).toBe(423);
  expect(res.body.error).toBe('LOCKED');
});
```

Adapt to the project's runner, routes, and error shape (project-context §6).

## Rule

Test behavior and contracts, not implementation details.
