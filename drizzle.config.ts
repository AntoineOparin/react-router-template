import { defineConfig } from "drizzle-kit";

// drizzle-kit runs on your machine (Node), not in the Worker, so it reads .env directly.
try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the real environment.
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  // Only manage our own tables — never Supabase's `auth`, `storage`, etc.
  schemaFilter: ["public"],
});
