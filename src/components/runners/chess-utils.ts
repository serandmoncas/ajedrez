import { Chess, type PieceSymbol } from "chess.js";

/** Converts a UCI move to SAN in the given position; null when illegal. */
export function uciToSan(fen: string, uci: string): string | null {
  try {
    const m = new Chess(fen).move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? (uci[4] as PieceSymbol) : undefined,
    });
    return m.san;
  } catch {
    return null;
  }
}

/** Applies a UCI move (queen when a pawn promotes without a letter); returns the new fen. */
export function applyUciFen(fen: string, uci: string): string {
  const chess = new Chess(fen);
  const to = uci.slice(2, 4);
  const piece = chess.get(uci.slice(0, 2) as never);
  const promotes = piece?.type === "p" && (to[1] === "8" || to[1] === "1");
  chess.move({
    from: uci.slice(0, 2),
    to,
    promotion: uci.length > 4 ? (uci[4] as PieceSymbol) : promotes ? "q" : undefined,
  });
  return chess.fen();
}
