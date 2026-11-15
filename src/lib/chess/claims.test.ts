import { describe, expect, it } from "vitest";
import type { Claim } from "../content/schema";
import { claimPasses, type EngineResult } from "./claims";

// Start position: e4 is UCI e2e4, d4 is d2d4, a3 is a2a3.
const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const claim = (assert: Claim["assert"], move?: string): Claim => ({ id: "c", fen: FEN, move, assert });
const result = (over: Partial<EngineResult> = {}): EngineResult => ({
  claimId: "c",
  fen: FEN,
  depth: 22,
  bestMove: "e2e4",
  evalCp: 0,
  ...over,
});

describe("claimPasses", () => {
  it("wins: passes at +200, fails at +199, passes on mate", () => {
    expect(claimPasses(claim("wins"), result({ evalCp: 200 }))).toBe(true);
    expect(claimPasses(claim("wins"), result({ evalCp: 199 }))).toBe(false);
    expect(claimPasses(claim("wins"), result({ evalCp: undefined, mateIn: 3 }))).toBe(true);
    expect(claimPasses(claim("wins"), result({ evalCp: undefined, mateIn: -3 }))).toBe(false);
  });

  it("wins with a move uses the evaluation of that move", () => {
    expect(claimPasses(claim("wins", "d4"), result({ evalCp: 500, moveEvalCp: 150 }))).toBe(false);
    expect(claimPasses(claim("wins", "d4"), result({ evalCp: 0, moveEvalCp: 250 }))).toBe(true);
    expect(claimPasses(claim("wins", "d4"), result({ evalCp: 0, moveMateIn: 2 }))).toBe(true);
    expect(claimPasses(claim("wins", "d4"), result({ evalCp: 500 }))).toBe(false);
  });

  it("mistake: the move loses at least 100 versus the best", () => {
    expect(claimPasses(claim("mistake", "a3"), result({ evalCp: 100, moveEvalCp: 0 }))).toBe(true);
    expect(claimPasses(claim("mistake", "a3"), result({ evalCp: 100, moveEvalCp: 1 }))).toBe(false);
    expect(claimPasses(claim("mistake", "a3"), result({ mateIn: 2, evalCp: undefined, moveEvalCp: 300 }))).toBe(true);
    expect(claimPasses(claim("mistake"), result({ evalCp: 100, moveEvalCp: -500 }))).toBe(false);
  });

  it("best: the best move, or within 30 of it", () => {
    expect(claimPasses(claim("best", "e4"), result({ moveEvalCp: -999 }))).toBe(true);
    expect(claimPasses(claim("best", "d4"), result({ evalCp: 40, moveEvalCp: 10 }))).toBe(true);
    expect(claimPasses(claim("best", "d4"), result({ evalCp: 40, moveEvalCp: 9 }))).toBe(false);
    expect(claimPasses(claim("best"), result())).toBe(false);
  });

  it("equal: |eval| <= 50", () => {
    expect(claimPasses(claim("equal"), result({ evalCp: 50 }))).toBe(true);
    expect(claimPasses(claim("equal"), result({ evalCp: -50 }))).toBe(true);
    expect(claimPasses(claim("equal"), result({ evalCp: 51 }))).toBe(false);
    expect(claimPasses(claim("equal"), result({ evalCp: undefined, mateIn: 1 }))).toBe(false);
  });

  it("fails below depth 20 even if the evaluation fits", () => {
    expect(claimPasses(claim("equal"), result({ depth: 18 }))).toBe(false);
    expect(claimPasses(claim("equal"), result({ depth: 20 }))).toBe(true);
  });

  it("fails when the claim move is not valid SAN for the fen", () => {
    expect(claimPasses(claim("best", "Zz9"), result())).toBe(false);
  });
});
