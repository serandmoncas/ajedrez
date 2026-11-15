"use client";

import { useState } from "react";
import { Board } from "@/components/Board";
import { uciToSan } from "./chess-utils";
import { playLineMove, startLine, type LineState } from "@/lib/exercises/line";
import { toSpanishSan } from "@/lib/notation";
import type { Opening } from "@/lib/content/schema";
import type { Attempt } from "@/lib/srs/cards";

type Props = {
  opening: Pick<Opening, "lines">;
  lineId: string;
  onDone: (a: Attempt) => void;
  now?: () => number;
};

export function LineRunner({ opening, lineId, onDone, now = Date.now }: Props) {
  const line = opening.lines.find((l) => l.id === lineId);
  if (!line) return <p>No se encontró la línea.</p>;
  return <LineBoard line={line} onDone={onDone} now={now} />;
}

type LineProps = {
  line: Opening["lines"][number];
  onDone: (a: Attempt) => void;
  now: () => number;
};

function LineBoard({ line, onDone, now }: LineProps) {
  const [state, setState] = useState<LineState>(() => startLine(line.moves, line.side));
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [userMoves, setUserMoves] = useState(0);
  const [message, setMessage] = useState("Juega la línea de memoria.");

  if (!started) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{line.name}</h2>
        <p>{line.idea}</p>
        <button
          type="button"
          onClick={() => {
            setStartedAt(now());
            setStarted(true);
          }}
          className="min-h-12 rounded bg-[var(--accent)] px-4 py-2 font-semibold text-white"
        >
          Empezar
        </button>
      </div>
    );
  }

  function onMove(uci: string) {
    if (state.done) return;
    const san = uciToSan(state.fen, uci);
    if (!san) return;
    const { state: next, result, expected } = playLineMove(state, line.moves, san, line.side);
    const moves = userMoves + 1;
    setUserMoves(moves);
    setState(next);
    if (result === "wrong") {
      setMessage(
        expected
          ? `Esa no es. La jugada de la línea era ${toSpanishSan(expected)}.`
          : "Esa no es la jugada de la línea.",
      );
      return;
    }
    setMessage("¡Bien!");
    if (result === "done") {
      setMessage("¡Línea completa!");
      onDone({
        firstTry: next.mistakes === 0,
        usedHint: false,
        failed: false,
        seconds: Math.max(0, (now() - startedAt) / 1000),
        userMoves: moves,
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{line.name}</h2>
      <Board
        fen={state.fen}
        orientation={line.side === "w" ? "white" : "black"}
        movable={!state.done}
        onMove={onMove}
      />
      <p role="status" className="text-center text-lg">
        {message}
      </p>
    </div>
  );
}
