"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Board } from "@/components/Board";
import { playUciLine } from "./chess-utils";
import { hint, playPuzzleMove, startPuzzle, type PuzzleState } from "@/lib/exercises/puzzle";
import { formatMoveList } from "@/lib/notation";
import type { Attempt } from "@/lib/srs/cards";

/** 0-based ply index of the position from the fen's fullmove number and side to move. */
function plyOf(fen: string): number {
  const [, turn, , , , fullmove] = fen.split(" ");
  const n = Math.max(1, Number(fullmove) || 1);
  return (n - 1) * 2 + (turn === "b" ? 1 : 0);
}

const squares = (uci: string): [string, string] => [uci.slice(0, 2), uci.slice(2, 4)];

type Props = {
  fen: string;
  moves: string[];
  themes: string[];
  opponentFirst: boolean;
  onDone: (a: Attempt) => void;
  now?: () => number;
  /** Delay before the opponent's first move is played on the board (opponentFirst). */
  opponentDelayMs?: number;
  /** Shown once the puzzle is over (solved or solution shown), above Continuar. */
  afterSolved?: ReactNode;
};

export function PuzzleRunner({
  fen,
  moves,
  themes,
  opponentFirst,
  onDone,
  now = Date.now,
  opponentDelayMs = 400,
  afterSolved,
}: Props) {
  const [state, setState] = useState<PuzzleState>(() => startPuzzle(fen, moves, { opponentFirst }));
  // With opponentFirst the board starts on the original position and the opponent's move is
  // played after a short delay, so the user sees it; the user can't move until then.
  const [ready, setReady] = useState(() => !opponentFirst || opponentDelayMs <= 0);
  const [boardFen, setBoardFen] = useState(() => (ready ? state.fen : fen));
  const [lastMove, setLastMove] = useState<[string, string] | undefined>(() =>
    opponentFirst && ready ? squares(moves[0]) : undefined,
  );
  const [startedAt] = useState(() => now());
  const [userMoves, setUserMoves] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [message, setMessage] = useState("Encuentra la mejor jugada.");
  const [solutionText, setSolutionText] = useState("");
  // Frozen when the puzzle ends; reported on Continuar.
  const [result, setResult] = useState<Attempt | null>(null);

  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => {
      setBoardFen(state.fen);
      setLastMove(squares(moves[0]));
      setReady(true);
    }, opponentDelayMs);
    return () => clearTimeout(id);
  }, [ready, state.fen, moves, opponentDelayMs]);

  const seconds = () => Math.max(0, (now() - startedAt) / 1000);

  function onMove(uci: string) {
    if (state.done || !ready) return;
    const { state: next, result: outcome, reply } = playPuzzleMove(state, moves, uci);
    setUserMoves((n) => n + 1);
    setState(next);
    if (outcome === "wrong") {
      setMessage("Esa no es. Inténtalo otra vez.");
      return;
    }
    setBoardFen(next.fen);
    setLastMove(squares(reply ?? uci));
    if (outcome === "solved") {
      setMessage("¡Resuelto!");
      setResult({
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
    const rest = moves.slice(state.index);
    const line = playUciLine(state.fen, rest);
    const last = rest[rest.length - 1];
    setBoardFen(line.fen);
    if (last) setLastMove(squares(last));
    setSolutionText(formatMoveList(line.sans, plyOf(state.fen)));
    setState({ ...state, done: true, solved: false });
    setMessage("Esta era la solución.");
    setResult({ firstTry: false, usedHint, failed: true, seconds: seconds(), userMoves });
  }

  return (
    <div className="flex flex-col gap-4">
      <Board
        fen={boardFen}
        orientation={state.orientation}
        movable={ready && !state.done}
        lastMove={lastMove}
        onMove={onMove}
      />
      <p role="status" className="text-center text-lg">
        {message}
      </p>
      {solutionText && <p className="text-center">Solución: {solutionText}</p>}
      {result && afterSolved}
      <div className="flex justify-center gap-3">
        {result ? (
          <button
            type="button"
            onClick={() => onDone(result)}
            className="min-h-12 rounded bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            Continuar
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={!ready}
              onClick={askHint}
              className="min-h-12 rounded border px-4 py-2 disabled:opacity-50"
            >
              Pista
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={showSolution}
              className="min-h-12 rounded border px-4 py-2 disabled:opacity-50"
            >
              Ver solución
            </button>
          </>
        )}
      </div>
    </div>
  );
}
