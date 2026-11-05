import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/lib/env.server";

import * as schema from "./schema";

// Reuse one connection pool across dev-server hot reloads.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

// `prepare: false` is required for Supabase's transaction pooler (port 6543).
const client = globalForDb.pgClient ?? postgres(env.DATABASE_URL, { prepare: false });

if (env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
