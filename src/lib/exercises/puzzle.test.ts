import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { hint, playPuzzleMove, startPuzzle } from "./puzzle";

const csv = readFileSync(
  path.join(__dirname, "../../../scripts/lib/__fixtures__/puzzles.csv"),
  "utf8",
);
const row = csv.split("\n").find((l) => l.startsWith("0LIDX,"))!.split(",");
const realFen = row[1];
const realMoves = row[2].split(" ");
const realThemes = row[7].split(" ");

describe("real Lichess puzzle (backRankMate)", () => {
  it("applies the opponent move first and orients to the solver", () => {
    const s = startPuzzle(realFen, realMoves, { opponentFirst: true });
    expect(s.index).toBe(1);
    expect(s.orientation).toBe("black"); // white played e1b1, black solves
    expect(new Chess(s.fen).turn()).toBe("b");
    expect(s.fen).not.toBe(realFen);
  });

  it("solves it, auto-replies, and ends on mate", () => {
    let s = startPuzzle(realFen, realMoves, { opponentFirst: true });
    const r1 = playPuzzleMove(s, realMoves, "b2b1");
    expect(r1.result).toBe("correct");
    expect(r1.reply).toBe("a1b1");
    expect(r1.state.index).toBe(3);
    s = r1.state;
    const r2 = playPuzzleMove(s, realMoves, "b8b1");
    expect(r2.result).toBe("solved");
    expect(r2.state.done && r2.state.solved).toBe(true);
    expect(new Chess(r2.state.fen).isCheckmate()).toBe(true);
  });

  it("wrong move keeps the position and counts a mistake", () => {
    const s = startPuzzle(realFen, realMoves, { opponentFirst: true });
    const r = playPuzzleMove(s, realMoves, "b2a2");
    expect(r.result).toBe("wrong");
    expect(r.state.fen).toBe(s.fen);
    expect(r.state.mistakes).toBe(1);
    expect(r.state.done).toBe(false);
    expect(playPuzzleMove(s, realMoves, "a1a1").result).toBe("wrong"); // illegal
  });

  it("hints: theme in Spanish, then the piece to move", () => {
    const s = startPuzzle(realFen, realMoves, { opponentFirst: true });
    const h1 = hint(s, realMoves, realThemes);
    expect(h1.text).toBe("Busca: mate del pasillo");
    expect(h1.state.hintLevel).toBe(1);
    const h2 = hint(h1.state, realMoves, realThemes);
    expect(h2.text).toBe("Mueve la dama de b2");
    expect(h2.state.hintLevel).toBe(2);
    expect(hint(h2.state, realMoves, realThemes).state.hintLevel).toBe(2);
  });
});

describe("hint wording", () => {
  it("knight, queen, pawn and unknown themes", () => {
    const fen = "6k1/8/8/8/8/5N2/8/3QK3 w - - 0 1";
    const s = startPuzzle(fen, ["f3e5"], { opponentFirst: false });
    expect(hint(s, ["f3e5"], ["fork"]).text).toBe("Busca: horquilla");
    expect(hint({ ...s, hintLevel: 1 }, ["f3e5"], []).text).toBe("Mueve el caballo de f3");
    expect(hint({ ...s, hintLevel: 1 }, ["d1d8"], []).text).toBe("Mueve la dama de d1");
    expect(hint(s, ["f3e5"], ["unknownTheme"]).text).toBe("Busca la mejor jugada");
  });
});

describe("promotion", () => {
  const fen = "8/4P2k/8/8/8/8/8/K7 b - - 0 1";
  const moves = ["h7h6", "e7e8q", "h6h5", "e8e5"];
  const start = () => startPuzzle(fen, moves, { opponentFirst: true });

  it("accepts the expected promotion piece", () => {
    const r = playPuzzleMove(start(), moves, "e7e8q");
    expect(r.result).toBe("correct");
    expect(r.reply).toBe("h6h5");
  });
  it("rejects a different promotion piece", () => {
    const r = playPuzzleMove(start(), moves, "e7e8r");
    expect(r.result).toBe("wrong");
    expect(r.state.mistakes).toBe(1);
  });
  it("treats a missing promotion letter as queen", () => {
    expect(playPuzzleMove(start(), moves, "e7e8").result).toBe("correct");
  });
});

describe("mate tolerance on the last step", () => {
  const fen = "6k1/5ppp/8/8/8/8/8/R3R1K1 w - - 0 1";
  it("accepts either mating move", () => {
    const s = startPuzzle(fen, ["a1a8"], { opponentFirst: false });
    expect(playPuzzleMove(s, ["a1a8"], "a1a8").result).toBe("solved");
    expect(playPuzzleMove(s, ["a1a8"], "e1e8").result).toBe("solved");
    expect(playPuzzleMove(s, ["a1a8"], "a1a7").result).toBe("wrong");
  });
  it("does not apply before the last step", () => {
    const m = ["a1a8", "g8h7", "e1e7"];
    const s = startPuzzle(fen, m, { opponentFirst: false });
    expect(playPuzzleMove(s, m, "e1e8").result).toBe("wrong"); // mate is tolerated only on the last step
  });
});
