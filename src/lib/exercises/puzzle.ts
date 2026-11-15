import { Chess, type PieceSymbol } from "chess.js";
import { THEMES_ES } from "./themes-es";

export type PuzzleState = {
  fen: string;
  orientation: "white" | "black";
  /** Index into `moves` of the next move the USER must play. */
  index: number;
  mistakes: number;
  hintLevel: 0 | 1 | 2;
  done: boolean;
  solved: boolean;
};

type Parsed = { from: string; to: string; promotion?: PieceSymbol };

function parseUci(uci: string): Parsed {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? (uci[4] as PieceSymbol) : undefined,
  };
}

// Applies a UCI move; a pawn reaching the last rank without a piece letter promotes to a queen.
function applyUci(chess: Chess, uci: string): string | null {
  const p = parseUci(uci);
  const piece = chess.get(p.from as never);
  const lastRank = p.to[1] === "8" || p.to[1] === "1";
  const promotion = p.promotion ?? (piece?.type === "p" && lastRank ? "q" : undefined);
  try {
    const m = chess.move({ from: p.from, to: p.to, promotion });
    return m.from + m.to + (m.promotion ?? "");
  } catch {
    return null;
  }
}

function canonicalUci(fen: string, uci: string): string {
  const c = new Chess(fen);
  return applyUci(c, uci) ?? uci;
}

export function startPuzzle(
  fen: string,
  moves: string[],
  opts: { opponentFirst: boolean },
): PuzzleState {
  const chess = new Chess(fen);
  if (opts.opponentFirst) applyUci(chess, moves[0]);
  return {
    fen: chess.fen(),
    orientation: chess.turn() === "w" ? "white" : "black",
    index: opts.opponentFirst ? 1 : 0,
    mistakes: 0,
    hintLevel: 0,
    done: false,
    solved: false,
  };
}

export function playPuzzleMove(
  s: PuzzleState,
  moves: string[],
  uci: string,
): { state: PuzzleState; result: "correct" | "wrong" | "solved"; reply?: string } {
  if (s.done) return { state: s, result: s.solved ? "solved" : "wrong" };
  const wrong = () => ({ state: { ...s, mistakes: s.mistakes + 1 }, result: "wrong" as const });

  const chess = new Chess(s.fen);
  const played = applyUci(chess, uci);
  if (!played) return wrong();

  const isLast = s.index + 1 >= moves.length;
  const expected = canonicalUci(s.fen, moves[s.index]);
  if (played !== expected && !(isLast && chess.isCheckmate())) return wrong();

  if (isLast) {
    return {
      state: { ...s, fen: chess.fen(), index: s.index + 1, done: true, solved: true },
      result: "solved",
    };
  }
  const reply = canonicalUci(chess.fen(), moves[s.index + 1]);
  applyUci(chess, moves[s.index + 1]);
  const index = s.index + 2;
  const finished = index >= moves.length;
  return {
    state: { ...s, fen: chess.fen(), index, done: finished, solved: finished },
    result: finished ? "solved" : "correct",
    reply,
  };
}

const PIECE_ES: Record<string, string> = {
  k: "el rey",
  q: "la dama",
  r: "la torre",
  b: "el alfil",
  n: "el caballo",
  p: "el peón",
};

export function hint(
  s: PuzzleState,
  moves: string[],
  themes: string[],
): { state: PuzzleState; text: string } {
  const hintLevel: 1 | 2 = s.hintLevel === 0 ? 1 : 2;
  const state = { ...s, hintLevel };
  if (hintLevel === 1) {
    const theme = themes.find((t) => THEMES_ES[t]);
    return { state, text: theme ? `Busca: ${THEMES_ES[theme]}` : "Busca la mejor jugada" };
  }
  const from = moves[s.index].slice(0, 2);
  const piece = new Chess(s.fen).get(from as never);
  return { state, text: `Mueve ${PIECE_ES[piece?.type ?? "p"]} de ${from}` };
}
