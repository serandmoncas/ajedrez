import { describe, expect, it } from "vitest";
import { contentItemSchema } from "./schema";

const position = { fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", solution: ["a1a8"] };
const base = {
  id: "back-rank",
  title: "Mate del pasillo",
  order: 1,
  sources: [{ title: "Fuente" }],
  body: "Texto",
};
const pattern = { ...base, kind: "pattern", themes: ["backRankMate"], examples: [position] };

describe("contentItemSchema", () => {
  it("accepts a pattern with themes and one example", () => {
    expect(contentItemSchema.safeParse(pattern).success).toBe(true);
  });

  it("rejects a pattern without themes and with 9 positions", () => {
    const r = contentItemSchema.safeParse({
      ...base,
      kind: "pattern",
      examples: [position],
      positions: Array.from({ length: 9 }, () => position),
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(r.error.issues)).toContain("themes");
  });

  it("accepts a pattern without themes and with 10 positions", () => {
    const r = contentItemSchema.safeParse({
      ...base,
      kind: "pattern",
      examples: [position],
      positions: Array.from({ length: 10 }, () => position),
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty sources", () => {
    expect(contentItemSchema.safeParse({ ...pattern, sources: [] }).success).toBe(false);
  });

  it("rejects an id with uppercase letters", () => {
    expect(contentItemSchema.safeParse({ ...pattern, id: "Back-Rank" }).success).toBe(false);
  });

  const opening = (moves: string[]) => ({
    ...base,
    id: "italian",
    kind: "opening",
    eco: "C50",
    lines: [{ id: "main", name: "Principal", side: "w", moves, idea: "Idea" }],
  });

  it("accepts an opening line of 24 plies and rejects 25", () => {
    expect(contentItemSchema.safeParse(opening(Array(24).fill("e4"))).success).toBe(true);
    expect(contentItemSchema.safeParse(opening(Array(25).fill("e4"))).success).toBe(false);
  });

  it("accepts a combination and a game", () => {
    const combination = {
      ...base,
      kind: "combination",
      game: { white: "A", black: "B", year: 1900, event: "E" },
      fen: position.fen,
      solution: ["a1a8"],
      expect: "mate",
    };
    expect(contentItemSchema.safeParse(combination).success).toBe(true);
    const game = {
      ...base,
      kind: "game",
      white: "A",
      black: "B",
      year: 1900,
      event: "E",
      site: "S",
      referencePgn: "x.pgn",
      moves: ["e4", "e5"],
      side: "w",
      segments: [{ from: 1, to: 2 }],
    };
    expect(contentItemSchema.safeParse(game).success).toBe(true);
  });
});
