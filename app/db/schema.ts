// Drizzle table definitions — the single source of truth for the database schema.
// After changing this file: `npm run db:generate` then `npm run db:migrate`.
//
// Rules (see AGENTS.md → "Database"):
// - Every table MUST call `.enableRLS()`. Supabase exposes the `public` schema through its
//   Data API; RLS with no policies blocks that, while Drizzle (server-side, `postgres` role)
//   still has full access.
// - Use snake_case column names in the DB, camelCase property names in TypeScript.
//
// Example:
//
// import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
//
// export const projects = pgTable("projects", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   ownerId: uuid("owner_id").notNull(), // = Supabase auth user id
//   name: text("name").notNull(),
//   createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
// }).enableRLS();
//
// export type Project = typeof projects.$inferSelect;
// export type NewProject = typeof projects.$inferInsert;

export {};
