import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Gemini model configuration", () => {
  it("uses the currently available Gemini 3.8 Flash model", () => {
    const source = readFileSync(
      resolve(process.cwd(), "supabase/functions/analyze-article/index.ts"),
      "utf8"
    );

    expect(source).toContain("models/gemini-3.8-flash");
  });
});
