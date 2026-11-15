import { describe, expect, it } from "vitest";
import { updateRating } from "./rating";

describe("updateRating (Glicko-1)", () => {
  it("raises r and lowers rd after solving an equal-rated puzzle", () => {
    const next = updateRating({ r: 1200, rd: 350 }, 1200, true);
    expect(next.r).toBeGreaterThan(1200);
    expect(next.rd).toBeLessThan(350);
  });
  it("lowers r after failing an equal-rated puzzle", () => {
    expect(updateRating({ r: 1200, rd: 350 }, 1200, false).r).toBeLessThan(1200);
  });
  it("moves less when the result was expected", () => {
    const upset = updateRating({ r: 1200, rd: 100 }, 1600, true).r - 1200;
    const expected = updateRating({ r: 1200, rd: 100 }, 800, true).r - 1200;
    expect(upset).toBeGreaterThan(expected);
  });
  it("matches a hand-computed value", () => {
    // Independent Glicko-1 calculation (q = ln10/400, puzzle RD 80, E = 0.5).
    const next = updateRating({ r: 1200, rd: 350 }, 1200, true);
    expect(next.r).toBeCloseTo(1374.95, 1);
    expect(next.rd).toBeCloseTo(250.42, 1);
  });
  it("never lets rd fall below 50", () => {
    let s = { r: 1200, rd: 60 };
    for (let i = 0; i < 200; i++) s = updateRating(s, s.r, i % 2 === 0);
    expect(s.rd).toBeGreaterThanOrEqual(50);
    expect(updateRating({ r: 1200, rd: 10 }, 1200, true).rd).toBe(50);
  });
  it("does not mutate its input", () => {
    const input = { r: 1200, rd: 350 };
    updateRating(input, 1200, true);
    expect(input).toEqual({ r: 1200, rd: 350 });
  });
});
