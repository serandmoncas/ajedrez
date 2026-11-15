"use client";

import { useState } from "react";
import { Board } from "@/components/Board";
import { playSanLine, uciToSan } from "./chess-utils";
import { playLineMove, startLine, type LineState } from "@/lib/exercises/line";
import { formatMoveList, toSpanishSan } from "@/lib/notation";
import type { Opening } from "@/lib/content/schema";
import type { Attempt } from "@/lib/srs/cards";

type Props = {
  opening: Pick<Opening, "lines">;
  lineId: string;
  onDone: (a: Attempt) => void;
  now?: () => number;
  /** New lines: show the line move by move ("Ver la línea") before the drill. */
  demoFirst?: boolean;
};

export function LineRunner({ opening, lineId, onDone, now = Date.now, demoFirst = false }: Props) {
  const line = opening.lines.find((l) => l.id === lineId);
  if (!line) return <p>No se encontró la línea.</p>;
  return <LineBoard line={line} onDone={onDone} now={now} demoFirst={demoFirst} />;
}

type Line = Opening["lines"][number];
type LineProps = {
  line: Line;
  onDone: (a: Attempt) => void;
  now: () => number;
  demoFirst: boolean;
};

const orientationOf = (line: Line) => (line.side === "w" ? "white" : "black");

function LineBoard({ line, onDone, now, demoFirst }: LineProps) {
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const start = () => {
    setStartedAt(now());
    setStarted(true);
  };

  if (started) return <LineDrill line={line} onDone={onDone} now={now} startedAt={startedAt} />;
  if (demoFirst) return <LineDemo line={line} onPractice={start} />;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{line.name}</h2>
      <p>{line.idea}</p>
      <button
        type="button"
        onClick={start}
        className="min-h-12 rounded bg-[var(--accent)] px-4 py-2 font-semibold text-white"
      >
        Empezar
      </button>
    </div>
  );
}

/** "Ver la línea": steps through the whole line before practicing it. */
function LineDemo({ line, onPractice }: { line: Line; onPractice: () => void }) {
  const [shown, setShown] = useState(0);
  const { fen, lastMove } = playSanLine(line.moves.slice(0, shown));
  const finished = shown >= line.moves.length;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{line.name}</h2>
      <p className="text-[var(--subtle)]">Ver la línea</p>
      <p>{line.idea}</p>
      <Board fen={fen} orientation={orientationOf(line)} movable={false} lastMove={lastMove} />
      <p className="min-h-6 text-center">{formatMoveList(line.moves.slice(0, shown))}</p>
      <div className="flex justify-center gap-3">
        {!finished && (
          <button
            type="button"
            onClick={() => setShown((n) => n + 1)}
            className="min-h-12 rounded border px-4 py-2"
          >
            Siguiente jugada
          </button>
        )}
        {finished && (
          <button
            type="button"
            onClick={onPractice}
            className="min-h-12 rounded bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            Practicar
          </button>
        )}
      </div>
    </div>
  );
}

type DrillProps = { line: Line; onDone: (a: Attempt) => void; now: () => number; startedAt: number };

function LineDrill({ line, onDone, now, startedAt }: DrillProps) {
  const [state, setState] = useState<LineState>(() => startLine(line.moves, line.side));
  const [lastMove, setLastMove] = useState<[string, string] | undefined>(
    () => playSanLine(line.moves.slice(0, state.ply)).lastMove,
  );
  const [userMoves, setUserMoves] = useState(0);
  const [solutionText, setSolutionText] = useState<string | null>(null);
  const [message, setMessage] = useState("Juega la línea de memoria.");
  // Frozen when the line ends; reported on Continuar.
  const [result, setResult] = useState<Attempt | null>(null);

  const required = Math.ceil((line.moves.length - (line.side === "w" ? 0 : 1)) / 2);
  const maxMistakes = Math.max(2, Math.ceil(required / 2));
  const seconds = () => Math.max(0, (now() - startedAt) / 1000);

  function showSolution() {
    const rest = line.moves.slice(state.ply);
    setSolutionText(formatMoveList(rest, state.ply));
    setState({ ...state, done: true });
    setMessage("Esta era la línea.");
    setResult({ firstTry: false, usedHint: false, failed: true, seconds: seconds(), userMoves });
  }

  function onMove(uci: string) {
    if (state.done) return;
    const san = uciToSan(state.fen, uci);
    if (!san) return;
    const { state: next, result: outcome, expected } = playLineMove(state, line.moves, san, line.side);
    const moves = userMoves + 1;
    setUserMoves(moves);
    setState(next);
    if (outcome === "wrong") {
      setMessage(
        expected
          ? `Esa no es. La jugada de la línea era ${toSpanishSan(expected)}.`
          : "Esa no es la jugada de la línea.",
      );
      return;
    }
    // Last move on the board: the auto-played reply when there was one, else the user's.
    // (Lines are at most 24 plies, so replaying from the start is cheap.)
    setLastMove(playSanLine(line.moves.slice(0, next.ply)).lastMove);
    setMessage("¡Bien!");
    if (outcome === "done") {
      setMessage("¡Línea completa!");
      setResult({
        firstTry: next.mistakes === 0,
        usedHint: false,
        failed: next.mistakes >= maxMistakes,
        seconds: seconds(),
        userMoves: moves,
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{line.name}</h2>
      <Board fen={state.fen} orientation={orientationOf(line)} movable={!state.done} lastMove={lastMove} onMove={onMove} />
      <p role="status" className="text-center text-lg">
        {message}
      </p>
      {solutionText !== null && <p className="text-center">Solución: {solutionText}</p>}
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
          <button
            type="button"
            onClick={showSolution}
            className="min-h-12 rounded border px-4 py-2"
          >
            Ver solución
          </button>
        )}
      </div>
    </div>
  );
}
