import { z } from "zod";

import { parseForm, type FieldErrors } from "~/lib/forms";

const email = z.email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters");

/** Login and signup. */
export const credentialsSchema = z.object({ email, password });
export type Credentials = z.infer<typeof credentialsSchema>;
export type CredentialsErrors = FieldErrors<Credentials>;

export function parseCredentials(formData: FormData) {
  return parseForm(credentialsSchema, formData);
}

/** "Forgot password" request. */
export const emailSchema = z.object({ email });

/** Choosing a new password after following a reset link. */
export const newPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type NewPasswordErrors = FieldErrors<z.input<typeof newPasswordSchema>>;
