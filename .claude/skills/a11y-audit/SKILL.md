---
name: a11y-audit
description: Audit a UI for accessibility against WCAG 2.2 AA — semantic HTML, ARIA, keyboard operability, focus management, color contrast, forms, motion, and screen-reader support. Use when building or reviewing React or Next.js pages/components or before shipping any user-facing feature. Read-only — reports findings by severity with WCAG references and concrete fixes; does not edit code.
---

# Accessibility audit (WCAG 2.2 AA)

_Keyboard-first, always: if a core flow can't be completed without a mouse, nothing else on the checklist matters yet. Verify every theme — contrast that passes in light routinely fails in dark._

## Procedure

1. Scope the screens, components, and flows under review (incl. all states: loading, empty, error, success, permission-denied). Locate them via project-context §3 (frontend routes/pages).
2. Evaluate against the checklist below; reason about keyboard-only and screen-reader operation. If the app has a dark theme, check **both light and dark**.
3. Report findings by severity with the component/`file:line`, the WCAG Success Criterion, the impact, and a concrete fix.

Read-only: report findings and hand fixes to `frontend-engineer` / `ux-designer`; do not edit files.

## Checklist

- **Structure**: one `<h1>`, logical heading order, landmark elements (`<main>/<nav>/<header>`), lists for list content. (1.3.1)
- **Images & icons**: meaningful `alt`; decorative images `alt=""`; icon-only buttons have an accessible name. (1.1.1)
- **Forms**: every control has a programmatic `<label>`; errors are announced and tied via `aria-describedby`; required state is conveyed non-visually. (1.3.1, 3.3.1, 3.3.2)
- **Keyboard**: every interactive element is reachable and operable by keyboard; no traps; logical tab order; drag-and-drop (boards, reordering) and modals/editors have keyboard equivalents. (2.1.1, 2.1.2)
- **Focus**: visible focus indicator (≥3:1); focus moves into and is restored after dialogs/menus; focus order matches visual order. (2.4.7, 2.4.3, 2.4.11)
- **Contrast**: text ≥4.5:1 (large ≥3:1); UI components & graphical objects ≥3:1 — verify in every theme; don't rely on color alone (status colors, badges). (1.4.3, 1.4.11, 1.4.1)
- **ARIA**: roles/states/properties correct and necessary; prefer native elements; dynamic updates (toasts, live status) use appropriate `aria-live`. (4.1.2, 4.1.3)
- **Reflow & zoom**: usable at 200% / 320px-wide without loss or horizontal scroll — check wide board/table views. (1.4.10, 1.4.4)
- **Motion & timing**: honor `prefers-reduced-motion` (skeletons, transitions); no auto-moving content without pause. (2.3.3, 2.2.2)
- **Targets & language**: target size ≥24px (2.5.8); page `lang` set (3.1.1 — in Next.js on `<html>` in the root layout / `_document`); link/button text descriptive out of context. (2.4.4)
- **SPA/Next.js navigation**: client-side route changes announce the new page (title updated per route — Next.js `metadata`; focus moved or route announcer) and don't strand focus. (2.4.2, 4.1.3)

## Output format

Group by severity, each with `component / file:line` — WCAG SC — issue — fix:

- **Blocker** (keyboard/SR cannot complete a task): ...
- **Serious** (major barrier): ...
- **Moderate** / **Minor**: ...
  Note what is already solid. If usable end-to-end by keyboard and screen reader for the core flows, say so clearly.
