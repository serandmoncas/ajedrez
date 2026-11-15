import { describe, expect, it } from "vitest";
import { emptyProgress } from "../progress/types";
import type { Puzzle } from "../content/puzzle";
import { nextPuzzleForPattern } from "./picker";

const now = new Date("2026-11-15T10:00:00.000Z");
const pz = (id: string, rating: number): Puzzle => ({ id, fen: "", moves: [], rating, themes: [] });
const puzzles = [pz("c", 1500), pz("a", 800), pz("b", 1000)];

describe("nextPuzzleForPattern", () => {
  it("returns null for an empty list", () => {
    expect(nextPuzzleForPattern(emptyProgress(now), [], now)).toBeNull();
  });
  it("returns the unseen puzzle with lowest rating first", () => {
    expect(nextPuzzleForPattern(emptyProgress(now), puzzles, now)?.id).toBe("a");
  });
  it("skips seen puzzles while unseen ones remain", () => {
    const p = emptyProgress(now);
    p.seenPuzzles.a = "2026-11-14T00:00:00.000Z";
    expect(nextPuzzleForPattern(p, puzzles, now)?.id).toBe("b");
  });
  it("with all seen, returns the one seen longest ago", () => {
    const p = emptyProgress(now);
    p.seenPuzzles.a = "2026-11-14T00:00:00.000Z";
    p.seenPuzzles.b = "2026-11-01T00:00:00.000Z";
    p.seenPuzzles.c = "2026-11-10T00:00:00.000Z";
    expect(nextPuzzleForPattern(p, puzzles, now)?.id).toBe("b");
  });
  it("does not mutate the puzzles array", () => {
    const copy = [...puzzles];
    nextPuzzleForPattern(emptyProgress(now), puzzles, now);
    expect(puzzles).toEqual(copy);
  });
});
