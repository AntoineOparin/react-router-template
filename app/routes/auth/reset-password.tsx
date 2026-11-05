import { data, redirect } from "react-router";

import type { Route } from "./+types/reset-password";
import { getSupabase } from "~/features/auth/auth.server";
import { ResetPasswordForm } from "~/features/auth/components/reset-password-form";
import { newPasswordSchema } from "~/features/auth/schema";
import { parseForm } from "~/lib/forms";
import { pageTitle } from "~/lib/site";

// Registered inside protected-layout in routes.ts: the reset email link signs the user in
// (via /auth/confirm) before they land here; anyone else is sent to the login page.

export const meta: Route.MetaFunction = () => [{ title: pageTitle("Choose a new password") }];

export async function action({ request, context }: Route.ActionArgs) {
  const { data: input, errors } = parseForm(newPasswordSchema, await request.formData());
  if (!input) return data({ errors }, { status: 400 });

  const { error } = await getSupabase(context).auth.updateUser({ password: input.password });
  if (error) return data({ errors: { form: [error.message] } }, { status: 400 });

  return redirect("/dashboard");
}

export default function ResetPassword({ actionData }: Route.ComponentProps) {
  return <ResetPasswordForm errors={actionData?.errors} />;
}
