import { env as cloudflareEnv } from "cloudflare:workers";
import { z } from "zod";

// Every server-side secret/var must be declared here AND in `.env.example`.
// Locally the values come from `.env`; in production from `wrangler secret put <NAME>`.
// (Bindings like HYPERDRIVE are objects, not strings — read them from `cloudflare:workers`.)
const envSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(cloudflareEnv);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables (copy .env.example to .env, or run \`wrangler secret put\` in production):\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
