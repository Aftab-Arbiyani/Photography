---
name: ux-spec
description: Produce a UX specification for a feature — user flow, information architecture, screen layout, interaction behavior, all UI states, microcopy, and accessibility notes. Use whenever designing how a feature should work before it is built, or specifying screens, flows, or states for engineers.
---

# UX specification

_Real products live in the empty, error, and permission-denied states; the happy path is the easy 20%. Specify every state and its microcopy — an unspecified state ships as whatever the engineer happened to guess._

## Workflow

1. Anchor on the user goal; reuse existing patterns and the project's design tokens / component utilities (project-context §3).
2. Map the flow (entry → steps → success), including branches.
3. Specify every state, not just the happy path.

## Repo conventions to honor

- Find the page/component that already owns this area (project-context §3) and design in terms of extending it, not a new shell.
- If the app has a dark theme, specify both themes.
- Preserve the UI invariants in project-context §6 (e.g. where IDs/badges render, which views expose which actions).

## States to cover

default · loading (the project's skeleton/spinner; in Next.js App Router, `loading.tsx` / Suspense boundaries) · empty · error (the project's error banner, showing the backend's error message) · success · permission-denied (wrong role / not owner) · edge (long content, slow network, conflict/locked resource → action blocked)

## Accessibility checklist

- Logical keyboard flow and visible focus order
- Labels for every control; meaningful alt text
- Color contrast ≥ WCAG AA in every theme
- ARIA only where native semantics fall short

## Spec template

Output: write to the project's docs location (project-context §3).

```md
# <Feature> — UX spec

## Goal & entry points

<user goal> | <where they enter from>

## User flow

1. <step> -> 2. <step> (branch: <condition> -> <path>)

## Screen: <name>

- Purpose: <one line>
- Layout & hierarchy: <regions, order, emphasis>
- Responsive / breakpoints: <mobile / tablet / desktop behavior>
- Route & metadata (Next.js / public pages): <URL, page title, SEO/OG needs>
- Components: <reuse existing / design-system; new Y and why>
- Interactions: <on action -> result>
- States: default / loading / empty / error / success / permission-denied
- Microcopy: title, button labels, validation/error text, empty-state copy
```
