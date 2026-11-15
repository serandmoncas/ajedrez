import { describe, expect, it } from "vitest";
import { legalDests } from "./dests";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("legalDests", () => {
  it("returns the 10 origins of the start position", () => {
    expect(legalDests(START).size).toBe(10);
  });

  it("maps g1 to f3 and h3", () => {
    expect([...(legalDests(START).get("g1") ?? [])].sort()).toEqual(["f3", "h3"]);
  });

  it("returns an empty map when there are no legal moves", () => {
    // Fool's mate, white is checkmated
    const mated = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
    expect(legalDests(mated).size).toBe(0);
  });
});
