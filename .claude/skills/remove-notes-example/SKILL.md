---
name: remove-notes-example
description: Remove the template's example "notes" feature when starting a real project from this template.
---

# Remove the notes example

When starting a real project from this template, delete:

- `app/features/notes/`
- `app/routes/notes/`
- the `notes` routes in `app/routes.ts`
- the `notes` table in `app/db/schema.ts`
- the "Notes" links in `app/components/layout/site-header.tsx` and `app/routes/dashboard/index.tsx`
- the files in `drizzle/`

Then run `npm run db:generate` to create your own first migration, and run the definition-of-done
checks from AGENTS.md.
