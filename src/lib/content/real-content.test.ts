import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadValidationContext } from "./context";
import { loadContent } from "./load";
import { validateBundle } from "./validate";

describe("real content", () => {
  it("loads and validates without problems", async () => {
    const dir = path.resolve("content");
    const { items, errors } = await loadContent(dir);
    expect(errors).toEqual([]);
    expect(validateBundle(items, await loadValidationContext(dir))).toEqual([]);
  });
});
