"use client";

import { Chess } from "chess.js";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import type { Key } from "chessground/types";
import { useEffect, useRef, useState } from "react";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import { legalDests } from "@/lib/chess/dests";

export type BoardProps = {
  fen: string;
  orientation: "white" | "black";
  movable: boolean;
  lastMove?: [string, string];
  shapes?: { orig: string; dest?: string; brush: "green" | "red" | "blue" }[];
  onMove?: (uci: string) => void;
};

const PROMOTIONS = [
  { piece: "q", label: "Dama" },
  { piece: "r", label: "Torre" },
  { piece: "b", label: "Alfil" },
  { piece: "n", label: "Caballo" },
] as const;

type Pending = { orig: string; dest: string };

function isPromotion(fen: string, orig: string, dest: string): boolean {
  return new Chess(fen)
    .moves({ verbose: true })
    .some((m) => m.from === orig && m.to === dest && m.promotion !== undefined);
}

export function Board({ fen, orientation, movable, lastMove, shapes, onMove }: BoardProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  // Bumped after every user move so the board re-syncs with props even when
  // the parent keeps the same fen (wrong move).
  const [, setTick] = useState(0);
  // Mount with the real position so chessground doesn't animate from the start position.
  const initial = useRef({ fen, orientation, lastMove });

  useEffect(() => {
    if (!elementRef.current) return;
    const { fen: initialFen, orientation: initialOrientation, lastMove: initialLast } = initial.current;
    apiRef.current = Chessground(elementRef.current, {
      fen: initialFen,
      orientation: initialOrientation,
      lastMove: initialLast as [Key, Key] | undefined,
      animation: { enabled: true },
      premovable: { enabled: false },
    });
    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, []);

  // Runs after every render: the parent is the source of truth.
  useEffect(() => {
    const api = apiRef.current;
    if (!api || pending) return;
    const chess = new Chess(fen);
    const turnColor = chess.turn() === "w" ? "white" : "black";
    api.set({
      fen,
      orientation,
      turnColor,
      lastMove: lastMove as [Key, Key] | undefined,
      check: chess.inCheck(),
      movable: {
        free: false,
        color: movable ? turnColor : undefined,
        dests: legalDests(fen),
        showDests: true,
        events: {
          after: (orig, dest) => {
            if (isPromotion(fen, orig, dest)) {
              setPending({ orig, dest });
            } else {
              onMove?.(orig + dest);
              setTick((t) => t + 1);
            }
          },
        },
      },
    });
    api.setAutoShapes((shapes ?? []).map((s) => ({ orig: s.orig as Key, dest: s.dest as Key | undefined, brush: s.brush })));
  });

  function choose(piece: string) {
    if (!pending) return;
    onMove?.(pending.orig + pending.dest + piece);
    setPending(null);
    setTick((t) => t + 1);
  }

  function cancel() {
    setPending(null);
    setTick((t) => t + 1);
  }

  return (
    <div className="relative mx-auto w-full max-w-[480px] touch-none" style={{ aspectRatio: "1 / 1" }}>
      <div ref={elementRef} style={{ width: "100%", height: "100%" }} />
      {pending && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"
          onClick={cancel}
          role="dialog"
          aria-label="Elige la pieza de coronación"
        >
          <div className="flex flex-wrap justify-center gap-2 rounded bg-white p-3" onClick={(e) => e.stopPropagation()}>
            {PROMOTIONS.map(({ piece, label }) => (
              <button
                key={piece}
                type="button"
                aria-label={label}
                className="min-h-12 min-w-20 rounded border border-neutral-400 px-3 py-2 text-base font-medium text-neutral-900"
                onClick={() => choose(piece)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
