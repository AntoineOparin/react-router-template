// Drizzle table definitions — the single source of truth for the database schema.
// After changing this file: `npm run db:generate` then `npm run db:migrate`.
//
// Rules (see AGENTS.md → "Database"):
// - Every table MUST call `.enableRLS()`. Supabase exposes the `public` schema through its
//   Data API; RLS with no policies blocks that, while Drizzle (server-side, `postgres` role)
//   still has full access.
// - Use snake_case column names in the DB, camelCase property names in TypeScript.
// - User-owned rows reference `authUsers.id` (Supabase's auth.users) with `onDelete: "cascade"`.

import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// Example feature table (see app/features/notes). Delete it if your app doesn't need notes.
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("notes_owner_id_idx").on(table.ownerId)],
).enableRLS();

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
