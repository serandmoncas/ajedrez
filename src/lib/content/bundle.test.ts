import { describe, expect, it, vi, afterEach } from "vitest";
import { compileBundle } from "./bundle";
import { fetchBundle } from "./bundle-client";
import type { ContentItem } from "./schema";

const pos = { fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", solution: ["a1a8"] };
function pattern(body: string, extra: Partial<ContentItem> = {}): ContentItem {
  return {
    kind: "pattern",
    id: "p-uno",
    title: "Uno",
    order: 1,
    sources: [{ title: "x" }],
    themes: ["fork"],
    examples: [pos],
    positions: [pos, { ...pos, solution: ["a1a7"] }],
    body,
    claims: [{ id: "c", fen: pos.fen, assert: "best" }],
    ...extra,
  } as ContentItem;
}

describe("compileBundle", () => {
  it("renders markdown, drops body and claims", () => {
    const b = compileBundle([pattern("**hola**")], {});
    expect(b.items[0].html).toContain("<strong>hola</strong>");
    expect(b.items[0]).not.toHaveProperty("body");
    expect(b.items[0]).not.toHaveProperty("claims");
  });

  it("has a stable 12-char version that changes with the text", () => {
    const a = compileBundle([pattern("uno")], {});
    expect(compileBundle([pattern("uno")], {}).version).toBe(a.version);
    expect(a.version).toMatch(/^[0-9a-f]{12}$/);
    expect(compileBundle([pattern("dos")], {}).version).not.toBe(a.version);
  });

  it("turns positions into custom puzzles and flags opponentFirst", () => {
    const lichess = { id: "L1", fen: "f", moves: ["a1a2"], rating: 900, themes: ["fork"] };
    const b = compileBundle([pattern("x")], { fork: [lichess] });
    expect(b.puzzles["custom:p-uno"]).toEqual([
      { id: "p-uno#1", fen: pos.fen, moves: ["a1a8"], rating: 0, themes: [], opponentFirst: false },
      { id: "p-uno#2", fen: pos.fen, moves: ["a1a7"], rating: 0, themes: [], opponentFirst: false },
    ]);
    expect(b.puzzles.fork[0].opponentFirst).toBe(true);
  });
});

describe("fetchBundle", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("throws a Spanish error on non-OK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(fetchBundle()).rejects.toThrow(/No se pudo cargar/);
  });
  it("returns the parsed bundle", async () => {
    const data = { version: "v", items: [], puzzles: {} };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    expect(await fetchBundle()).toEqual(data);
  });
});
