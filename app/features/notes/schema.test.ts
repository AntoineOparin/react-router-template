import { describe, expect, it } from "vitest";

import { parseForm } from "~/lib/forms";

import { noteIdSchema, noteSchema } from "./schema";

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("noteSchema", () => {
  it("trims input and defaults the body to an empty string", () => {
    const { data, errors } = parseForm(noteSchema, form({ title: "  Groceries  " }));
    expect(errors).toBeNull();
    expect(data).toEqual({ title: "Groceries", body: "" });
  });

  it("requires a non-blank title", () => {
    expect(parseForm(noteSchema, form({ title: "   " })).errors?.title).toEqual([
      "Title is required",
    ]);
    expect(parseForm(noteSchema, new FormData()).errors?.title).toEqual(["Title is required"]);
  });

  it("rejects titles over 200 characters", () => {
    const { errors } = parseForm(noteSchema, form({ title: "x".repeat(201) }));
    expect(errors?.title).toBeDefined();
  });
});

describe("noteIdSchema", () => {
  it("accepts UUIDs and rejects anything else", () => {
    expect(noteIdSchema.safeParse("6f1c2b7e-3d5a-4f8e-9b2c-1a2b3c4d5e6f").success).toBe(true);
    expect(noteIdSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(noteIdSchema.safeParse("1; drop table notes").success).toBe(false);
  });
});
