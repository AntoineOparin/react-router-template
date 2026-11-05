# AGENTS.md

Instructions for AI coding agents (and humans) working in this repo. Follow these conventions
exactly; when the codebase and this file disagree, ask before "fixing" either.

## Stack

- **React Router v8, Framework Mode** (SSR on, see `react-router.config.ts`) on Vite
- React 19, TypeScript (strict), Tailwind CSS v4
- ESLint (flat config, `eslint.config.js`) + Prettier (`.prettierrc.json`, sorts Tailwind classes)

For React Router APIs, use the `react-router` skill in `.agents/skills/react-router/SKILL.md` and
the docs shipped with the installed version in `node_modules/react-router/docs/`. Do not rely on
memory of older versions (v6/Remix) — check the installed docs.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173
npm run check        # typecheck + lint + format check — run before finishing any task
npm run format       # auto-format everything with Prettier
npm run lint:fix     # auto-fix lint issues
npm run typecheck    # regenerate route types + tsc
npm run build        # production build
```

**Definition of done:** run `npm run format`, then `npm run check`, and fix everything it reports.

## Folder structure

```
app/
  root.tsx                 # HTML shell, global <Layout>, root ErrorBoundary (framework file)
  routes.ts                # ALL routes are registered here (framework file)
  app.css                  # Tailwind entry + theme tokens
  routes/                  # Route modules ONLY — thin glue between URL and features
    layout.tsx             # App shell (header + <Outlet />) wrapping most pages
    home.tsx               # /
    not-found.tsx          # catch-all 404
  features/                # Business logic grouped by domain (one folder per feature)
    <feature>/
      components/          # UI specific to this feature
      <feature>.server.ts  # Server-only: DB queries, secrets, external APIs
      schema.ts            # Validation + shared types (safe on client and server)
      utils.ts             # Pure helpers for this feature
  components/
    ui/                    # Generic, reusable primitives (button, input, dialog…) — no business logic
    layout/                # App-shell pieces (site header, footer, nav)
  lib/                     # Cross-cutting helpers used by many features (e.g. db.server.ts, env.server.ts)
public/                    # Static files served as-is
.react-router/             # GENERATED route types — never edit, gitignored
```

Empty folders contain a `.gitkeep`; delete it once the folder has real files.

## Routing

- Register every route in `app/routes.ts` using `index`, `route`, `layout`, `prefix` from
  `@react-router/dev/routes`. **Do not** use file-system routing (`@react-router/fs-routes`).
- Route module files live in `app/routes/`, with folders mirroring the URL:
  `/projects` → `routes/projects/index.tsx`, `/projects/:id` → `routes/projects/detail.tsx`,
  a section layout → `routes/projects/layout.tsx`.
- Pages that use the app shell go **inside** the `layout("routes/layout.tsx", [...])` block.
- The `route("*", ...)` catch-all must stay last.
- Import route types from the generated file next to the module:
  `import type { Route } from "./+types/<file-name>";` (run `npm run typecheck` if missing).

## Route modules stay thin

A route module may export `loader`, `action`, `meta`, `links`, `headers`, `ErrorBoundary`,
`handle`, and a default component. It should only:

1. read params/request/form data,
2. call functions from `~/features/*` (or `~/lib/*`),
3. return data / render feature components.

No database queries, large JSX trees, or business logic directly in route files.

```tsx
// app/routes/projects/detail.tsx
import type { Route } from "./+types/detail";
import { getProject } from "~/features/projects/projects.server";
import { ProjectView } from "~/features/projects/components/project-view";

export async function loader({ params }: Route.LoaderArgs) {
  return { project: await getProject(params.id) };
}

export default function ProjectDetail({ loaderData }: Route.ComponentProps) {
  return <ProjectView project={loaderData.project} />;
}
```

## Server / client boundary

- Anything touching databases, secrets, `process.env`, or the filesystem goes in a file ending in
  **`.server.ts`**. The build excludes these from the browser bundle and fails if client code
  imports them.
- Only import `*.server.ts` from route `loader`/`action` functions or other `*.server.ts` files.
- Browser-only code (uses `window`, `localStorage`, etc.) goes in `*.client.ts` or runs inside
  `useEffect`/event handlers.
- Never expose secrets through loader return values — everything a loader returns is sent to the
  browser.

## Code conventions

- **Imports:** use the `~/` alias for anything outside the current folder (`~/features/...`,
  `~/components/ui/...`). Relative imports only within the same folder/feature.
- **Feature boundaries:** don't reach into another feature's internals. If two features need the
  same thing, move it to `~/lib` or `~/components/ui`.
- **File names:** kebab-case (`project-card.tsx`, `projects.server.ts`).
- **Components:** PascalCase, **named exports**, one component per file. Only route modules use
  `export default`.
- **Types:** `import type` for type-only imports (required by `verbatimModuleSyntax`). Avoid `any`.
- **Styling:** Tailwind utility classes in `className`. Global styles/theme tokens only in
  `app/app.css`. Don't hand-sort classes — Prettier does it.
- **Data:** prefer `loader`/`action` + `<Form>`/`useFetcher` over `useEffect` + `fetch`.
- **Errors:** throw `data(..., { status })` from loaders for expected errors (404, 403); the
  nearest `ErrorBoundary` renders them.
- **Tests:** no test runner is configured yet. When one is added, colocate tests as
  `<name>.test.ts(x)` next to the code.
- Unused variables/args are lint warnings; prefix intentionally unused ones with `_`.

## Recipes

**Add a page**

1. Create `app/routes/<path>.tsx` with `meta` + default component.
2. Register it in `app/routes.ts` (inside the app-shell `layout` unless it needs its own shell).
3. Run `npm run typecheck` to generate `./+types/<file>`.

**Add a feature**

1. Create `app/features/<feature>/` with only the files you need (`components/`,
   `<feature>.server.ts`, `schema.ts`, `utils.ts`).
2. Expose data access from `<feature>.server.ts`; call it from route loaders/actions.
3. Put UI in `features/<feature>/components/`; promote it to `components/ui/` only once it's
   generic and reused by another feature.

## Don'ts

- Don't edit `.react-router/`, `build/`, or `package-lock.json` by hand.
- Don't add dependencies without a clear need; mention any you add in your summary.
- Don't change ESLint/Prettier/TS config to silence an error — fix the code.
- Don't modify `.agents/skills/` — it's vendored reference material.
