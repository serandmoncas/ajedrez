/** Tunable session budgets and per-item time estimates, in minutes. */

export const SESSION_BUDGET = {
  review: 8,
  pattern: 5,
  opening: 5,
  game: 7,
} as const;
/** Hard cap for any session. */
export const SESSION_CAP_MINUTES = 30;

export const MINUTES = {
  /** One review step (puzzle, pattern or combination card). */
  reviewStep: 1,
  /** One opening line review card. */
  reviewLine: 1.5,
  /** Practice puzzle inside the new-pattern block. */
  puzzle: 1,
  /** Opening line step. */
  line: 1.5,
  /** Intro of a pattern or opening. */
  intro: 2,
  /** One game segment. */
  gameSegment: 7,
} as const;

/** Practice puzzles offered with a new pattern (cut down to 1 when time is short). */
export const PATTERN_PUZZLES = 3;
