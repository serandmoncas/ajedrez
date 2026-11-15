import { describe, expect, it } from "vitest";
import { parseInfoLine } from "./uci";

describe("parseInfoLine", () => {
  it("parses a centipawn score with its pv", () => {
    expect(
      parseInfoLine("info depth 22 seldepth 30 multipv 1 score cp 145 nodes 1 pv e2e4 e7e5"),
    ).toEqual({ depth: 22, cp: 145, pv: ["e2e4", "e7e5"] });
  });

  it("parses a mate score", () => {
    expect(parseInfoLine("info depth 5 score mate -3 nodes 10 pv h7h8")).toEqual({
      depth: 5,
      mate: -3,
      pv: ["h7h8"],
    });
  });

  it("returns null for non-info lines", () => {
    expect(parseInfoLine("bestmove e2e4")).toBeNull();
  });

  it("returns null for info lines without a score", () => {
    expect(parseInfoLine("info depth 3 currmove e2e4 currmovenumber 1")).toBeNull();
  });
});
