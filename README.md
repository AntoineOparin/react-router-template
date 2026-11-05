# React Router App

Full-stack React app built with React Router v8 (framework mode), Supabase (auth + Postgres),
Drizzle ORM, shadcn/ui, and Tailwind CSS.

Conventions for humans and AI agents live in [AGENTS.md](./AGENTS.md) — read it before
contributing.

## Getting started

**Requirements:** Node 24 (`nvm use` reads `.nvmrc`) and a Supabase project.

```bash
npm install
cp .env.example .env   # then fill in the values (see below)
npm run dev            # http://localhost:5173
```

### Supabase setup (one-time per project)

1. **Env vars** — in `.env`:
   - `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`: Project Settings → API Keys
   - `DATABASE_URL`: Connect → ORMs → Drizzle (transaction pooler, port 6543)
2. **Redirect URLs** — Authentication → URL Configuration: set the Site URL and add
   `http://localhost:5173/auth/confirm` (plus your production `/auth/confirm` URL).
3. **Email template (recommended)** — so confirmation links work on any device, set the
   "Confirm signup" template's link to:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
4. **Migrations** — after adding tables to `app/db/schema.ts`:
   ```bash
   npm run db:generate   # writes SQL to drizzle/
   npm run db:migrate    # applies it to DATABASE_URL
   ```

## Scripts

| Command                               | What it does                       |
| ------------------------------------- | ---------------------------------- |
| `npm run dev`                         | Dev server with HMR                |
| `npm run check`                       | Typecheck + lint + format check    |
| `npm test` / `npm run test:watch`     | Run tests (Vitest)                 |
| `npm run format` / `npm run lint:fix` | Auto-format / auto-fix lint issues |
| `npm run build` / `npm start`         | Production build / serve it        |
| `npm run db:generate` / `db:migrate`  | Create / apply database migrations |
| `npm run db:studio`                   | Browse the database                |
| `npx shadcn@latest add <component>`   | Add a shadcn/ui component          |

A pre-commit hook formats and lints staged files. CI (`.github/workflows/ci.yml`) runs checks,
tests, and a build on every push to `main` and every pull request.

## Editor

VS Code formats on save and fixes lint issues automatically — install the recommended extensions
when prompted. Other editors: enable Prettier format-on-save and ESLint.

## Deployment

```bash
npm run build && npm start
```

Or use the included `Dockerfile`:

```bash
docker build -t my-app .
docker run -p 3000:3000 --env-file .env my-app
```

Set the same env vars as `.env.example` on your hosting platform.
