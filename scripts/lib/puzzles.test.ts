import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { matchesFilters, parsePuzzleRow, selectPuzzles, type PuzzleRow } from "./puzzles";

const lines = readFileSync(path.join(__dirname, "__fixtures__", "puzzles.csv"), "utf8")
  .split("\n")
  .filter(Boolean);
const rows = lines.map(parsePuzzleRow);

describe("parsePuzzleRow", () => {
  it("returns null for the header", () => {
    expect(parsePuzzleRow(lines[0])).toBeNull();
  });

  it("parses a row", () => {
    const row = parsePuzzleRow(lines[1])!;
    expect(row.moves.length).toBeGreaterThanOrEqual(2);
    expect(row.themes).toContain("backRankMate");
    expect(row.themes.every((t) => !t.includes(" "))).toBe(true);
    expect(row.rating).toBe(603);
    expect(row.popularity).toBe(81);
  });
});

describe("selectPuzzles", () => {
  it("picks perTheme puzzles within filters, spread by rating", () => {
    const { backRankMate } = selectPuzzles(rows, ["backRankMate"], { perTheme: 5 });
    expect(backRankMate).toHaveLength(5);
    const ratings = backRankMate.map((p) => p.rating);
    expect(ratings.every((r) => r >= 600 && r <= 1800)).toBe(true);
    expect(ratings).toEqual([...ratings].sort((a, b) => a - b));
    // not just the first five rows of the file: reaches the high end
    expect(Math.max(...ratings)).toBeGreaterThan(1100);
    const bands = new Set(ratings.map((r) => Math.floor(r / 100)));
    expect(bands.size).toBe(5);
  });

  it("applies popularity and plays filters and omits those fields from output", () => {
    const { backRankMate } = selectPuzzles(rows, ["backRankMate"], { perTheme: 100 });
    const ids = backRankMate.map((p) => p.id);
    expect(ids).not.toContain("009L0"); // popularity 18
    expect(ids).not.toContain("001Wz"); // 86 plays
    expect(ids).not.toContain("0030b"); // rating 538
    expect(ids).not.toContain("05Ryc"); // rating 1981
    expect(backRankMate[0]).not.toHaveProperty("popularity");
    expect(backRankMate[0]).not.toHaveProperty("nbPlays");
  });

  it("returns an empty list for a theme without puzzles", () => {
    expect(selectPuzzles(rows, ["nope"])).toEqual({ nope: [] });
  });
});

describe("matchesFilters", () => {
  const base: PuzzleRow = {
    id: "x", fen: "f", moves: ["a1a2", "a2a3"], themes: [], rating: 600, popularity: 80, nbPlays: 500,
  };
  it("accepts the inclusive boundaries", () => {
    expect(matchesFilters(base)).toBe(true);
    expect(matchesFilters({ ...base, rating: 1800 })).toBe(true);
  });
  it("rejects just outside each boundary", () => {
    expect(matchesFilters({ ...base, rating: 599 })).toBe(false);
    expect(matchesFilters({ ...base, rating: 1801 })).toBe(false);
    expect(matchesFilters({ ...base, popularity: 79 })).toBe(false);
    expect(matchesFilters({ ...base, nbPlays: 499 })).toBe(false);
  });
  it("honours custom options", () => {
    expect(matchesFilters({ ...base, rating: 1000 }, { min: 1100 })).toBe(false);
  });
});

describe("selectPuzzles duplicates", () => {
  it("lists a row once per theme even when it is passed twice", () => {
    const row: PuzzleRow = {
      id: "dup", fen: "f", moves: ["a1a2", "a2a3"], themes: ["fork", "pin"],
      rating: 900, popularity: 90, nbPlays: 900,
    };
    const out = selectPuzzles([row, row], ["fork", "pin"]);
    expect(out.fork.map((p) => p.id)).toEqual(["dup"]);
    expect(out.pin.map((p) => p.id)).toEqual(["dup"]);
  });
});
