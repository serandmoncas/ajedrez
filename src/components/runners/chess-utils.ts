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

/** Plays UCI moves from `fen`; returns the SAN of each and the final fen. */
export function playUciLine(fen: string, ucis: string[]): { sans: string[]; fen: string } {
  const sans: string[] = [];
  let current = fen;
  for (const uci of ucis) {
    const chess = new Chess(current);
    const to = uci.slice(2, 4);
    const piece = chess.get(uci.slice(0, 2) as never);
    const promotes = piece?.type === "p" && (to[1] === "8" || to[1] === "1");
    const m = chess.move({
      from: uci.slice(0, 2),
      to,
      promotion: uci.length > 4 ? (uci[4] as PieceSymbol) : promotes ? "q" : undefined,
    });
    sans.push(m.san);
    current = chess.fen();
  }
  return { sans, fen: current };
}
