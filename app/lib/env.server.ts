import { z } from "zod";

// Load `.env` if present. Variables already set in the real environment
// (e.g. by your hosting platform) take precedence over the file.
try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the real environment.
}

// Every server-side env var must be declared here AND in `.env.example`.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables (copy .env.example to .env and fill it in):\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
