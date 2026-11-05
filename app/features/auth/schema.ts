import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export type CredentialsErrors = Partial<Record<keyof Credentials | "form", string[]>>;

/** Validates a login/signup form. Returns typed data or per-field error messages. */
export function parseCredentials(formData: FormData) {
  const result = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (result.success) return { data: result.data, errors: null };
  return { data: null, errors: z.flattenError(result.error).fieldErrors as CredentialsErrors };
}
