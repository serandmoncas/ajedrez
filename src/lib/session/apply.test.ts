import { Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import type { Bundle, BundleItem, BundlePuzzle } from "../content/bundle-client";
import { emptyProgress, type Progress } from "../progress/types";
import { gradeAttempt, reviewCard, type Attempt } from "../srs/cards";
import { applyStepResult } from "./apply";

const now = new Date("2026-11-15T10:00:00.000Z");
const iso = now.toISOString();
const item = (x: Record<string, unknown>) => x as unknown as BundleItem;
const pz = (id: string, rating: number): BundlePuzzle => ({
  id,
  fen: "",
  moves: [],
  rating,
  themes: [],
  opponentFirst: true,
});

const bundle: Bundle = {
  version: "t",
  items: [
    item({ kind: "pattern", id: "p1", order: 1, themes: ["t1"] }),
    item({ kind: "combination", id: "c1", order: 1, links: { games: ["g1"] } }),
    item({ kind: "combination", id: "c2", order: 2 }),
    item({ kind: "combination", id: "c3", order: 3 }),
    item({ kind: "opening", id: "o1", order: 1, lines: [{ id: "a" }] }),
    item({ kind: "game", id: "g1", order: 1, segments: [{}, {}], links: { combinations: ["c2"] } }),
  ],
  puzzles: { t1: [pz("z1", 900), pz("z0", 0)] },
};

const clean: Attempt = { firstTry: true, usedHint: false, failed: false, seconds: 30, userMoves: 1 };
const failed: Attempt = { firstTry: false, usedHint: false, failed: true, seconds: 30, userMoves: 1 };
const attempt = (a: Attempt) => ({ kind: "attempt" as const, attempt: a });
const fresh = (): Progress => emptyProgress(now);
const sameCard = (p: Progress, id: string, expected: Progress) =>
  expect(p.cards[id]).toEqual(expected.cards[id]);

describe("applyStepResult", () => {
  it("review pattern card: records the puzzle, reviews the card and updates the rating", () => {
    const p = applyStepResult(
      fresh(),
      bundle,
      { block: "review", card: "pattern:p1", patternId: "p1", puzzle: pz("z1", 900) },
      attempt(clean),
      now,
    );
    expect(p.seenPuzzles.z1).toBe(iso);
    expect(p.patternResults.p1).toEqual([true]);
    sameCard(p, "pattern:p1", reviewCard(fresh(), "pattern:p1", gradeAttempt(clean), now));
    expect(p.rating.r).toBeGreaterThan(1200);
  });

  it("rating goes up on a clean solve and down on a failure, and skips unrated puzzles", () => {
    const step = { block: "review" as const, card: "pattern:p1" as const, patternId: "p1", puzzle: pz("z1", 1300) };
    const up = applyStepResult(fresh(), bundle, step, attempt(clean), now);
    const down = applyStepResult(fresh(), bundle, step, attempt(failed), now);
    expect(up.rating.r).toBeGreaterThan(1200);
    expect(down.rating.r).toBeLessThan(1200);
    expect(up.rating.updatedAt).toBe(iso);
    const unrated = applyStepResult(
      fresh(),
      bundle,
      { ...step, puzzle: pz("z0", 0) },
      attempt(clean),
      now,
    );
    expect(unrated.rating).toEqual(fresh().rating);
  });

  it("review puzzle card: reviews it once and marks seen without recordPuzzle", () => {
    const p = applyStepResult(
      fresh(),
      bundle,
      { block: "review", card: "puzzle:z1", patternId: "p1", puzzle: pz("z1", 900) },
      attempt(failed),
      now,
    );
    expect(p.seenPuzzles.z1).toBe(iso);
    expect(p.patternResults).toEqual({});
    // A single Again review, not two.
    sameCard(p, "puzzle:z1", reviewCard(fresh(), "puzzle:z1", Rating.Again, now));
    expect(p.cards["pattern:p1"]).toBeUndefined();
  });

  it("review combo and line cards are graded", () => {
    const c = applyStepResult(fresh(), bundle, { block: "review", card: "combo:c1" }, attempt(clean), now);
    sameCard(c, "combo:c1", reviewCard(fresh(), "combo:c1", gradeAttempt(clean), now));
    const l = applyStepResult(fresh(), bundle, { block: "review", card: "line:o1/a" }, attempt(failed), now);
    sameCard(l, "line:o1/a", reviewCard(fresh(), "line:o1/a", Rating.Again, now));
  });

  it("pattern intro marks the pattern introduced", () => {
    const p = applyStepResult(fresh(), bundle, { block: "pattern", item: "intro", contentId: "p1" }, { kind: "seen" }, now);
    expect(p.introduced).toEqual({ p1: iso });
    expect(p.cards).toEqual({});
  });

  it("the first block puzzle creates the pattern card; later ones do not review it", () => {
    const step = (z: BundlePuzzle) => ({ block: "pattern" as const, item: "puzzle" as const, contentId: "p1", puzzle: z });
    const first = applyStepResult(fresh(), bundle, step(pz("z1", 900)), attempt(clean), now);
    sameCard(first, "pattern:p1", reviewCard(fresh(), "pattern:p1", gradeAttempt(clean), now));
    expect(first.seenPuzzles.z1).toBe(iso);
    expect(first.patternResults.p1).toEqual([true]);

    const later = new Date(now.getTime() + 60_000);
    const second = applyStepResult(first, bundle, step(pz("z2", 950)), attempt(failed), later);
    expect(second.cards["pattern:p1"]).toEqual(first.cards["pattern:p1"]);
    expect(second.patternResults.p1).toEqual([true, false]);
    expect(second.cards["puzzle:z2"]).toBeDefined(); // failure -> Again via recordPuzzle
  });

  it("opening intro and line", () => {
    const a = applyStepResult(
      fresh(),
      bundle,
      { block: "opening", item: "intro", openingId: "o1", lineId: "" },
      { kind: "seen" },
      now,
    );
    expect(a.introduced).toEqual({ o1: iso });
    const b = applyStepResult(a, bundle, { block: "opening", item: "line", openingId: "o1", lineId: "a" }, attempt(clean), now);
    expect(b.introduced).toEqual({ o1: iso, "o1/a": iso });
    sameCard(b, "line:o1/a", reviewCard(fresh(), "line:o1/a", gradeAttempt(clean), now));
  });

  it("game segments accumulate counts and completing the game creates linked combo cards", () => {
    const seg0 = applyStepResult(
      fresh(),
      bundle,
      { block: "game", gameId: "g1", segment: 0 },
      { kind: "game", counts: { full: 2, partial: 1, miss: 0 } },
      now,
    );
    expect(seg0.games.g1).toEqual({ segment: 1, full: 2, partial: 1, miss: 0, done: false });
    expect(seg0.introduced.g1).toBe(iso);
    expect(Object.keys(seg0.cards)).toEqual([]);

    const later = new Date(now.getTime() + 86_400_000);
    const seg1 = applyStepResult(
      seg0,
      bundle,
      { block: "game", gameId: "g1", segment: 1 },
      { kind: "game", counts: { full: 1, partial: 0, miss: 3 } },
      later,
    );
    expect(seg1.games.g1).toEqual({ segment: 2, full: 3, partial: 1, miss: 3, done: true });
    expect(seg1.introduced.g1).toBe(iso); // first segment date kept
    sameCard(seg1, "combo:c1", reviewCard(fresh(), "combo:c1", Rating.Good, later));
    sameCard(seg1, "combo:c2", reviewCard(fresh(), "combo:c2", Rating.Good, later));
    expect(seg1.cards["combo:c3"]).toBeUndefined();
  });

  it("completing a game keeps an existing combo card", () => {
    const start = reviewCard(fresh(), "combo:c1", Rating.Again, now);
    const p = applyStepResult(
      { ...start, games: { g1: { segment: 1, full: 0, partial: 0, miss: 0, done: false } } },
      bundle,
      { block: "game", gameId: "g1", segment: 1 },
      { kind: "game", counts: { full: 1, partial: 0, miss: 0 } },
      now,
    );
    expect(p.cards["combo:c1"]).toEqual(start.cards["combo:c1"]);
    expect(p.cards["combo:c2"]).toBeDefined();
  });

  it("a game missing from the bundle leaves progress unchanged", () => {
    const p = fresh();
    expect(
      applyStepResult(p, bundle, { block: "game", gameId: "gone", segment: 0 }, { kind: "game", counts: { full: 1, partial: 0, miss: 0 } }, now),
    ).toBe(p);
  });

  it("a result of the wrong kind for the step leaves progress unchanged", () => {
    const p = fresh();
    expect(applyStepResult(p, bundle, { block: "review", card: "combo:c1" }, { kind: "seen" }, now)).toBe(p);
  });

  it("does not mutate the input", () => {
    const p = fresh();
    const snapshot = structuredClone(p);
    applyStepResult(p, bundle, { block: "review", card: "pattern:p1", patternId: "p1", puzzle: pz("z1", 900) }, attempt(clean), now);
    expect(p).toEqual(snapshot);
  });
});
