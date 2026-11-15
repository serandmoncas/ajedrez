"use client";

import { useState } from "react";
import { Board } from "@/components/Board";
import { applyUciFen } from "./chess-utils";
import { hint, playPuzzleMove, startPuzzle, type PuzzleState } from "@/lib/exercises/puzzle";
import type { Attempt } from "@/lib/srs/cards";

type Props = {
  fen: string;
  moves: string[];
  themes: string[];
  opponentFirst: boolean;
  onDone: (a: Attempt) => void;
  now?: () => number;
};

export function PuzzleRunner({ fen, moves, themes, opponentFirst, onDone, now = Date.now }: Props) {
  const [state, setState] = useState<PuzzleState>(() => startPuzzle(fen, moves, { opponentFirst }));
  const [boardFen, setBoardFen] = useState(state.fen);
  const [startedAt] = useState(() => now());
  const [userMoves, setUserMoves] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [message, setMessage] = useState("Encuentra la mejor jugada.");
  const [lastMove, setLastMove] = useState<[string, string] | undefined>();
  const [gaveUp, setGaveUp] = useState(false);

  const seconds = () => Math.max(0, (now() - startedAt) / 1000);

  function onMove(uci: string) {
    if (state.done) return;
    const { state: next, result, reply } = playPuzzleMove(state, moves, uci);
    setUserMoves((n) => n + 1);
    setState(next);
    if (result === "wrong") {
      setMessage("Esa no es. Inténtalo otra vez.");
      return;
    }
    setBoardFen(next.fen);
    const last = reply ?? uci;
    setLastMove([last.slice(0, 2), last.slice(2, 4)]);
    if (result === "solved") {
      setMessage("¡Resuelto!");
      onDone({
        firstTry: next.mistakes === 0,
        usedHint,
        failed: false,
        seconds: seconds(),
        userMoves: userMoves + 1,
      });
    } else {
      setMessage("¡Bien! Sigue.");
    }
  }

  function askHint() {
    const h = hint(state, moves, themes);
    setState(h.state);
    setUsedHint(true);
    setMessage(h.text);
  }

  function showSolution() {
    let f = state.fen;
    for (let i = state.index; i < moves.length; i++) f = applyUciFen(f, moves[i]);
    setBoardFen(f);
    setGaveUp(true);
    setState({ ...state, done: true, solved: false });
    setMessage("Esta era la solución.");
  }

  function finishGaveUp() {
    onDone({ firstTry: false, usedHint, failed: true, seconds: seconds(), userMoves });
  }

  return (
    <div className="flex flex-col gap-4">
      <Board
        fen={boardFen}
        orientation={state.orientation}
        movable={!state.done}
        lastMove={lastMove}
        onMove={onMove}
      />
      <p role="status" className="text-center text-lg">
        {message}
      </p>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          disabled={state.done}
          onClick={askHint}
          className="min-h-12 rounded border px-4 py-2 disabled:opacity-50"
        >
          Pista
        </button>
        <button
          type="button"
          disabled={state.done}
          onClick={showSolution}
          className="min-h-12 rounded border px-4 py-2 disabled:opacity-50"
        >
          Ver solución
        </button>
        {gaveUp && (
          <button
            type="button"
            onClick={finishGaveUp}
            className="min-h-12 rounded bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}
