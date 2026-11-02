---
name: performance-profiling
description: Profile and diagnose performance across the stack — frontend (bundle size, render/re-render, Core Web Vitals) and backend (DB N+1, hot-path latency, blocking I/O, payload size, caching). Use when investigating slowness, before shipping a perf-sensitive feature, or to set a performance budget. Read-only — reports findings ranked by impact with measurements and fixes; does not edit code.
---

# Performance profiling

_Never optimize on a hunch — measure first. The dominant cost is almost always one thing (a query inside a loop, a giant inline payload, an un-split chunk), not a scatter of micro-costs; find that one thing, fix it, and stop._

## Procedure

1. State the symptom and the metric that matters (e.g. p95 endpoint latency, LCP, bundle KB), and capture a **baseline measurement** — never optimize on a guess.
2. Profile the relevant layer; identify the **dominant cost** (the bottleneck), not micro-costs. Check project-context §6 for the persistence pattern and any known heavy paths.
3. Report findings ranked by impact, each with the measurement, the root cause, a concrete fix, and the expected gain. Propose a budget/threshold to prevent regression.

Read-only: report and hand fixes to `nestjs-backend-dev` / `frontend-engineer`; do not edit files.

## Checklist

**Backend (NestJS + TypeORM + Postgres by default)**

- **State/aggregate loading**: endpoints that load a whole aggregate or full app state when they need one entity; write paths that persist more than changed.
- **DB**: N+1 (queries inside loops), missing indexes for the real query shape, over-fetching, unbounded loads of long lists (history, comments), transactions held too long.
- **Hot path**: synchronous/blocking work in the request path, redundant recomputation of derived stats/reports, large JSON (de)serialization (e.g. binary content inlined as data URLs).
- **I/O**: object-store reads/writes without limits; scheduled jobs/crons competing with requests; opportunities to cache computed results.
- **Payload**: response size, pagination on long lists.

**Frontend (React SPA / Next.js)**

- **Bundle**: very large page components pulling heavy deps into the main chunk; confirm chunk splitting still works and pages stay lazy-loaded. Next.js: `"use client"` placed too high (shipping server-capable trees as client JS), RSC payload size, `next build` route-size output / bundle analyzer.
- **Render**: unnecessary re-renders in list/board views (unstable props/keys, missing memo), large un-virtualized lists, expensive work in render.
- **Network/data**: request waterfalls through the API wrapper, duplicate fetches for data already on hand. Next.js: sequential awaits in server components (parallelize, stream with Suspense), caching/revalidation disabled by accident (everything dynamic), middleware doing heavy work per request.
- **Assets**: unoptimized/eager images (Next.js: `next/image` with sizes, `priority` on the LCP image; `next/font`); main-thread blocking; hydration cost.
- **Core Web Vitals**: LCP, INP (key interactions), CLS.

## Output format

Ranked by impact, each: **area** — measurement (before) — root cause — fix — expected gain.

- Then a **recommended budget** (e.g. "endpoint p95 < 200ms", "route JS < 200KB gzip", "LCP < 2.5s") to guard against regression.
  State clearly if performance is already within a sensible budget for the use case.
