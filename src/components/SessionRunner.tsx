"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Lesson } from "@/components/Lesson";
import { GuessRunner } from "@/components/runners/GuessRunner";
import { LineRunner } from "@/components/runners/LineRunner";
import { PuzzleRunner } from "@/components/runners/PuzzleRunner";
import type { Bundle, BundleItem, BundlePuzzle } from "@/lib/content/bundle-client";
import type { Puzzle } from "@/lib/content/puzzle";
import type { ProgressStore } from "@/lib/progress/store";
import type { Progress } from "@/lib/progress/types";
import type { Attempt } from "@/lib/srs/cards";
import {
  applyStepResult,
  completeDailySession,
  dailySessionDone,
  type StepResult,
} from "@/lib/session/apply";
import { buildSession, type SessionStep } from "@/lib/session/build";

type Props = { bundle: Bundle; store: ProgressStore; now?: () => Date };
/**
 * extra: review-only (or explicitly extra) run; repeat: the daily session was already done today.
 * gen distinguishes successive runs so step screens remount.
 */
type Run = { progress: Progress; steps: SessionStep[]; index: number; extra: boolean; repeat: boolean; gen: number };

export function SessionRunner({ bundle, store, now = () => new Date() }: Props) {
  const [run, setRun] = useState<Run | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const clock = useRef(now);

  useEffect(() => {
    let cancelled = false;
    store
      .load()
      .then((p) => {
        if (cancelled) return;
        // The plan is built once, at session start. Done today already: review only.
        const at = clock.current();
        const repeat = dailySessionDone(p, at);
        const steps = buildSession(bundle, p, at, repeat ? { extra: true } : {}).steps;
        setRun({ progress: p, steps, index: 0, extra: repeat, repeat, gen: 0 });
      })
      .catch(() => !cancelled && setLoadError("No se pudo cargar tu progreso."));
    return () => {
      cancelled = true;
    };
  }, [bundle, store]);

  // Saves after every step, so closing the app mid-session keeps what was done.
  async function finishStep(current: Run, step: SessionStep, result: StepResult) {
    const at = clock.current();
    let progress = applyStepResult(current.progress, bundle, step, result, at);
    const finishesDaily = !current.extra && current.index + 1 === current.steps.length;
    if (finishesDaily) progress = completeDailySession(progress, at);
    try {
      await store.save(progress);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
    setRun({ ...current, progress, index: current.index + 1 });
  }

  function startExtra(current: Run, allowNew = false) {
    const plan = buildSession(bundle, current.progress, clock.current(), { extra: true, allowNew });
    setRun({ progress: current.progress, steps: plan.steps, index: 0, extra: true, repeat: false, gen: current.gen + 1 });
  }

  if (loadError) return <p>{loadError}</p>;
  if (!run) return <p>Cargando...</p>;

  const step = run.steps[run.index];
  return (
    <div className="flex flex-col gap-4">
      {saveError && (
        <p role="alert" className="text-center">
          No se pudo guardar el último paso.
        </p>
      )}
      {run.repeat && (
        <div className="flex flex-col gap-2 rounded border p-3 text-center">
          <p>Ya hiciste la sesión de hoy. Esto es solo repaso.</p>
          <button type="button" onClick={() => startExtra(run, true)} className="min-h-12 rounded border px-4 py-2">
            Aprender algo nuevo
          </button>
        </div>
      )}
      {step ? (
        <>
          <p className="text-center text-[var(--subtle)]">
            Paso {run.index + 1} de {run.steps.length}
          </p>
          <StepView
            key={`${run.gen}-${run.index}`}
            bundle={bundle}
            step={step}
            introduced={run.progress.introduced}
            onDone={(r) => void finishStep(run, step, r)}
          />
        </>
      ) : (
        <SessionEnd run={run} onExtra={() => startExtra(run)} />
      )}
    </div>
  );
}

function SessionEnd({ run, onExtra }: { run: Run; onExtra: () => void }) {
  if (run.extra && run.steps.length === 0) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-lg">No hay más repasos por ahora.</p>
        <Link href="/" className="underline">
          Volver al inicio
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 text-center">
      <p className="text-2xl font-bold">{run.steps.length === 0 ? "No hay nada para hoy" : "Sesión terminada"}</p>
      <button
        type="button"
        onClick={onExtra}
        className="min-h-12 rounded border px-4 py-2"
      >
        Sesión extra (solo repaso)
      </button>
      <Link href="/capacidades" className="underline">
        Ver capacidades
      </Link>
      <Link href="/" className="underline">
        Volver al inicio
      </Link>
    </div>
  );
}

type StepProps = {
  bundle: Bundle;
  step: SessionStep;
  introduced: Record<string, string>;
  onDone: (r: StepResult) => void;
};

const findItem = <K extends BundleItem["kind"]>(bundle: Bundle, kind: K, id: string) =>
  bundle.items.find((i): i is Extract<BundleItem, { kind: K }> => i.kind === kind && i.id === id);

function StepView({ bundle, step, introduced, onDone }: StepProps) {
  const titles = Object.fromEntries(bundle.items.map((i) => [i.id, i.title]));
  const attempt = (a: Attempt) => onDone({ kind: "attempt", attempt: a });
  const lesson = (item: BundleItem | undefined) =>
    item ? (
      <Lesson item={item} titles={titles} introduced={introduced} onContinue={() => onDone({ kind: "seen" })} />
    ) : (
      <Missing onSkip={() => onDone({ kind: "seen" })} />
    );
  // Level-1 hints use the pattern's own themes first, then the puzzle's.
  const themesOf = (patternId: string | undefined, z: Puzzle) => {
    const owner = patternId ? bundle.items.find((i) => i.id === patternId) : undefined;
    const own = owner && (owner.kind === "pattern" || owner.kind === "technique") ? (owner.themes ?? []) : [];
    return [...new Set([...own, ...z.themes])];
  };
  const puzzle = (z: Puzzle, patternId?: string) => (
    <PuzzleRunner
      fen={z.fen}
      moves={z.moves}
      themes={themesOf(patternId, z)}
      opponentFirst={(z as Partial<BundlePuzzle>).opponentFirst ?? true}
      onDone={attempt}
    />
  );
  const line = (openingId: string, lineId: string, demoFirst = false) => {
    const opening = findItem(bundle, "opening", openingId);
    if (!opening) return <Missing onSkip={() => onDone({ kind: "seen" })} />;
    return <LineRunner opening={opening} lineId={lineId} onDone={attempt} demoFirst={demoFirst} />;
  };

  switch (step.block) {
    case "review": {
      if (step.puzzle) return puzzle(step.puzzle, step.patternId);
      if (step.card.startsWith("combo:")) {
        const combo = findItem(bundle, "combination", step.card.slice("combo:".length));
        if (!combo) return <Missing onSkip={() => onDone({ kind: "seen" })} />;
        const themes = (combo.links?.patterns ?? []).flatMap((id) => {
          const t = bundle.items.find((i) => i.id === id);
          return t && (t.kind === "pattern" || t.kind === "technique") ? (t.themes ?? []) : [];
        });
        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">{combo.title}</h1>
              <p className="text-[var(--subtle)]">
                {combo.game.white} – {combo.game.black}, {combo.game.year}
              </p>
            </div>
            <PuzzleRunner
              fen={combo.fen}
              moves={combo.solution}
              themes={themes}
              opponentFirst={false}
              onDone={attempt}
              afterSolved={<div className="lesson" dangerouslySetInnerHTML={{ __html: combo.html }} />}
            />
          </div>
        );
      }
      if (step.card.startsWith("line:")) {
        const rest = step.card.slice("line:".length);
        const slash = rest.indexOf("/");
        return line(rest.slice(0, slash), rest.slice(slash + 1));
      }
      return <Missing onSkip={() => onDone({ kind: "seen" })} />;
    }
    case "pattern":
      if (step.item === "intro") return lesson(bundle.items.find((i) => i.id === step.contentId));
      return step.puzzle ? puzzle(step.puzzle, step.contentId) : <Missing onSkip={() => onDone({ kind: "seen" })} />;
    case "opening":
      // The intro step carries lineId "": it is about the opening as a whole.
      if (step.item === "intro") return lesson(findItem(bundle, "opening", step.openingId));
      // A new line is shown move by move before it is drilled.
      return line(step.openingId, step.lineId, true);
    case "game": {
      const game = findItem(bundle, "game", step.gameId);
      if (!game || !game.segments[step.segment]) return <Missing onSkip={() => onDone({ kind: "seen" })} />;
      return (
        <GameStep
          game={game}
          segment={step.segment}
          titles={titles}
          introduced={introduced}
          onDone={(counts) => onDone({ kind: "game", counts })}
        />
      );
    }
  }
}

type GameItem = Extract<BundleItem, { kind: "game" }>;
type GameStepProps = {
  game: GameItem;
  segment: number;
  titles: Record<string, string>;
  introduced: Record<string, string>;
  onDone: (counts: { full: number; partial: number; miss: number }) => void;
};

/** A game segment, preceded by the game's lesson before the first segment. */
function GameStep({ game, segment, titles, introduced, onDone }: GameStepProps) {
  const [showIntro, setShowIntro] = useState(segment === 0);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-semibold">
        Tramo {segment + 1} de {game.segments.length} — {game.title}
      </p>
      {showIntro ? (
        <Lesson item={game} titles={titles} introduced={introduced} onContinue={() => setShowIntro(false)} />
      ) : (
        <GuessRunner game={{ ...game, body: "" }} segment={segment} onDone={onDone} />
      )}
    </div>
  );
}

function Missing({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <p>Este contenido ya no está disponible.</p>
      <button type="button" onClick={onSkip} className="min-h-12 rounded border px-4 py-2">
        Continuar
      </button>
    </div>
  );
}
