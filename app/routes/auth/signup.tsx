import { data, redirect } from "react-router";

import type { Route } from "./+types/signup";
import { getSupabase, getUser } from "~/features/auth/auth.server";
import { AuthForm } from "~/features/auth/components/auth-form";
import { parseCredentials } from "~/features/auth/schema";

export const meta: Route.MetaFunction = () => [{ title: "Sign up" }];

export function loader({ context }: Route.LoaderArgs) {
  if (getUser(context)) throw redirect("/dashboard");
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const { data: credentials, errors } = parseCredentials(formData);
  if (!credentials) return data({ errors, message: undefined }, { status: 400 });

  const { origin } = new URL(request.url);
  const { data: result, error } = await getSupabase(context).auth.signUp({
    ...credentials,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) {
    return data({ errors: { form: [error.message] }, message: undefined }, { status: 400 });
  }

  // Email confirmation disabled in Supabase → user is signed in immediately.
  if (result.session) return redirect("/dashboard");

  return { errors: null, message: "Check your email for a link to confirm your account." };
}

export default function Signup({ actionData }: Route.ComponentProps) {
  return <AuthForm mode="signup" errors={actionData?.errors} message={actionData?.message} />;
}
