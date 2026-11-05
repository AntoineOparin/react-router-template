import { z } from "zod";

import type { FieldErrors } from "~/lib/forms";

/** Create/update form. Safe to use on both client and server. */
export const noteSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(200, "Keep the title under 200 characters"),
  body: z.string().trim().max(10_000, "Note is too long (max 10,000 characters)").default(""),
});

export type NoteInput = z.infer<typeof noteSchema>;
export type NoteErrors = FieldErrors<NoteInput>;

/** Validates the `:id` URL param before it reaches the database. */
export const noteIdSchema = z.uuid();

export type { Note } from "~/db/schema";
