import { createContext, redirect } from "react-router";
import type { MiddlewareFunction, RouterContextProvider } from "react-router";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "~/lib/supabase.server";

export type AuthUser = { id: string; email?: string };

type AuthContext = { supabase: SupabaseClient; user: AuthUser | null };

const authContext = createContext<AuthContext>();

/**
 * Root middleware (registered in app/root.tsx). Runs on every server request:
 * creates the per-request Supabase client, resolves the signed-in user, and
 * writes any refreshed auth cookies onto the response.
 */
export const authMiddleware: MiddlewareFunction<Response> = async ({ request, context }, next) => {
  const { supabase, headers } = createSupabaseServerClient(request);

  // getClaims() verifies the JWT; never trust getSession() on the server.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const user: AuthUser | null = claims ? { id: claims.sub, email: claims.email } : null;

  context.set(authContext, { supabase, user });

  const response = await next();

  for (const cookie of headers.getSetCookie()) response.headers.append("Set-Cookie", cookie);
  headers.forEach((value, key) => {
    if (key !== "set-cookie") response.headers.set(key, value);
  });

  return response;
};

/** Route middleware for signed-in-only routes. Redirects guests to the login page. */
export const requireUserMiddleware: MiddlewareFunction<Response> = async ({ request, context }) => {
  if (!context.get(authContext).user) {
    const { pathname, search } = new URL(request.url);
    throw redirect(`/auth/login?redirectTo=${encodeURIComponent(pathname + search)}`);
  }
};

type Context = Readonly<RouterContextProvider>;

/** The current user, or null for guests. */
export function getUser(context: Context) {
  return context.get(authContext).user;
}

/** The current user. Only use in routes protected by `requireUserMiddleware`. */
export function requireUser(context: Context) {
  const user = getUser(context);
  if (!user) throw redirect("/auth/login");
  return user;
}

/** The request-scoped Supabase client (auth, storage, etc.). Use Drizzle for DB queries. */
export function getSupabase(context: Context) {
  return context.get(authContext).supabase;
}

/** Only allow redirects to paths on this site (prevents open-redirect attacks). */
export function safeRedirectPath(to: FormDataEntryValue | string | null, fallback = "/dashboard") {
  if (typeof to !== "string" || !to.startsWith("/") || to.startsWith("//")) return fallback;
  return to;
}
