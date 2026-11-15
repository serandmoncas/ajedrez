import { describe, expect, it } from "vitest";
import type { EngineResult } from "../chess/claims";
import type { ContentItem } from "./schema";
import { validateBundle } from "./validate";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const BACK_RANK = "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1";
const FOOLS = ["f3", "e5", "g4", "Qh4#"];
const FOOLS_PGN = '[Event "x"]\n\n1. f3 e5 2. g4 Qh4# 0-1';

const base = { title: "T", order: 1, sources: [{ title: "S" }], body: "b" };
const pos = { fen: BACK_RANK, solution: ["a1a8"] };
const pattern = (over: Record<string, unknown> = {}) =>
  ({ ...base, id: "p1", kind: "pattern", themes: ["backRankMate"], examples: [pos], ...over }) as ContentItem;
const combination = (over: Record<string, unknown> = {}) =>
  ({
    ...base,
    id: "c1",
    kind: "combination",
    game: { white: "A", black: "B", year: 1900, event: "E" },
    fen: BACK_RANK,
    solution: ["a1a8"],
    expect: "mate",
    ...over,
  }) as ContentItem;
const game = (over: Record<string, unknown> = {}) =>
  ({
    ...base,
    id: "g1",
    kind: "game",
    white: "A",
    black: "B",
    year: 1900,
    event: "E",
    site: "S",
    referencePgn: "fools.pgn",
    moves: FOOLS,
    side: "w",
    segments: [{ from: 1, to: 4 }],
    ...over,
  }) as ContentItem;
const opening = (over: Record<string, unknown> = {}) =>
  ({
    ...base,
    id: "o1",
    kind: "opening",
    eco: "C20",
    lines: [{ id: "l1", name: "L", side: "w", moves: ["e4", "e5"], idea: "i" }],
    ...over,
  }) as ContentItem;

const ctx = (over: Partial<Parameters<typeof validateBundle>[1]> = {}) => ({
  engine: {} as Record<string, EngineResult[]>,
  referencePgns: { "fools.pgn": FOOLS_PGN },
  puzzleThemes: new Set<string>(),
  ...over,
});
const rules = (items: ContentItem[], c = ctx()) => validateBundle(items, c).map((i) => i.rule);

describe("validateBundle", () => {
  it("accepts a clean bundle", () => {
    expect(validateBundle([pattern(), combination(), game(), opening()], ctx())).toEqual([]);
  });

  it("illegal-fen: in examples, positions, combination and claims", () => {
    expect(rules([pattern({ examples: [{ fen: "nonsense", solution: ["a1a8"] }] })])).toContain("illegal-fen");
    expect(rules([pattern({ positions: [{ fen: "x", solution: ["a1a8"] }] })])).toContain("illegal-fen");
    expect(rules([combination({ fen: "x" })])).toContain("illegal-fen");
    expect(rules([pattern({ claims: [{ id: "k", fen: "x", assert: "equal" }] })])).toContain("illegal-fen");
  });

  it("illegal-solution: an illegal UCI move", () => {
    const issues = validateBundle([pattern({ examples: [{ fen: BACK_RANK, solution: ["a1a9"] }] })], ctx());
    expect(issues.map((i) => i.rule)).toEqual(["illegal-solution"]);
    expect(issues[0].itemId).toBe("p1");
    expect(rules([combination({ solution: ["a1a8", "g8f8", "a8a1x"] })])).toContain("illegal-solution");
  });

  it("combination-outcome: mate must end in checkmate", () => {
    expect(rules([combination({ solution: ["a1a7"] })])).toEqual(["combination-outcome"]);
    expect(rules([combination({ solution: ["a1a8"] })])).toEqual([]);
  });

  it("combination-outcome: mate against the solver does not count", () => {
    // white plays b3, black answers Ra1# : the final position is mate, but the solver is mated
    const c = combination({ fen: "r6k/8/8/8/8/8/1P4PP/7K w - - 0 1", solution: ["b2b3", "a8a1"], expect: "mate" });
    expect(rules([c])).toEqual(["combination-outcome"]);
  });

  it("illegal-solution: promotion suffix on a non-promotion move", () => {
    expect(rules([combination({ solution: ["a1a8q"] })])).toEqual(["illegal-solution"]);
    const promo = combination({ fen: "8/4P1k1/8/8/8/8/8/6K1 w - - 0 1", solution: ["e7e8q"], expect: "material" });
    expect(rules([promo])).toEqual([]);
  });

  it("illegal-fen: side not to move is in check", () => {
    expect(rules([pattern({ examples: [{ fen: "4k3/8/8/8/8/8/8/4RK2 w - - 0 1", solution: ["e1e2"] }] })])).toEqual([
      "illegal-fen",
    ]);
    expect(rules([combination({ fen: "4k3/8/8/8/8/8/8/4RK2 w - - 0 1" })])).toContain("illegal-fen");
  });

  it("combination-outcome: material gain from the solver's side", () => {
    // white rook takes the black queen on a8
    const fen = "q5k1/8/8/8/8/8/8/R5K1 w - - 0 1";
    const win = combination({ fen, expect: "material", solution: ["a1a8"], materialGain: 9 });
    expect(rules([win])).toEqual([]);
    expect(rules([combination({ fen, expect: "material", solution: ["a1a8"], materialGain: 10 })])).toEqual([
      "combination-outcome",
    ]);
    // default gain is 1: a quiet move gains nothing
    expect(rules([combination({ fen, expect: "material", solution: ["a1a2"] })])).toEqual(["combination-outcome"]);
    // the opponent recaptures: queen for knight is a net loss
    const lost = "3r2k1/8/8/3n4/8/8/8/3Q2K1 w - - 0 1";
    expect(rules([combination({ fen: lost, expect: "material", solution: ["d1d5", "d8d5"] })])).toEqual([
      "combination-outcome",
    ]);
    expect(rules([combination({ fen: lost, expect: "material", solution: ["d1d5"], materialGain: 3 })])).toEqual([]);
  });

  it("combination-outcome: black solving is counted from black's side", () => {
    const fen = "r5k1/8/8/8/8/8/8/Q5K1 b - - 0 1";
    const c = combination({ fen, expect: "material", solution: ["a8a1"], materialGain: 9 });
    expect(rules([c])).toEqual([]);
  });

  it("illegal-game: moves are not a legal game", () => {
    const r = validateBundle([game({ moves: ["f3", "e5", "g4", "Qh5"] })], ctx());
    expect(r.map((i) => i.rule)).toContain("illegal-game");
  });

  it("reference-mismatch: reports the first differing ply", () => {
    const issues = validateBundle([game({ moves: ["f3", "e5", "g3", "Qh4"], segments: [] })], ctx());
    const mm = issues.filter((i) => i.rule === "reference-mismatch");
    expect(mm).toHaveLength(1);
    expect(mm[0].message).toContain("3");
  });

  it("reference-mismatch: ignores check marks and annotations", () => {
    const g = game({ moves: ["f3!", "e5?", "g4", "Qh4"] });
    // "f3!" is not accepted by every parser; strip marks only for the comparison
    expect(rules([g])).not.toContain("reference-mismatch");
  });

  it("reference-mismatch: a missing reference file", () => {
    const issues = validateBundle([game()], ctx({ referencePgns: {} }));
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe("reference-mismatch");
    expect(issues[0].message.toLowerCase()).toContain("falta");
  });

  it("reference-mismatch: reference longer or shorter than moves", () => {
    expect(rules([game({ moves: ["f3", "e5"], segments: [] })])).toContain("reference-mismatch");
  });

  it("bad-segment: out of range, reversed, overlapping, unordered", () => {
    expect(rules([game({ segments: [{ from: 1, to: 5 }] })])).toContain("bad-segment");
    expect(rules([game({ segments: [{ from: 3, to: 2 }] })])).toContain("bad-segment");
    expect(rules([game({ segments: [{ from: 1, to: 2 }, { from: 2, to: 3 }] })])).toContain("bad-segment");
    expect(rules([game({ segments: [{ from: 3, to: 4 }, { from: 1, to: 2 }] })])).toContain("bad-segment");
    expect(rules([game({ segments: [{ from: 1, to: 2 }, { from: 3, to: 4 }] })])).toEqual([]);
  });

  it("alternative-illegal: legal alternative at ply N passes; illegal or out of range fails", () => {
    const ok = game({ alternatives: { "1": [{ san: "e4", comment: "c" }] } });
    expect(rules([ok])).toEqual([]);
    // ply 2 is black's move: "e4" is not legal for black there (pawn on e4 is white's)
    const bad = game({ side: "b", alternatives: { "2": [{ san: "Nf3", comment: "c" }] } });
    expect(rules([bad])).toEqual(["alternative-illegal"]);
    const range = game({ alternatives: { "9": [{ san: "e4", comment: "c" }] } });
    expect(rules([range])).toContain("alternative-illegal");
    // legal for black at ply 2 but only in the position BEFORE moves[1]
    expect(rules([game({ side: "b", alternatives: { "2": [{ san: "e6", comment: "c" }] } })])).toEqual([]);
  });

  it("comment-wrong-side: alternatives on plies of the side that is not guessing", () => {
    // side w guesses odd plies; ply 2 is black's (auto-played) move, never guessed
    expect(rules([game({ alternatives: { "2": [{ san: "e6", comment: "c" }] } })])).toEqual(["comment-wrong-side"]);
    expect(rules([game({ side: "b", alternatives: { "1": [{ san: "e4", comment: "c" }] } })])).toEqual([
      "comment-wrong-side",
    ]);
    // comments on any ply are allowed (auto-played plies show theirs too)
    expect(rules([game({ side: "b", comments: { "1": "x", "2": "y" } })])).toEqual([]);
  });

  it("game comments with an out-of-range ply are flagged", () => {
    expect(rules([game({ comments: { "5": "x" } })])).toContain("illegal-game");
    expect(rules([game({ comments: { "4": "x" } })])).toEqual([]);
  });

  it("illegal-line: opening lines and traps", () => {
    const badLine = opening({ lines: [{ id: "l", name: "L", side: "w", moves: ["e4", "e4"], idea: "" }] });
    expect(rules([badLine])).toEqual(["illegal-line"]);
    const badTrap = opening({ traps: [{ name: "T", moves: ["e4", "Ke3"], comment: "" }] });
    expect(rules([badTrap])).toEqual(["illegal-line"]);
    const longForm = opening({ lines: [{ id: "l", name: "L", side: "w", moves: ["e2e4"], idea: "" }] });
    expect(rules([longForm])).toEqual(["illegal-line"]);
    expect(rules([opening({ traps: [{ name: "T", moves: ["e4", "e5"], comment: "" }] })])).toEqual([]);
  });

  it("broken-link: missing id or wrong kind", () => {
    const items = [pattern(), combination(), game(), opening()];
    const withLinks = (links: object) => [{ ...pattern({ id: "src", links }) }, ...items];
    expect(rules(withLinks({ patterns: ["p1"] }))).toEqual([]);
    expect(rules(withLinks({ patterns: ["nope"] }))).toEqual(["broken-link"]);
    expect(rules(withLinks({ openings: ["p1"] }))).toEqual(["broken-link"]);
    expect(rules(withLinks({ games: ["o1"] }))).toEqual(["broken-link"]);
    expect(rules(withLinks({ combinations: ["g1"] }))).toEqual(["broken-link"]);
    expect(rules(withLinks({ openings: ["o1"], games: ["g1"], combinations: ["c1"] }))).toEqual([]);
  });

  it("broken-link: patterns may point to techniques", () => {
    const tech = { ...base, id: "t1", kind: "technique", examples: [pos] } as ContentItem;
    const src = pattern({ id: "src", links: { patterns: ["t1"] } });
    expect(rules([src, tech])).toEqual([]);
  });

  const claimItem = (assert: "equal" | "best" = "equal", move?: string) =>
    pattern({ claims: [{ id: "k1", fen: START, move, assert }] });
  const engineFor = (over: Partial<EngineResult> = {}) => ({
    p1: [{ claimId: "k1", fen: START, depth: 22, bestMove: "e2e4", evalCp: 0, ...over }],
  });

  it("missing-engine-result", () => {
    expect(rules([claimItem()])).toEqual(["missing-engine-result"]);
    expect(rules([claimItem()], ctx({ engine: { p1: [] } }))).toEqual(["missing-engine-result"]);
  });

  it("claim-failed and passing claims", () => {
    expect(rules([claimItem()], ctx({ engine: engineFor() }))).toEqual([]);
    expect(rules([claimItem()], ctx({ engine: engineFor({ evalCp: 300 }) }))).toEqual(["claim-failed"]);
    expect(rules([claimItem()], ctx({ engine: engineFor({ depth: 10 }) }))).toEqual(["claim-failed"]);
  });

  it("stale-engine-result: fen or move changed", () => {
    const otherFen = "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1";
    expect(rules([claimItem()], ctx({ engine: engineFor({ fen: otherFen }) }))).toEqual(["stale-engine-result"]);
    expect(rules([claimItem("best", "e4")], ctx({ engine: engineFor({ move: "d4" }) }))).toEqual([
      "stale-engine-result",
    ]);
    expect(rules([claimItem("best", "e4")], ctx({ engine: engineFor({}) }))).toEqual(["stale-engine-result"]);
  });

  it("unknown-theme: only checked once puzzle themes are known", () => {
    expect(rules([pattern()], ctx({ puzzleThemes: new Set() }))).toEqual([]);
    expect(rules([pattern()], ctx({ puzzleThemes: new Set(["fork"]) }))).toEqual(["unknown-theme"]);
    expect(rules([pattern()], ctx({ puzzleThemes: new Set(["backRankMate"]) }))).toEqual([]);
    const tech = { ...base, id: "t1", kind: "technique", themes: ["zzz"], examples: [pos] } as ContentItem;
    expect(rules([tech], ctx({ puzzleThemes: new Set(["fork"]) }))).toEqual(["unknown-theme"]);
  });

  it("duplicate-id", () => {
    const issues = validateBundle([pattern(), pattern()], ctx());
    expect(issues.map((i) => i.rule)).toEqual(["duplicate-id"]);
    expect(issues[0].itemId).toBe("p1");
  });
});
