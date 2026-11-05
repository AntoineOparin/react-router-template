# React Router + Cloudflare + Supabase Template

Full-stack React starter built with React Router v8 (framework mode) on **Cloudflare Workers**,
Supabase (auth + Postgres), Drizzle ORM (via Cloudflare Hyperdrive), shadcn/ui, and Tailwind CSS.

Includes: email/password auth (signup, login, logout, email confirmation, password reset), a
protected area, and an example **notes** feature showing the full pattern (table → queries →
validation → routes → UI → tests). Conventions for humans and AI agents live in
[AGENTS.md](./AGENTS.md) — read it before contributing.

## Starting a new project from this template

1. On GitHub: **Use this template → Create a new repository**, then clone it.
2. **Rename** (each project needs its own names, or deploys will overwrite each other):
   - `package.json` → `name`
   - `wrangler.jsonc` → `name` (becomes `<name>.<account>.workers.dev`)
   - `app/lib/site.ts` → app name and description (header, page titles)
   - this README's title
3. **Keep or remove the notes example.** To remove it, follow "Remove the notes example" in
   [AGENTS.md](./AGENTS.md#recipes).
4. Create a **new Supabase project** and follow the setup below.
5. Follow "Deploying to Cloudflare" — create a **new Hyperdrive config** for this project and
   paste its id into `wrangler.jsonc`.

## Getting started (local)

**Requirements:** Node 24 (`nvm use` reads `.nvmrc`) and a Supabase project.

```bash
npm install
cp .env.example .env   # then fill in the values (see below)
npm run dev            # http://localhost:5173 — runs in workerd, the real Workers runtime
```

### Supabase setup (one-time per project)

1. **Env vars** — in `.env`:
   - `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`: Project Settings → API Keys
   - `DATABASE_URL` and `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`: Connect →
     **Session pooler** connection string (works on IPv4 networks). Usually the same value.
2. **Redirect URLs** — Authentication → URL Configuration: set the Site URL and add
   `http://localhost:5173/auth/confirm` (plus your production `/auth/confirm` URL).
3. **Email templates (recommended)** — so email links work on any device/browser, edit these
   templates under Authentication → Emails and set the link to:
   - "Confirm signup": `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   - "Reset password":
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password`
4. **Email sending (before real users sign up)** — Supabase's built-in email sender is for
   testing only: it only delivers to your project team's addresses and is heavily rate-limited.
   Set up custom SMTP (Authentication → SMTP Settings) with a provider such as Resend or Brevo.
5. **Create the tables** (includes the example `notes` table):
   ```bash
   npm run db:migrate    # applies drizzle/*.sql to DATABASE_URL
   ```
   Later, after changing `app/db/schema.ts`: `npm run db:generate`, review the SQL, then
   `npm run db:migrate`.

## Deploying to Cloudflare (one-time setup)

```bash
npx wrangler login

# 1. Create the Hyperdrive config using Supabase's DIRECT connection string
#    (Supabase → Connect → Direct connection). Hyperdrive does the pooling.
#    Caching is disabled so users always see their latest writes.
npx wrangler hyperdrive create react-router-app-db \
  --connection-string="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres" \
  --caching-disabled
#    → paste the returned id into wrangler.jsonc (hyperdrive[0].id)

# 2. Set production secrets
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY

# 3. Deploy
npm run deploy
```

Then add your `*.workers.dev` (or custom domain) URL + `/auth/confirm` to Supabase's Redirect
URLs and set it as the Site URL.

**Automatic deploys:** connect the GitHub repo in the Cloudflare dashboard (Workers & Pages →
your Worker → Settings → Builds) to deploy on every push to `main`, with preview URLs for
branches. Build command: `npm run build`, deploy command: `npx wrangler deploy`.

## Scripts

| Command                               | What it does                                    |
| ------------------------------------- | ----------------------------------------------- |
| `npm run dev`                         | Dev server with HMR (runs in workerd)           |
| `npm run check`                       | Typecheck + lint + format check                 |
| `npm test` / `npm run test:watch`     | Run tests (Vitest)                              |
| `npm run format` / `npm run lint:fix` | Auto-format / auto-fix lint issues              |
| `npm run build` / `npm run preview`   | Production build / run it locally               |
| `npm run deploy`                      | Build and deploy to Cloudflare                  |
| `npm run cf-typegen`                  | Regenerate Worker `Env` types after config edit |
| `npm run db:generate` / `db:migrate`  | Create / apply database migrations              |
| `npm run db:studio`                   | Browse the database                             |
| `npx shadcn@latest add <component>`   | Add a shadcn/ui component                       |

A pre-commit hook formats and lints staged files. CI (`.github/workflows/ci.yml`) runs checks,
tests, and a build on every push to `main` and every pull request.

## Editor

VS Code formats on save and fixes lint issues automatically — install the recommended extensions
when prompted. Other editors: enable Prettier format-on-save and ESLint.
