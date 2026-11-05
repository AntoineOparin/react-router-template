# AGENTS.md

Instructions for AI coding agents (and humans) working in this repo. Follow these conventions
exactly; when the codebase and this file disagree, ask before "fixing" either.

## Stack

- **React Router v8, Framework Mode** (SSR on, see `react-router.config.ts`) on Vite
- **Runs on Cloudflare Workers** (`wrangler.jsonc`, entry `workers/app.ts`). `npm run dev` runs
  the server code in `workerd`, the real Workers runtime — not Node.
- React 19, TypeScript (strict), Tailwind CSS v4, **shadcn/ui** (Radix-based) components
- **Supabase** for auth (`@supabase/ssr`, cookie sessions) and Postgres hosting
- **Drizzle ORM** (`postgres` driver) for all database access, through **Cloudflare Hyperdrive**
- **Zod** for validating anything untrusted (form data, env vars, search params, API payloads)
- **Vitest** + React Testing Library for tests
- ESLint + Prettier (sorts Tailwind classes); husky + lint-staged format/lint staged files on commit

For React Router APIs, use the `react-router` skill in `.agents/skills/react-router/SKILL.md` and
the docs shipped with the installed version in `node_modules/react-router/docs/`. Do not rely on
memory of older versions (v6/Remix) — check the installed docs.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173 (needs .env — see .env.example)
npm run check        # typecheck + lint + format check
npm test             # run tests once (npm run test:watch while developing)
npm run format       # auto-format everything with Prettier
npm run lint:fix     # auto-fix lint issues
npm run build        # production build
npm run preview      # build + run the production build locally in workerd
npm run deploy       # build + deploy to Cloudflare (wrangler deploy)
npm run cf-typegen   # regenerate Env types after editing wrangler.jsonc

npm run db:generate  # create a SQL migration from app/db/schema.ts changes
npm run db:migrate   # apply pending migrations to DATABASE_URL
npm run db:studio    # browse the database

npx shadcn@latest add <component>   # add a shadcn/ui component into app/components/ui/
```

**Definition of done:** run `npm run format`, then `npm run check` and `npm test`, and fix
everything they report. CI runs the same checks plus `npm run build` on every PR.

## Folder structure

```
workers/app.ts             # Cloudflare Worker entry — hands requests to React Router
wrangler.jsonc             # Worker config: bindings (HYPERDRIVE), compatibility flags
app/
  root.tsx                 # HTML shell, root ErrorBoundary, root middleware (db + auth)
  routes.ts                # ALL routes are registered here
  app.css                  # Tailwind + shadcn theme tokens (light + .dark)
  routes/                  # Route modules ONLY — thin glue between URL and features
    layout.tsx             # App shell (header + <Outlet />); loads the current user
    protected-layout.tsx   # Wraps signed-in-only routes (requireUserMiddleware)
    home.tsx               # /
    auth/                  # /auth/login, /auth/signup, /auth/confirm, /auth/logout
    dashboard/index.tsx    # /dashboard (example protected page)
    not-found.tsx          # catch-all 404
  features/                # Business logic grouped by domain (one folder per feature)
    auth/
      auth.server.ts       # auth middleware + getUser/requireUser/getSupabase helpers
      schema.ts            # Zod schemas for auth forms
      components/          # auth UI (AuthForm)
    <feature>/
      components/          # UI specific to this feature
      <feature>.server.ts  # Server-only: Drizzle queries, external APIs
      schema.ts            # Zod schemas + inferred types (safe on client and server)
      utils.ts             # Pure helpers for this feature
  components/
    ui/                    # shadcn/ui primitives (button, input, card…) — generated, may be edited
    layout/                # App-shell pieces (site header, footer, nav)
  db/
    schema.ts              # Drizzle table definitions (ALL tables)
    client.server.ts       # per-request Drizzle client: dbMiddleware + getDb(context)
  lib/
    env.server.ts          # Zod-validated secrets — import `env` from here
    supabase.server.ts     # per-request Supabase server client
    utils.ts               # `cn()` class-name helper (shadcn)
drizzle/                   # Generated SQL migrations — commit them, never edit by hand
public/                    # Static files served as-is
.react-router/, worker-configuration.d.ts   # GENERATED types — never edit, gitignored
```

## Runtime: Cloudflare Workers (read before writing server code)

- **No state between requests.** Never keep DB clients, Supabase clients, caches, or per-user
  data in module-level variables. Create per-request things in middleware and pass them via
  `context` (see `dbMiddleware`, `authMiddleware`).
- **Not Node.** `nodejs_compat` covers common modules (`Buffer`, `crypto`, `node:*` basics), but
  there is no filesystem, no `process.loadEnvFile`, no long-running timers, no native addons.
  Before adding a dependency, check it supports Cloudflare Workers.
- **Bindings and secrets** come from `import { env } from "cloudflare:workers"`. Only import
  `cloudflare:workers` in `*.server.ts` files (never in components or tests).
- **Background work after the response:** `import { waitUntil } from "cloudflare:workers"`.
- **CPU budget:** the free plan allows ~10 ms of CPU per request (waiting on network/DB doesn't
  count). Keep heavy computation out of request handling.
- After editing `wrangler.jsonc`, run `npm run cf-typegen` so the `Env` types stay accurate.

## Routing

- Register every route in `app/routes.ts` using `index`, `route`, `layout`, `prefix` from
  `@react-router/dev/routes`. **Do not** use file-system routing (`@react-router/fs-routes`).
- Route module files mirror the URL: `/projects` → `routes/projects/index.tsx`,
  `/projects/:id` → `routes/projects/detail.tsx`, a section layout → `routes/projects/layout.tsx`.
- Public pages go inside `layout("routes/layout.tsx", [...])`. **Signed-in-only pages go inside
  the nested `layout("routes/protected-layout.tsx", [...])` block.**
- The `route("*", ...)` catch-all must stay last.
- Import route types from the generated file next to the module:
  `import type { Route } from "./+types/<file-name>";` (run `npm run typecheck` if missing).

## Route modules stay thin

A route module may export `middleware`, `loader`, `action`, `meta`, `links`, `headers`,
`ErrorBoundary`, `handle`, and a default component. It should only:

1. read params/request/form data (validate with Zod),
2. call functions from `~/features/*` (or `~/lib/*`),
3. return data / redirect / render feature components.

No Drizzle queries, large JSX trees, or business logic directly in route files.

```tsx
// app/routes/projects/detail.tsx
import { data } from "react-router";
import type { Route } from "./+types/detail";
import { getDb } from "~/db/client.server";
import { requireUser } from "~/features/auth/auth.server";
import { getProject } from "~/features/projects/projects.server";
import { ProjectView } from "~/features/projects/components/project-view";

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = requireUser(context);
  const project = await getProject(getDb(context), { id: params.id, ownerId: user.id });
  if (!project) throw data(null, { status: 404 });
  return { project };
}

export default function ProjectDetail({ loaderData }: Route.ComponentProps) {
  return <ProjectView project={loaderData.project} />;
}
```

## Auth (Supabase)

- `authMiddleware` (in `app/root.tsx`) runs on every server request: it creates a per-request
  Supabase client, verifies the user with `getClaims()`, and writes refreshed auth cookies onto
  the response. Don't create Supabase clients anywhere else on the server.
- In loaders/actions use the helpers from `~/features/auth/auth.server`:
  - `getUser(context)` → user or `null`
  - `requireUser(context)` → user (redirects guests); use in protected routes
  - `getSupabase(context)` → Supabase client for auth/storage calls
- Protect pages by nesting them under `protected-layout.tsx` in `routes.ts` — not by checking in
  components. Also call `requireUser` in any action that mutates user data.
- **Always scope data to the user on the server** (e.g. `where owner_id = user.id`). Drizzle
  bypasses Row Level Security, so authorization is our code's job.
- Only redirect to user-supplied paths through `safeRedirectPath()`.
- Never use `supabase.auth.getSession()` on the server to identify the user.
- Email links land on `/auth/confirm`. Supabase must allow `<site-url>/auth/confirm` under
  Authentication → URL Configuration → Redirect URLs.

## Database (Drizzle + Supabase Postgres via Hyperdrive)

- All tables live in `app/db/schema.ts`. Every table **must** call `.enableRLS()` (blocks
  Supabase's public Data API; Drizzle still has full access). snake_case column names,
  camelCase TS properties. Export `$inferSelect`/`$inferInsert` types.
- Reference users by `uuid` holding the Supabase auth user id (`user.id`).
- **Getting the client:** `dbMiddleware` creates one Drizzle client per request. Routes call
  `getDb(context)` and pass it to feature functions, which take it as their first argument:
  ```ts
  // features/projects/projects.server.ts
  import type { Db } from "~/db/client.server";
  export async function getProject(db: Db, { id, ownerId }: { id: string; ownerId: string }) { … }
  ```
  Never create a `postgres()`/`drizzle()` client yourself or store one in a module variable.
- Change schema → `npm run db:generate` → review the SQL in `drizzle/` → `npm run db:migrate`.
  Commit migrations. Never edit an applied migration; never use `drizzle-kit push` on shared DBs.

## Validation (Zod)

- Validate all untrusted input with Zod before using it: form data in actions, search params,
  JSON bodies, third-party API responses.
- Define schemas in `features/<feature>/schema.ts`; derive types with `z.infer` rather than
  writing them twice. Return field errors from actions with `data({ errors }, { status: 400 })`
  (see `features/auth/schema.ts` + `routes/auth/login.tsx`).

## Environment variables & secrets

- Declare every secret/var in the Zod schema in `app/lib/env.server.ts` **and** in
  `.env.example`, then import `env` from `~/lib/env.server`. Don't use `process.env` in app code.
- Local values live in `.env` (loaded into the local Worker by the Cloudflare Vite plugin).
  Production values: `npx wrangler secret put <NAME>` (or the Cloudflare dashboard).
- Bindings (e.g. `HYPERDRIVE`) are configured in `wrangler.jsonc`, not as secrets.
- Never expose secrets to the browser: no secrets in loader return values or `VITE_*` vars.

## Server / client boundary

- Anything touching the database, secrets, `cloudflare:workers`, or external APIs with keys goes
  in a file ending in **`.server.ts`**. The build excludes these from the browser bundle and
  fails if client code imports them. Only import them from `loader`/`action`/`middleware` or
  other `.server.ts` files.
- Browser-only code (uses `window`, `localStorage`, etc.) goes in `*.client.ts` or runs inside
  `useEffect`/event handlers.
- Everything a loader returns is sent to the browser — return only what the UI needs.

## UI (shadcn/ui + Tailwind)

- Build UI from `~/components/ui/*` first. Need a new primitive? `npx shadcn@latest add <name>`
  rather than writing one by hand. Generated files may be edited to fit the design.
- Use theme tokens (`bg-background`, `text-muted-foreground`, `border`, `text-destructive`…)
  instead of raw colors, so light/dark themes stay consistent. Theme lives in `app/app.css`.
- Dark mode is class-based (`.dark` on `<html>`); no toggle is wired up yet.
- Merge conditional classes with `cn()` from `~/lib/utils`.

## Code conventions

- **Imports:** use the `~/` alias for anything outside the current folder. Relative imports only
  within the same folder/feature.
- **Feature boundaries:** don't reach into another feature's internals. If two features need the
  same thing, move it to `~/lib` or `~/components/ui`.
- **File names:** kebab-case (`project-card.tsx`, `projects.server.ts`).
- **Components:** PascalCase, **named exports**, one component per file. Only route modules use
  `export default`.
- **Types:** `import type` for type-only imports (required by `verbatimModuleSyntax`). Avoid `any`.
- **Data:** prefer `loader`/`action` + `<Form>`/`useFetcher` over `useEffect` + `fetch`.
- **Errors:** throw `data(null, { status })` from loaders for expected errors (404, 403); the
  nearest `ErrorBoundary` renders them.
- Unused variables/args are lint warnings; prefix intentionally unused ones with `_`.

## Testing

- Colocate tests as `<name>.test.ts(x)` next to the code (see `features/auth/schema.test.ts`).
- Unit-test schemas and pure logic; test components with React Testing Library. Wrap components
  that use `<Link>`/`<Form>` in `createRoutesStub` (see `components/layout/site-header.test.tsx`).
- Vitest runs in Node/jsdom, so tests can't import anything that imports `cloudflare:workers`
  (`env.server.ts`, `db/client.server.ts`, etc.). Keep logic you want to test in plain modules,
  and give `.server.ts` functions a `db` parameter so they can be tested with a fake.

## Recipes

**Add a page**

1. Create `app/routes/<path>.tsx` with `meta` + default component.
2. Register it in `app/routes.ts` — inside `protected-layout.tsx` if it requires sign-in.
3. Run `npm run typecheck` to generate `./+types/<file>`.

**Add a feature with data**

1. Add the table(s) to `app/db/schema.ts` (with `.enableRLS()`), then `npm run db:generate`.
2. Create `app/features/<feature>/` with `schema.ts` (Zod), `<feature>.server.ts` (Drizzle
   queries taking `db: Db`, always filtered by the user), and `components/`.
3. Add route(s) whose loaders/actions call those functions with `getDb(context)`.
4. Add tests for the schema and any non-trivial logic.

**Add a secret/env var:** add it to the Zod schema in `app/lib/env.server.ts`, to
`.env.example`, to your local `.env`, then `npx wrangler secret put <NAME>` for production.

**Add a Cloudflare binding (KV, R2, Queues…):** add it to `wrangler.jsonc`, run
`npm run cf-typegen`, and read it from `env` in a `.server.ts` file.

## Don'ts

- Don't edit `.react-router/`, `worker-configuration.d.ts`, `build/`, `drizzle/` migrations, or
  `package-lock.json` by hand.
- Don't add dependencies without checking they run on Cloudflare Workers; mention any you add.
- Don't change ESLint/Prettier/TS config to silence an error — fix the code.
- Don't bypass the pre-commit hook (`--no-verify`).
- Don't modify `.agents/skills/` — it's vendored reference material.
