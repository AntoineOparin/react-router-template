import { data } from "react-router";

import type { Route } from "./+types/forgot-password";
import { getSupabase } from "~/features/auth/auth.server";
import { ForgotPasswordForm } from "~/features/auth/components/forgot-password-form";
import { emailSchema } from "~/features/auth/schema";
import { parseForm } from "~/lib/forms";
import { pageTitle } from "~/lib/site";

export const meta: Route.MetaFunction = () => [{ title: pageTitle("Reset password") }];

export async function action({ request, context }: Route.ActionArgs) {
  const { data: input, errors } = parseForm(emailSchema, await request.formData());
  if (!input) return data({ errors, message: undefined }, { status: 400 });

  // The email link goes through /auth/confirm (signs the user in), then on to the reset page.
  const { origin } = new URL(request.url);
  const { error } = await getSupabase(context).auth.resetPasswordForEmail(input.email, {
    redirectTo: `${origin}/auth/confirm?next=/auth/reset-password`,
  });
  if (error) console.error("resetPasswordForEmail failed:", error.message);

  // Same answer whether or not the account exists, so this form can't be used to probe emails.
  return {
    errors: null,
    message: "If an account exists for that email, we've sent a link to reset the password.",
  };
}

export default function ForgotPassword({ actionData }: Route.ComponentProps) {
  return <ForgotPasswordForm errors={actionData?.errors} message={actionData?.message} />;
}
