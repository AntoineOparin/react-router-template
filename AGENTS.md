# AGENTS.md

Instructions for AI coding agents (and humans) working in this repo. Follow these conventions
exactly; when the codebase and this file disagree, ask before "fixing" either.

## Stack

- **React Router v8, Framework Mode** (SSR on, see `react-router.config.ts`) on Vite
- **Runs on Cloudflare Workers** (`wrangler.jsonc`, entry `workers/app.ts`). `npm run dev` runs
  the server code in `workerd`, the real Workers runtime — not Node.
- **Supabase** for auth (`@supabase/ssr`, cookie sessions) and Postgres hosting
- **Drizzle ORM** (`postgres` driver) for all database access, through **Cloudflare Hyperdrive**
- **Zod** for validating anything untrusted (form data, env vars, search params, API payloads)

For React Router APIs, use the `react-router` skill in `.agents/skills/react-router/SKILL.md` and
the docs shipped with the installed version in `node_modules/react-router/docs/`. Do not rely on
memory of older versions (v6/Remix) — check the installed docs.

## Commands

Scripts are in `package.json` (summarized in README.md).

**Definition of done:** run `npm run format`, then `npm run check` and `npm test`, and fix
everything they report. CI runs the same checks plus `npm run build` on every PR.

## Folder structure

Annotated map: [README.md](./README.md#folder-structure). Key rules: `app/routes/` holds route
modules only; business logic lives in `app/features/<feature>/` (copy the shape of
`features/notes/`, the reference feature). Branding (app name, description, `pageTitle()`) lives
only in `app/lib/site.ts`.

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
  writing them twice.
- In actions, validate with `parseForm` from `~/lib/forms` and return field errors with a 400:
  ```ts
  const { data: input, errors } = parseForm(noteSchema, await request.formData());
  if (!input) return data({ errors }, { status: 400 });
  ```
  Components show `errors.<field>[0]` under each input and `errors.form[0]` for general errors.
- Validate URL params before they reach the database (e.g. `noteIdSchema` → 404 on bad ids).
- One route, several buttons: give each `<button name="intent" value="…">` and `switch` on
  `formData.get("intent")` in the action (see `routes/notes/detail.tsx`).

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

1. Create `app/routes/<path>.tsx` with `meta` (title via `pageTitle()` from `~/lib/site`) +
   default component.
2. Register it in `app/routes.ts` — inside `protected-layout.tsx` if it requires sign-in.
3. Run `npm run typecheck` to generate `./+types/<file>`.

**Add a feature with data** — mirror the **notes** feature file-for-file:

| Notes file                            | What to copy                                          |
| ------------------------------------- | ----------------------------------------------------- |
| `app/db/schema.ts` → `notes` table    | table with `ownerId` → `authUsers.id`, `.enableRLS()` |
| `features/notes/schema.ts`            | Zod form schema, id schema, exported types            |
| `features/notes/notes.server.ts`      | queries taking `db: Db`, every one filtered by owner  |
| `features/notes/components/*`         | form (errors + pending state) and list (empty state)  |
| `routes/notes/{index,new,detail}.tsx` | list / create / view+update+delete via `intent`       |
| `features/notes/schema.test.ts`       | schema tests                                          |

1. Add the table to `app/db/schema.ts`, run `npm run db:generate`, review the SQL, `db:migrate`.
2. Create the feature folder and routes as above; register routes inside `protected-layout`.
3. Add tests, then run the definition-of-done checks.

**Remove the notes example** (when starting a real project): follow
`.claude/skills/remove-notes-example/SKILL.md`.

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
