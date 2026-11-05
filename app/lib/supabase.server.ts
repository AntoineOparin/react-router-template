import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

import { env } from "~/lib/env.server";

/**
 * Creates a Supabase client bound to one request. Create a new one per request —
 * never share it. Auth cookies Supabase wants to set are collected in `headers`,
 * which the auth middleware copies onto the outgoing response.
 */
export function createSupabaseServerClient(request: Request) {
  const headers = new Headers();

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "");
      },
      setAll(cookies, cacheHeaders) {
        for (const { name, value, options } of cookies) {
          headers.append("Set-Cookie", serializeCookieHeader(name, value, options));
        }
        // Prevents CDNs from caching responses that carry auth cookies.
        for (const [key, value] of Object.entries(cacheHeaders ?? {})) {
          headers.set(key, value);
        }
      },
    },
  });

  return { supabase, headers };
}
