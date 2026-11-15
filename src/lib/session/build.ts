import type {
  Bundle,
  BundleItem,
  BundlePuzzle,
} from "../content/bundle-client";
import type { Puzzle } from "../content/puzzle";
import type { Progress } from "../progress/types";
import { dueCards, type CardId } from "../srs/cards";
import { nextPuzzleForPattern } from "../srs/picker";
import {
  MINUTES,
  PATTERN_PUZZLES,
  SESSION_BUDGET,
  SESSION_CAP_MINUTES,
} from "./config";

export type SessionStep =
  | { block: "review"; card: CardId; patternId?: string; puzzle?: Puzzle }
  | {
      block: "pattern";
      item: "intro" | "puzzle";
      contentId: string;
      puzzle?: Puzzle;
    }
  | {
      block: "opening";
      item: "intro" | "line";
      openingId: string;
      lineId: string;
    }
  | { block: "game"; gameId: string; segment: number };

export type SessionPlan = {
  steps: SessionStep[];
  estimatedMinutes: number;
  newMaterial: boolean;
};

type Themed = Extract<BundleItem, { kind: "pattern" | "technique" }>;
type OpeningItem = Extract<BundleItem, { kind: "opening" }>;
type GameItem = Extract<BundleItem, { kind: "game" }>;
type ReviewStep = Extract<SessionStep, { block: "review" }>;

const byOrder = <T extends { order: number; id: string }>(a: T, b: T) =>
  a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Union (deduplicated by id) of the puzzles of the item's themes and its custom positions. */
function puzzlePool(bundle: Bundle, item: Themed): BundlePuzzle[] {
  const seen = new Set<string>();
  const pool: BundlePuzzle[] = [];
  for (const key of [...(item.themes ?? []), `custom:${item.id}`]) {
    for (const z of bundle.puzzles[key] ?? []) {
      if (seen.has(z.id)) continue;
      seen.add(z.id);
      pool.push(z);
    }
  }
  return pool;
}

function validCardIds(bundle: Bundle): Set<CardId> {
  const ids = new Set<CardId>();
  for (const item of bundle.items) {
    if (item.kind === "pattern" || item.kind === "technique")
      ids.add(`pattern:${item.id}`);
    else if (item.kind === "combination") ids.add(`combo:${item.id}`);
    else if (item.kind === "opening") {
      for (const l of item.lines) ids.add(`line:${item.id}/${l.id}`);
    }
  }
  for (const list of Object.values(bundle.puzzles)) {
    for (const z of list) ids.add(`puzzle:${z.id}`);
  }
  return ids;
}

type Review = { step: ReviewStep; minutes: number };

/** Due review steps, most overdue first. */
function reviewSteps(
  bundle: Bundle,
  p: Progress,
  now: Date,
): { reviews: Review[]; used: Set<string> } {
  const themed = bundle.items.filter(
    (i): i is Themed => i.kind === "pattern" || i.kind === "technique",
  );
  const pools = new Map(themed.map((t) => [t.id, puzzlePool(bundle, t)]));
  const puzzleById = new Map<string, BundlePuzzle>();
  for (const list of Object.values(bundle.puzzles)) {
    for (const z of list) if (!puzzleById.has(z.id)) puzzleById.set(z.id, z);
  }
  const orderedThemed = [...themed].sort(byOrder);

  const due = dueCards(p, now, validCardIds(bundle));
  // Puzzle ids already in the session; seeded with the due `puzzle:` cards so a pattern
  // card never serves a puzzle that is reviewed on its own.
  const used = new Set<string>();
  for (const { id } of due) {
    if (id.startsWith("puzzle:") && puzzleById.has(id.slice(7)))
      used.add(id.slice(7));
  }

  const out: Review[] = [];
  for (const { id } of due) {
    const [kind, rest] = [
      id.slice(0, id.indexOf(":")),
      id.slice(id.indexOf(":") + 1),
    ];
    if (kind === "pattern") {
      const pool = (pools.get(rest) ?? []).filter((z) => !used.has(z.id));
      const puzzle = nextPuzzleForPattern(p, pool, now);
      if (!puzzle) continue; // stays due for the next session
      used.add(puzzle.id);
      out.push({
        step: { block: "review", card: id, patternId: rest, puzzle },
        minutes: MINUTES.reviewStep,
      });
    } else if (kind === "puzzle") {
      const puzzle = puzzleById.get(rest);
      if (!puzzle) continue;
      const owner = orderedThemed.find((t) =>
        pools.get(t.id)?.some((z) => z.id === rest),
      );
      out.push({
        step: {
          block: "review",
          card: id,
          ...(owner ? { patternId: owner.id } : {}),
          puzzle,
        },
        minutes: MINUTES.reviewStep,
      });
    } else if (kind === "line") {
      out.push({
        step: { block: "review", card: id },
        minutes: MINUTES.reviewLine,
      });
    } else {
      out.push({
        step: { block: "review", card: id },
        minutes: MINUTES.reviewStep,
      });
    }
  }
  return { reviews: out, used };
}

/** Keeps the most overdue reviews that fit in `limit` minutes (order preserved). */
function fitReviews(reviews: Review[], limit: number): Review[] {
  const kept: Review[] = [];
  let used = 0;
  for (const r of reviews) {
    if (used + r.minutes > limit) continue;
    kept.push(r);
    used += r.minutes;
  }
  return kept;
}

const sum = (rs: Review[]) => rs.reduce((t, r) => t + r.minutes, 0);

type Block = { steps: SessionStep[]; minutes: number };

/** New pattern block with up to `maxPuzzles` practice puzzles; null if nothing to teach. */
function patternBlock(
  bundle: Bundle,
  p: Progress,
  now: Date,
  used: Set<string>,
) {
  const next = bundle.items
    .filter((i): i is Themed => i.kind === "pattern" || i.kind === "technique")
    .sort(byOrder)
    .find((i) => !(i.id in p.introduced));
  if (!next) return null;
  const pool = puzzlePool(bundle, next).filter((z) => !used.has(z.id));
  return (maxPuzzles: number): Block => {
    const steps: SessionStep[] = [
      { block: "pattern", item: "intro", contentId: next.id },
    ];
    const remaining = [...pool];
    for (let n = 0; n < maxPuzzles; n++) {
      const puzzle = nextPuzzleForPattern(p, remaining, now);
      if (!puzzle) break;
      remaining.splice(remaining.indexOf(puzzle as BundlePuzzle), 1);
      steps.push({
        block: "pattern",
        item: "puzzle",
        contentId: next.id,
        puzzle,
      });
    }
    return {
      steps,
      minutes: MINUTES.intro + (steps.length - 1) * MINUTES.puzzle,
    };
  };
}

/** Opening block: the first unintroduced line of the first opening that has one. */
function openingBlock(bundle: Bundle, p: Progress): Block | null {
  const openings = bundle.items.filter(
    (i): i is OpeningItem => i.kind === "opening",
  );
  for (const o of [...openings].sort(byOrder)) {
    const line = o.lines.find((l) => !(`${o.id}/${l.id}` in p.introduced));
    if (!line) continue;
    const steps: SessionStep[] = [];
    let minutes = MINUTES.line;
    if (!(o.id in p.introduced)) {
      // The intro step is about the opening as a whole, so it carries no line id.
      steps.push({
        block: "opening",
        item: "intro",
        openingId: o.id,
        lineId: "",
      });
      minutes += MINUTES.intro;
    }
    steps.push({
      block: "opening",
      item: "line",
      openingId: o.id,
      lineId: line.id,
    });
    return { steps, minutes };
  }
  return null;
}

/** Game in progress, else the first game (by order) never started. */
function gameBlock(bundle: Bundle, p: Progress): Block | null {
  const games = bundle.items
    .filter((i): i is GameItem => i.kind === "game")
    .sort(byOrder);
  const game =
    games.find((g) => g.id in p.games && !p.games[g.id].done) ??
    games.find((g) => !(g.id in p.games));
  if (!game) return null;
  return {
    steps: [
      {
        block: "game",
        gameId: game.id,
        segment: p.games[game.id]?.segment ?? 0,
      },
    ],
    minutes: MINUTES.gameSegment,
  };
}

export function buildSession(
  bundle: Bundle,
  p: Progress,
  now: Date,
  opts: { extra?: boolean; allowNew?: boolean } = {},
): SessionPlan {
  const { reviews, used } = reviewSteps(bundle, p, now);
  const reviewOnly = (list: Review[]): SessionPlan => ({
    steps: list.map((r) => r.step),
    estimatedMinutes: sum(list),
    newMaterial: false,
  });

  const R = sum(reviews);
  if ((opts.extra && !opts.allowNew) || R > SESSION_CAP_MINUTES) {
    return reviewOnly(fitReviews(reviews, SESSION_CAP_MINUTES));
  }

  const pattern = patternBlock(bundle, p, now, used);
  const opening = openingBlock(bundle, p);
  const game = gameBlock(bundle, p);

  // Empty blocks donate their budget to review; review overflow then borrows from
  // pattern, opening and game, in that order.
  let allowance = SESSION_BUDGET.review;
  if (!pattern) allowance += SESSION_BUDGET.pattern;
  if (!opening) allowance += SESSION_BUDGET.opening;
  if (!game) allowance += SESSION_BUDGET.game;
  let excess = Math.max(0, R - allowance);
  const remainingOf = (budget: number) => {
    const borrowed = Math.min(excess, budget);
    excess -= borrowed;
    return budget - borrowed;
  };

  const blocks: Block[] = [];
  if (pattern) {
    const remaining = remainingOf(SESSION_BUDGET.pattern);
    const puzzles = Math.min(
      PATTERN_PUZZLES,
      Math.floor(remaining - MINUTES.intro),
    );
    const full = pattern(PATTERN_PUZZLES);
    const hasPuzzles = full.steps.length > 1;
    if (!hasPuzzles) {
      if (remaining >= full.minutes) blocks.push(full);
    } else if (puzzles >= 1) {
      blocks.push(pattern(puzzles));
    }
  }
  if (opening && remainingOf(SESSION_BUDGET.opening) >= opening.minutes)
    blocks.push(opening);
  if (game && remainingOf(SESSION_BUDGET.game) >= game.minutes)
    blocks.push(game);

  const steps = [
    ...reviews.map((r) => r.step),
    ...blocks.flatMap((b) => b.steps),
  ];
  const estimatedMinutes = R + blocks.reduce((t, b) => t + b.minutes, 0);
  return { steps, estimatedMinutes, newMaterial: blocks.length > 0 };
}
