// Pass/fail criteria for engine-checked claims. Browser-safe, no Node imports.
import { Chess } from "chess.js";
import type { Claim } from "../content/schema";

export type EngineResult = {
  claimId: string;
  fen: string;
  move?: string;
  depth: number;
  evalCp?: number; // centipawns, side to move in `fen`
  mateIn?: number; // mate for the side to move in `fen` when >= 0, against it when < 0
  bestMove: string; // UCI
  moveEvalCp?: number; // evaluation after `move`, same point of view (side to move in `fen`)
  moveMateIn?: number; // same sign convention as mateIn; 0 means `move` itself mates
};

export const MIN_DEPTH = 20;
const MATE_SCORE = 10000;

function score(cp: number | undefined, mate: number | undefined): number | undefined {
  if (mate !== undefined) return mate >= 0 ? MATE_SCORE : -MATE_SCORE;
  return cp;
}

function sanToUci(fen: string, san: string): string | undefined {
  try {
    const m = new Chess(fen).move(san);
    return m.from + m.to + (m.promotion ?? "");
  } catch {
    return undefined;
  }
}

export function claimPasses(claim: Claim, r: EngineResult): boolean {
  if (r.depth < MIN_DEPTH) return false;
  const pos = score(r.evalCp, r.mateIn);
  const move = claim.move !== undefined ? score(r.moveEvalCp, r.moveMateIn) : undefined;

  switch (claim.assert) {
    case "wins": {
      const s = claim.move !== undefined ? move : pos;
      return s !== undefined && s >= 200;
    }
    case "mistake":
      return pos !== undefined && move !== undefined && move <= pos - 100;
    case "best": {
      if (claim.move === undefined) return false;
      const uci = sanToUci(claim.fen, claim.move);
      if (uci === undefined) return false;
      if (uci === r.bestMove) return true;
      return pos !== undefined && move !== undefined && move >= pos - 30;
    }
    case "equal":
      return pos !== undefined && Math.abs(pos) <= 50;
  }
}
