import { Chess } from "chess.js";
import type { Key } from "chessground/types";

// Legal moves in chessground's format (origin square -> destination squares).
export function legalDests(fen: string): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  for (const move of new Chess(fen).moves({ verbose: true })) {
    const from = move.from as Key;
    const list = dests.get(from);
    if (list) {
      if (!list.includes(move.to as Key)) list.push(move.to as Key);
    } else {
      dests.set(from, [move.to as Key]);
    }
  }
  return dests;
}
