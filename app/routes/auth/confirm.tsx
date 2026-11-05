import { redirect } from "react-router";
import type { EmailOtpType } from "@supabase/supabase-js";

import type { Route } from "./+types/confirm";
import { getSupabase, safeRedirectPath } from "~/features/auth/auth.server";

// Target of Supabase email links (sign-up confirmation, magic link, password reset).
// Supports both the default `?code=` link and the recommended `?token_hash=&type=` template.
export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const next = safeRedirectPath(url.searchParams.get("next"));
  const supabase = getSupabase(context);

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirect(next);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return redirect(next);
  }

  return redirect("/auth/login");
}
