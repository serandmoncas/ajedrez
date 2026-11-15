import { describe, expect, it } from "vitest";
import { playLineMove, startLine } from "./line";

const moves = ["e4", "e5", "Nf3", "Nc6", "Bb5"];

describe("opening line", () => {
  it("startLine as black auto-plays white's first move", () => {
    const s = startLine(moves, "b");
    expect(s.ply).toBe(1);
    expect(s.fen).toContain(" b ");
  });
  it("startLine as white starts at ply 0", () => {
    expect(startLine(moves, "w").ply).toBe(0);
  });
  it("correct move auto-plays the reply; wrong move reports expected", () => {
    let s = startLine(moves, "w");
    const bad = playLineMove(s, moves, "d4", "w");
    expect(bad.result).toBe("wrong");
    expect(bad.expected).toBe("e4");
    expect(bad.state.fen).toBe(s.fen);
    expect(bad.state.mistakes).toBe(1);
    const ok = playLineMove(s, moves, "e4", "w");
    expect(ok.result).toBe("correct");
    expect(ok.state.ply).toBe(2);
    s = ok.state;
    expect(playLineMove(s, moves, "Nf3+", "w").state.ply).toBe(4);
  });
  it("is done after the last move of the line", () => {
    let s = startLine(moves, "w");
    s = playLineMove(s, moves, "e4", "w").state;
    s = playLineMove(s, moves, "Nf3", "w").state;
    const r = playLineMove(s, moves, "Bb5", "w");
    expect(r.result).toBe("done");
    expect(r.state.done).toBe(true);
  });
  it("black side finishes when white's last move is the line's end", () => {
    const m = ["e4", "e5", "Nf3"];
    let s = startLine(m, "b");
    s = playLineMove(s, m, "e5", "b").state;
    expect(s.done).toBe(true);
  });
});
