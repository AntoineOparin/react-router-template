import { env, waitUntil } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createContext } from "react-router";
import type { MiddlewareFunction, RouterContextProvider } from "react-router";

import * as schema from "./schema";

function createDb(connectionString: string) {
  // Workers can't share connections between requests, so each request gets its own client.
  // Hyperdrive pools the real Postgres connections, which keeps this cheap.
  const client = postgres(connectionString, {
    max: 5, // Workers allow at most 6 open connections per request
    fetch_types: false, // skip an extra round-trip on connect
  });
  return { db: drizzle(client, { schema }), client };
}

export type Db = ReturnType<typeof createDb>["db"];

const dbContext = createContext<Db>();

/**
 * Root middleware (registered in app/root.tsx). Gives each request its own Drizzle client.
 * `postgres` connects lazily, so requests that never query the DB never open a connection.
 */
export const dbMiddleware: MiddlewareFunction<Response> = async ({ context }, next) => {
  const { db, client } = createDb(env.HYPERDRIVE.connectionString);
  context.set(dbContext, db);
  try {
    return await next();
  } finally {
    // Close after the response is sent (lets streamed/deferred queries finish first).
    waitUntil(client.end());
  }
};

/** The request's Drizzle client. Pass it into `features/*.server.ts` functions. */
export function getDb(context: Readonly<RouterContextProvider>) {
  return context.get(dbContext);
}
