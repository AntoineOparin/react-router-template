import { describe, expect, it } from "vitest";

import { parseCredentials } from "./schema";

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("parseCredentials", () => {
  it("returns data for valid credentials", () => {
    const result = parseCredentials(form({ email: "ada@example.com", password: "correct-horse" }));
    expect(result.errors).toBeNull();
    expect(result.data).toEqual({ email: "ada@example.com", password: "correct-horse" });
  });

  it("returns field errors for invalid input", () => {
    const result = parseCredentials(form({ email: "not-an-email", password: "short" }));
    expect(result.data).toBeNull();
    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.password).toBeDefined();
  });

  it("treats missing fields as errors", () => {
    const result = parseCredentials(new FormData());
    expect(result.data).toBeNull();
    expect(result.errors?.email).toBeDefined();
  });
});
