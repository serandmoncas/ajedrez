import { Chess } from "chess.js";

export type LineState = { fen: string; ply: number; mistakes: number; done: boolean };

export const normalizeSan = (san: string): string => san.replace(/[+#!?]/g, "");

// `moves` is the SAN line from the start position (needed to auto-play white's first move
// when the user plays black).
export function startLine(moves: string[], side: "w" | "b"): LineState {
  const chess = new Chess();
  let ply = 0;
  if (side === "b" && moves.length > 0) {
    chess.move(moves[0]);
    ply = 1;
  }
  return { fen: chess.fen(), ply, mistakes: 0, done: ply >= moves.length };
}

export function playLineMove(
  s: LineState,
  moves: string[],
  san: string,
  side: "w" | "b",
): { state: LineState; result: "correct" | "wrong" | "done"; expected?: string } {
  const userParity = side === "w" ? 0 : 1;
  if (s.done || s.ply % 2 !== userParity) return { state: s, result: s.done ? "done" : "wrong" };
  const expected = moves[s.ply];
  if (normalizeSan(san) !== normalizeSan(expected)) {
    return { state: { ...s, mistakes: s.mistakes + 1 }, result: "wrong", expected };
  }
  const chess = new Chess(s.fen);
  chess.move(expected);
  let ply = s.ply + 1;
  if (ply < moves.length) {
    chess.move(moves[ply]);
    ply += 1;
  }
  const done = ply >= moves.length;
  return {
    state: { ...s, fen: chess.fen(), ply, done },
    result: done ? "done" : "correct",
  };
}
