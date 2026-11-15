import { Rating, fsrs, createEmptyCard, type Card, type Grade, type State } from "ts-fsrs";
import type { Progress, SerializedCard } from "../progress/types";
import {
  FAST_SECONDS_PER_MOVE,
  MASTERY_RECENT,
  MASTERY_STABILITY_DAYS,
  PATTERN_RESULTS_MAX,
} from "./config";

export type CardId =
  | `pattern:${string}`
  | `puzzle:${string}`
  | `line:${string}/${string}`
  | `combo:${string}`;

export type Attempt = {
  firstTry: boolean;
  usedHint: boolean;
  failed: boolean;
  seconds: number;
  userMoves: number;
};

const scheduler = fsrs();
const DAY_MS = 86_400_000;

export function toCard(s: SerializedCard): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    ...(s.last_review !== undefined ? { last_review: new Date(s.last_review) } : {}),
  };
}

export function fromCard(c: Card): SerializedCard {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    ...(c.last_review ? { last_review: c.last_review.toISOString() } : {}),
  };
}

export function gradeAttempt(a: Attempt): Grade {
  if (a.failed) return Rating.Again;
  if (a.usedHint || !a.firstTry) return Rating.Hard;
  if (a.seconds / Math.max(1, a.userMoves) <= FAST_SECONDS_PER_MOVE) return Rating.Easy;
  return Rating.Good;
}

/** Reviews the card (creating it if missing). Returns a new Progress. */
export function reviewCard(p: Progress, id: CardId, rating: Grade, now: Date): Progress {
  const existing = p.cards[id];
  const card = existing ? toCard(existing) : createEmptyCard(now);
  const next = scheduler.next(card, now, rating).card;
  return { ...p, cards: { ...p.cards, [id]: fromCard(next) } };
}

/** Due cards (due <= now) whose id is still valid, most overdue first. */
export function dueCards(
  p: Progress,
  now: Date,
  validIds: Set<CardId>,
): { id: CardId; due: Date; overdueDays: number }[] {
  const out: { id: CardId; due: Date; overdueDays: number }[] = [];
  for (const [key, card] of Object.entries(p.cards)) {
    const id = key as CardId;
    if (!validIds.has(id)) continue;
    const due = new Date(card.due);
    if (due.getTime() > now.getTime()) continue;
    out.push({ id, due, overdueDays: (now.getTime() - due.getTime()) / DAY_MS });
  }
  return out.sort((a, b) => b.overdueDays - a.overdueDays);
}

/**
 * Marks the puzzle seen; a failure creates/reviews `puzzle:<id>` with Again;
 * a first-ever attempt pushes its clean-solve result into patternResults.
 * The pattern card itself is reviewed separately by the session code.
 */
export function recordPuzzle(
  p: Progress,
  patternId: string,
  puzzleId: string,
  a: Attempt,
  now: Date,
): Progress {
  const wasSeen = puzzleId in p.seenPuzzles;
  let next: Progress = { ...p, seenPuzzles: { ...p.seenPuzzles, [puzzleId]: now.toISOString() } };
  if (a.failed) next = reviewCard(next, `puzzle:${puzzleId}`, Rating.Again, now);
  if (!wasSeen) {
    const clean = a.firstTry && !a.usedHint && !a.failed;
    const results = [...(next.patternResults[patternId] ?? []), clean].slice(-PATTERN_RESULTS_MAX);
    next = { ...next, patternResults: { ...next.patternResults, [patternId]: results } };
  }
  return next;
}

/** Mastered: stable pattern card and the last results all clean. */
export function isMastered(p: Progress, patternId: string, now: Date): boolean {
  void now;
  const card = p.cards[`pattern:${patternId}`];
  if (!card || card.stability < MASTERY_STABILITY_DAYS) return false;
  const recent = (p.patternResults[patternId] ?? []).slice(-MASTERY_RECENT);
  return recent.length === MASTERY_RECENT && recent.every(Boolean);
}
