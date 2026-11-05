import { data, redirect } from "react-router";

import type { Route } from "./+types/login";
import { getSupabase, getUser, safeRedirectPath } from "~/features/auth/auth.server";
import { AuthForm } from "~/features/auth/components/auth-form";
import { parseCredentials } from "~/features/auth/schema";
import { pageTitle } from "~/lib/site";

export const meta: Route.MetaFunction = () => [{ title: pageTitle("Log in") }];

export function loader({ request, context }: Route.LoaderArgs) {
  const redirectTo = safeRedirectPath(new URL(request.url).searchParams.get("redirectTo"));
  if (getUser(context)) throw redirect(redirectTo);
  return { redirectTo };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const { data: credentials, errors } = parseCredentials(formData);
  if (!credentials) return data({ errors }, { status: 400 });

  const { error } = await getSupabase(context).auth.signInWithPassword(credentials);
  if (error) return data({ errors: { form: [error.message] } }, { status: 400 });

  return redirect(safeRedirectPath(formData.get("redirectTo")));
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  return <AuthForm mode="login" errors={actionData?.errors} redirectTo={loaderData.redirectTo} />;
}
