"use client";

import { Chess } from "chess.js";
import { useState } from "react";
import { Board } from "@/components/Board";
import { uciToSan } from "./chess-utils";
import { scoreGuess, type GuessResult } from "@/lib/exercises/guess";
import { toSpanishSan } from "@/lib/notation";
import type { Game } from "@/lib/content/schema";

type Counts = { full: number; partial: number; miss: number };
type Props = {
  game: Game;
  segment: number;
  onDone: (r: Counts) => void;
};

type Squares = [string, string];
type State = {
  fen: string;
  ply: number;
  feedback: GuessResult | null;
  counts: Counts;
  lastMove?: Squares;
  /** Comment of the last auto-played opponent ply, if any. */
  autoComment?: string;
};

// Plies are 1-based; the guessing side plays odd plies when white, even when black.
const isGuessPly = (game: Game, ply: number) => (game.side === "w") === (ply % 2 === 1);

// Auto-plays the other side's plies until the next guessing ply (or past `to`).
function advance(
  game: Game,
  to: number,
  fen: string,
  ply: number,
): { fen: string; ply: number; lastMove?: Squares; autoComment?: string } {
  const chess = new Chess(fen);
  let lastMove: Squares | undefined;
  let autoComment: string | undefined;
  while (ply <= to && !isGuessPly(game, ply)) {
    const m = chess.move(game.moves[ply - 1]);
    lastMove = [m.from, m.to];
    autoComment = game.comments?.[String(ply)];
    ply += 1;
  }
  return { fen: chess.fen(), ply, lastMove, autoComment };
}

export function GuessRunner({ game, segment, onDone }: Props) {
  const seg = game.segments[segment];
  const to = Math.min(seg.to, game.moves.length);
  const [state, setState] = useState<State>(() => {
    const chess = new Chess();
    for (let i = 0; i < seg.from - 1; i++) chess.move(game.moves[i]);
    return { ...advance(game, to, chess.fen(), seg.from), feedback: null, counts: { full: 0, partial: 0, miss: 0 } };
  });

  function onMove(uci: string) {
    if (state.feedback || state.ply > to) return;
    const san = uciToSan(state.fen, uci);
    if (!san) return;
    const result = scoreGuess(game, state.ply, san);
    const chess = new Chess(state.fen);
    const m = chess.move(game.moves[state.ply - 1]);
    setState({
      fen: chess.fen(),
      ply: state.ply + 1,
      feedback: result,
      counts: { ...state.counts, [result.kind]: state.counts[result.kind] + 1 },
      lastMove: [m.from, m.to],
    });
  }

  function next() {
    const adv = advance(game, to, state.fen, state.ply);
    if (adv.ply > to) {
      onDone(state.counts);
      return;
    }
    setState({ ...state, ...adv, lastMove: adv.lastMove ?? state.lastMove, feedback: null });
  }

  const fb = state.feedback;
  const comment =
    fb?.kind === "miss" ? game.comments?.[String(state.ply - 1)] : fb?.comment;
  return (
    <div className="flex flex-col gap-4">
      <Board
        fen={state.fen}
        orientation={game.side === "w" ? "white" : "black"}
        movable={!fb}
        lastMove={state.lastMove}
        onMove={onMove}
      />
      {fb ? (
        <div role="status" className="flex flex-col gap-2 text-center">
          <p className="text-lg font-semibold">
            {fb.kind === "full" && "¡Exacto!"}
            {fb.kind === "partial" && `Buena alternativa. El maestro jugó ${toSpanishSan(fb.masterSan)}.`}
            {fb.kind === "miss" && `El maestro jugó ${toSpanishSan(fb.masterSan)}.`}
          </p>
          {comment && <p>{comment}</p>}
          <button
            type="button"
            onClick={next}
            className="min-h-12 rounded bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            Siguiente
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-center">
          {state.autoComment && <p className="text-sm text-[var(--subtle)]">{state.autoComment}</p>}
          <p role="status" className="text-lg">
            ¿Qué jugó el maestro?
          </p>
        </div>
      )}
    </div>
  );
}
