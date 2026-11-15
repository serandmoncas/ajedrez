import { Rating } from "ts-fsrs";
import type { Bundle, BundleItem } from "../content/bundle-client";
import type { Puzzle } from "../content/puzzle";
import type { Progress } from "../progress/types";
import { gradeAttempt, recordPuzzle, reviewCard, type Attempt, type CardId } from "../srs/cards";
import { updateRating } from "../srs/rating";
import type { SessionStep } from "./build";

export type GuessCounts = { full: number; partial: number; miss: number };

/** What a step's screen reports: an exercise attempt, a lesson read, or a game segment. */
export type StepResult =
  | { kind: "attempt"; attempt: Attempt }
  | { kind: "seen" }
  | { kind: "game"; counts: GuessCounts };

const introduce = (p: Progress, id: string, now: Date): Progress =>
  id in p.introduced ? p : { ...p, introduced: { ...p.introduced, [id]: now.toISOString() } };

/** Glicko update against a rated puzzle; only a clean first-try solve counts as a win (like Lichess). */
function rate(p: Progress, puzzle: Puzzle, a: Attempt, now: Date): Progress {
  if (!(puzzle.rating > 0)) return p;
  const solved = a.firstTry && !a.usedHint && !a.failed;
  const { r, rd } = updateRating(p.rating, puzzle.rating, solved);
  const ratedCount = (p.rating.ratedCount ?? 0) + 1;
  return { ...p, rating: { r, rd, updatedAt: now.toISOString(), ratedCount } };
}

/** Local calendar date as YYYY-MM-DD. */
export function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Marks today's daily session as completed. */
export const completeDailySession = (p: Progress, now: Date): Progress => ({
  ...p,
  lastDailySession: localDate(now),
});

/** True when the daily session was already completed on `now`'s local date. */
export const dailySessionDone = (p: Progress, now: Date): boolean => p.lastDailySession === localDate(now);

function reviewStep(
  p: Progress,
  step: Extract<SessionStep, { block: "review" }>,
  a: Attempt,
  now: Date,
): Progress {
  const grade = gradeAttempt(a);
  const { card, puzzle } = step;
  if (card.startsWith("pattern:")) {
    if (!puzzle) return p;
    const patternId = step.patternId ?? card.slice("pattern:".length);
    const next = reviewCard(recordPuzzle(p, patternId, puzzle.id, a, now), card, grade, now);
    return rate(next, puzzle, a, now);
  }
  if (card.startsWith("puzzle:")) {
    if (!puzzle) return p;
    // Not recordPuzzle: it would add a second Again review to this same card on failure.
    // Not rated either: a repeated puzzle says little about strength.
    const next = reviewCard(p, card, grade, now);
    return { ...next, seenPuzzles: { ...next.seenPuzzles, [puzzle.id]: now.toISOString() } };
  }
  return reviewCard(p, card, grade, now); // combo: and line:
}

/** Combination ids linked to the game from either side, limited to combinations in the bundle. */
function linkedCombinations(bundle: Bundle, game: BundleItem): string[] {
  const combos = bundle.items.filter((i) => i.kind === "combination");
  const fromGame = new Set(game.links?.combinations ?? []);
  return combos
    .filter((c) => fromGame.has(c.id) || (c.links?.games ?? []).includes(game.id))
    .map((c) => c.id);
}

function gameStep(
  p: Progress,
  bundle: Bundle,
  step: Extract<SessionStep, { block: "game" }>,
  counts: GuessCounts,
  now: Date,
): Progress {
  const game = bundle.items.find((i) => i.kind === "game" && i.id === step.gameId);
  if (!game || game.kind !== "game") return p;
  const prev = p.games[game.id] ?? { segment: 0, full: 0, partial: 0, miss: 0, done: false };
  const segment = step.segment + 1;
  const done = segment >= game.segments.length;
  let next: Progress = introduce(p, game.id, now);
  next = {
    ...next,
    games: {
      ...next.games,
      [game.id]: {
        segment,
        full: prev.full + counts.full,
        partial: prev.partial + counts.partial,
        miss: prev.miss + counts.miss,
        done,
      },
    },
  };
  if (done) {
    for (const id of linkedCombinations(bundle, game)) {
      const card: CardId = `combo:${id}`;
      if (!(card in next.cards)) next = reviewCard(next, card, Rating.Good, now);
    }
  }
  return next;
}

/**
 * Applies one finished session step to the progress (pure; returns a new Progress).
 * A result that does not match the step's kind, or content missing from the bundle,
 * leaves the progress unchanged.
 */
export function applyStepResult(
  p: Progress,
  bundle: Bundle,
  step: SessionStep,
  result: StepResult,
  now: Date,
): Progress {
  switch (step.block) {
    case "review":
      return result.kind === "attempt" ? reviewStep(p, step, result.attempt, now) : p;
    case "pattern": {
      // An item with an empty pool is just introduced: no card, since it could never be reviewed.
      if (step.item === "intro") return introduce(p, step.contentId, now);
      if (result.kind !== "attempt" || !step.puzzle) return p;
      const a = result.attempt;
      const card: CardId = `pattern:${step.contentId}`;
      // The block's first puzzle is the only one that finds the card missing: it creates it.
      const isFirst = !(card in p.cards);
      let next = recordPuzzle(p, step.contentId, step.puzzle.id, a, now);
      if (isFirst) next = reviewCard(next, card, gradeAttempt(a), now);
      return rate(next, step.puzzle, a, now);
    }
    case "opening": {
      if (step.item === "intro") return introduce(p, step.openingId, now);
      if (result.kind !== "attempt") return p;
      const next = reviewCard(p, `line:${step.openingId}/${step.lineId}`, gradeAttempt(result.attempt), now);
      return introduce(next, `${step.openingId}/${step.lineId}`, now);
    }
    case "game":
      return result.kind === "game" ? gameStep(p, bundle, step, result.counts, now) : p;
  }
}
