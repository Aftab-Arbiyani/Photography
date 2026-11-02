---
name: reactjs-conventions
description: Build frontend features the way the current React or Next.js app already works — its router (React Router, or Next.js App/Pages Router), server vs client component boundaries, the single API wrapper or data layer, existing page/component structure, the project's design tokens, and its frontend test runner. Use whenever creating or modifying React/Next.js pages, layouts, components, route handlers, server actions, or frontend tests. project-context overrides these defaults.
---

# Frontend conventions (React SPA and Next.js)

_Large page components are common — extend their existing patterns rather than fighting them, and measure a re-render before you reach for `memo`. If responses flow through an untyped API layer, drift is silent: build to the shape the backend actually returns, not the one you assume._

## Check the repo first

Default stacks this kit targets: React + Vite + Tailwind + React Router (client-rendered SPA), and Next.js. Where the repo differs, the repo wins: match existing patterns, and treat project-context §6 as the project's real rules. Locate entry, routes, API client, and design tokens via project-context §3; if missing, discover from CLAUDE.md / README / `package.json` / `vite.config.*` / `next.config.*` and say what you assumed. Know: JS or TS; SPA or Next.js; which Next.js router.

## Shared React guidance

- **Where the work goes**: find the page/component that already owns the feature and extend it; extract a component when a file's growth makes the change hard to review, following the repo's folder conventions.
- **Data**: all backend calls go through the project's API wrapper / data layer (project-context §3) — no ad-hoc `fetch`/axios in components. Handle loading, error, AND empty states. Surface the backend's error field per the project's error shape (project-context §6).
- **Styling**: reuse the project's design tokens / component utilities; no parallel styling approach. If dark mode exists, style both themes. Preserve UI invariants in project-context §6.
- **Accessibility**: semantic HTML, labelled inputs, keyboard nav, visible focus, AA contrast, `role="alert"` for errors. (See `a11y-audit`.)
- **Lean**: lazy-load heavy routes/widgets; never display or ship secrets.

## React SPA (Vite + React Router)

Entry → app shell (routing, layout) → `React.lazy` pages; contexts for auth/theme. No Server Components or route handlers. If the dev server proxies API paths, use relative URLs, never absolute backend URLs. Check `manualChunks` / PWA config before adding heavy deps. Only `VITE_`-prefixed env vars reach the client — never put secrets there.

## Next.js

- **Router**: detect App Router (`app/` with `layout`/`page`) vs Pages Router (`pages/` with `getServerSideProps`/`getStaticProps`). Don't mix patterns within a feature; follow the one the area uses.
- **Server vs client components** (App Router): components are server by default. Add `"use client"` only at the smallest interactive leaf (state, effects, event handlers, browser APIs); pass serializable props across the boundary. Keep server-only code (DB, secrets) out of client modules — use `import 'server-only'` where helpful.
- **Data fetching & caching**: fetch in server components or the router's data functions. Be explicit about caching (`cache`, `next: { revalidate }`, `dynamic`), and revalidate after mutations (`revalidatePath` / `revalidateTag`). Know the Next.js version — caching defaults changed across majors.
- **Route handlers / server actions**: they are public endpoints — authenticate and authorize inside every one, validate input, and return the project's error shape. Prefer the existing backend API if the project has one, rather than duplicating logic.
- **Middleware**: keep it light (auth redirects, headers, rewrites); it runs on every matched request — scope the `matcher`.
- **Assets**: `next/image` (sizes, `priority` for the LCP image) and `next/font`; no raw `<img>` for content images unless the repo does so.
- **Env vars**: only `NEXT_PUBLIC_*` reaches the browser and it's inlined at build time — never put secrets there.
- **Metadata/SEO**: `metadata` / `generateMetadata` (App) or `next/head` (Pages); set title, description, canonical, OG where the page is public.
- **Hydration**: no non-deterministic render output (dates, random, `window`) on the server path; fix hydration warnings, don't suppress them.

## Example: client fetch pattern

```jsx
function ProjectsPanel() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api
      .get('/api/projects')
      .then(setProjects)
      .catch((e) => setError(e.error || 'Failed to load'));
  }, []);
  if (error) return <ErrorBanner role="alert">{error}</ErrorBanner>;
  if (!projects) return <Skeleton />;
  if (projects.length === 0) return <EmptyState />;
  return <ProjectList projects={projects} />;
}
```

In App Router, prefer fetching in a server component and passing data down, with `loading.tsx` / `error.tsx` for the states. Use the project's own wrapper, components, and paths.

## Testing

Use the project's frontend runner (project-context §2 — typically Vitest or Jest + React Testing Library in jsdom; Playwright for e2e). Stub the network; assert behavior and the URL/method/body, not implementation. For Next.js, unit-test client components and pure server logic; cover async server components, route handlers, and server actions via integration/e2e. Run a single file while iterating; before finishing, run the gate set from project-context §4 (tests + build — `next build` also catches server/client boundary errors).
