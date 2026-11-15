import { Chess } from "chess.js";
import type { Game } from "../content/schema";
import { normalizeSan } from "./line";

export type GuessResult = { kind: "full" | "partial" | "miss"; masterSan: string; comment?: string };

// ply is 1-based: ply N is game.moves[N - 1].
export function scoreGuess(game: Game, ply: number, guessSan: string): GuessResult {
  const masterSan = game.moves[ply - 1];
  const chess = new Chess();
  for (let i = 0; i < ply - 1; i++) chess.move(game.moves[i]);

  const key = (san: string): string | null => {
    try {
      const m = new Chess(chess.fen()).move(normalizeSan(san), { strict: true });
      return `${m.from}${m.to}${m.promotion ?? ""}`;
    } catch {
      return null;
    }
  };
  const same = (a: string, b: string): boolean => {
    if (normalizeSan(a) === normalizeSan(b)) return true;
    const ka = key(a);
    return ka !== null && ka === key(b);
  };

  if (same(guessSan, masterSan)) {
    return { kind: "full", masterSan, comment: game.comments?.[String(ply)] };
  }
  const alt = game.alternatives?.[String(ply)]?.find((a) => same(guessSan, a.san));
  if (alt) return { kind: "partial", masterSan, comment: alt.comment };
  return { kind: "miss", masterSan };
}
