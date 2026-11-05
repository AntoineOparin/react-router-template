import { z } from "zod";

/** Per-field error messages, plus an optional `form` entry for errors not tied to one field. */
export type FieldErrors<T> = Partial<Record<keyof T | "form", string[]>>;

/**
 * Validates submitted form data against a Zod object schema.
 * Returns `{ data, errors: null }` on success or `{ data: null, errors }` with per-field messages.
 *
 * @example
 * const { data: input, errors } = parseForm(noteSchema, await request.formData());
 * if (!input) return data({ errors }, { status: 400 });
 */
export function parseForm<Schema extends z.ZodType>(schema: Schema, formData: FormData) {
  const result = schema.safeParse(Object.fromEntries(formData));

  if (result.success) return { data: result.data as z.output<Schema>, errors: null };
  return {
    data: null,
    errors: z.flattenError(result.error).fieldErrors as FieldErrors<z.input<Schema>>,
  };
}
