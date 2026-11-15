// @vitest-environment node
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent } from "./load";

const fixtures = path.join(__dirname, "__fixtures__", "content");

describe("loadContent", () => {
  it("loads valid files and reports the broken one", async () => {
    const { items, errors } = await loadContent(fixtures);
    expect(items.map((i) => i.id).sort()).toEqual(["back-rank", "pin"]);
    expect(errors).toHaveLength(1);
    expect(errors[0].file.endsWith("broken.md")).toBe(true);
  });

  it("takes kind from the folder and strips frontmatter from body", async () => {
    const { items } = await loadContent(fixtures);
    const p = items.find((i) => i.id === "back-rank");
    expect(p?.kind).toBe("pattern");
    expect(items.find((i) => i.id === "pin")?.kind).toBe("technique");
    expect(p?.body.trim()).toBe("Cuerpo del patrón.");
  });

  it("reports a frontmatter kind that disagrees with the folder", async () => {
    const { items, errors } = await loadContent(path.join(fixtures, "mismatch"));
    expect(items).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].file.endsWith("liar.md")).toBe(true);
    expect(errors[0].message).toContain("kind");
  });

  it("returns empty results for missing or empty directories", async () => {
    expect(await loadContent(path.join(fixtures, "nope"))).toEqual({ items: [], errors: [] });
    const empty = await mkdtemp(path.join(tmpdir(), "content-"));
    expect(await loadContent(empty)).toEqual({ items: [], errors: [] });
  });
});
