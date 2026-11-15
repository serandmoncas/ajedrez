import { describe, expect, it } from "vitest";
import type {
  Bundle,
  BundleItem,
  BundlePuzzle,
} from "../content/bundle-client";
import { emptyProgress, type Progress } from "../progress/types";
import { buildSession, type SessionStep } from "./build";

const now = new Date("2026-11-15T10:00:00.000Z");
const DAY = 86_400_000;

const pz = (id: string, rating: number): BundlePuzzle => ({
  id,
  fen: "",
  moves: [],
  rating,
  themes: [],
  opponentFirst: true,
});
const item = (x: Record<string, unknown>) => x as unknown as BundleItem;

function makeBundle(): Bundle {
  return {
    version: "t",
    items: [
      item({ kind: "pattern", id: "p1", order: 1, themes: ["t1"] }),
      item({ kind: "technique", id: "p2", order: 2, themes: ["t2"] }),
      item({ kind: "combination", id: "c1", order: 1 }),
      item({
        kind: "opening",
        id: "o1",
        order: 1,
        lines: [{ id: "a" }, { id: "b" }],
      }),
      item({ kind: "game", id: "g1", order: 1, segments: [{}, {}, {}] }),
      item({ kind: "game", id: "g2", order: 2, segments: [{}] }),
    ],
    puzzles: {
      t1: [pz("z3", 1500), pz("z1", 700), pz("z2", 900), pz("z4", 1700)],
      t2: [pz("y1", 800)],
    },
  };
}

function withDue(p: Progress, id: string, daysOverdue: number): Progress {
  const due = new Date(now.getTime() - daysOverdue * DAY).toISOString();
  p.cards[id] = {
    due,
    stability: 1,
    difficulty: 5,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: 2,
  };
  return p;
}

const puzzleIds = (steps: SessionStep[]) =>
  steps.flatMap((s) => ("puzzle" in s && s.puzzle ? [s.puzzle.id] : []));
const blocksOf = (steps: { block: string }[]) =>
  new Set(steps.map((s) => s.block));
const allIntroduced = (p: Progress): Progress => {
  const t = now.toISOString();
  p.introduced = { p1: t, p2: t, o1: t, "o1/a": t, "o1/b": t };
  // Learned patterns have a (not yet due) review card.
  withDue(p, "pattern:p1", -10);
  withDue(p, "pattern:p2", -10);
  return p;
};

describe("buildSession", () => {
  it("empty progress has pattern, opening and game within 30 min", () => {
    const plan = buildSession(makeBundle(), emptyProgress(now), now);
    expect(blocksOf(plan.steps)).toEqual(
      new Set(["pattern", "opening", "game"]),
    );
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(30);
    expect(plan.newMaterial).toBe(true);
    const pattern = plan.steps.filter((s) => s.block === "pattern");
    expect(pattern.map((s) => (s as { item: string }).item)).toEqual([
      "intro",
      "puzzle",
      "puzzle",
      "puzzle",
    ]);
    const ids = pattern.flatMap((s) =>
      s.block === "pattern" && s.puzzle ? [s.puzzle.id] : [],
    );
    expect(ids).toEqual(["z1", "z2", "z3"]);
    expect(plan.steps.find((s) => s.block === "opening")).toMatchObject({
      item: "intro",
    });
  });

  it("500 overdue cards give a review-only session capped at 30 min, most overdue first", () => {
    const bundle = makeBundle();
    bundle.puzzles.big = Array.from({ length: 500 }, (_, i) =>
      pz(`b${i}`, 1000),
    );
    const p = emptyProgress(now);
    for (let i = 0; i < 500; i++) withDue(p, `puzzle:b${i}`, i + 1);
    const plan = buildSession(bundle, p, now);
    expect(plan.steps.every((s) => s.block === "review")).toBe(true);
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(30);
    expect(plan.newMaterial).toBe(false);
    expect(plan.steps[0]).toMatchObject({ card: "puzzle:b499" });
    expect(plan.steps).toHaveLength(30);
  });

  it("12 min of review drops pattern before opening", () => {
    const bundle = makeBundle();
    bundle.puzzles.many = Array.from({ length: 12 }, (_, i) =>
      pz(`m${i}`, 1000),
    );
    const p = emptyProgress(now);
    for (let i = 0; i < 12; i++) withDue(p, `puzzle:m${i}`, 1 + i);
    const plan = buildSession(bundle, p, now);
    const blocks = blocksOf(plan.steps);
    expect(blocks.has("pattern")).toBe(false);
    expect(blocks.has("opening")).toBe(true);
    expect(blocks.has("game")).toBe(true);
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(30);
  });

  it("cuts pattern puzzles from 3 down to 1 when review borrows part of its time", () => {
    const bundle = makeBundle();
    bundle.puzzles.many = Array.from({ length: 10 }, (_, i) =>
      pz(`m${i}`, 1000),
    );
    const p = emptyProgress(now);
    for (let i = 0; i < 10; i++) withDue(p, `puzzle:m${i}`, 1 + i);
    // excess 2 -> pattern has 3 left -> intro + 1 puzzle
    const plan = buildSession(bundle, p, now);
    expect(plan.steps.filter((s) => s.block === "pattern")).toHaveLength(2);
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(30);
  });

  it("everything introduced and games done: no pattern block, only review", () => {
    const p = allIntroduced(emptyProgress(now));
    p.games = {
      g1: { segment: 3, full: 3, partial: 0, miss: 0, done: true },
      g2: { segment: 1, full: 1, partial: 0, miss: 0, done: true },
    };
    withDue(p, "combo:c1", 2);
    const plan = buildSession(makeBundle(), p, now);
    expect(plan.steps.map((s) => s.block)).toEqual(["review"]);
    expect(plan.newMaterial).toBe(false);
  });

  it("allIntroduced alone leaves only the game block", () => {
    const plan = buildSession(
      makeBundle(),
      allIntroduced(emptyProgress(now)),
      now,
    );
    expect(blocksOf(plan.steps)).toEqual(new Set(["game"]));
  });

  it("extra: true gives only review without new material", () => {
    const p = withDue(emptyProgress(now), "combo:c1", 1);
    const plan = buildSession(makeBundle(), p, now, { extra: true });
    expect(plan.steps.every((s) => s.block === "review")).toBe(true);
    expect(plan.newMaterial).toBe(false);
  });

  it("extra with allowNew behaves as a normal session", () => {
    const plan = buildSession(makeBundle(), emptyProgress(now), now, {
      extra: true,
      allowNew: true,
    });
    expect(plan.newMaterial).toBe(true);
  });

  it("ignores cards whose content no longer exists", () => {
    const p = withDue(emptyProgress(now), "line:apertura-borrada/x", 3);
    withDue(p, "puzzle:ghost", 3);
    withDue(p, "pattern:ghost", 3);
    const plan = buildSession(makeBundle(), p, now);
    expect(plan.steps.some((s) => s.block === "review")).toBe(false);
  });

  it("continues a game in progress with its next 0-based segment", () => {
    const p = emptyProgress(now);
    p.games = { g1: { segment: 2, full: 2, partial: 0, miss: 0, done: false } };
    const plan = buildSession(makeBundle(), p, now);
    expect(plan.steps.find((s) => s.block === "game")).toEqual({
      block: "game",
      gameId: "g1",
      segment: 2,
    });
  });

  it("starts the next game once the first is done", () => {
    const p = emptyProgress(now);
    p.games = { g1: { segment: 3, full: 3, partial: 0, miss: 0, done: true } };
    const plan = buildSession(makeBundle(), p, now);
    expect(plan.steps.find((s) => s.block === "game")).toMatchObject({
      gameId: "g2",
      segment: 0,
    });
  });

  it("opening: skips intro when the opening is introduced and picks the next line", () => {
    const p = emptyProgress(now);
    p.introduced = { o1: now.toISOString(), "o1/a": now.toISOString() };
    const plan = buildSession(makeBundle(), p, now);
    expect(plan.steps.filter((s) => s.block === "opening")).toEqual([
      { block: "opening", item: "line", openingId: "o1", lineId: "b" },
    ]);
  });

  it("pattern whose pool is empty gets only its intro", () => {
    const bundle = makeBundle();
    bundle.puzzles = {};
    const plan = buildSession(bundle, emptyProgress(now), now);
    expect(plan.steps.filter((s) => s.block === "pattern")).toEqual([
      { block: "pattern", item: "intro", contentId: "p1" },
    ]);
  });

  it("review steps: pattern card gets a puzzle, puzzle card gets its owning pattern, dedup pool", () => {
    const bundle = makeBundle();
    bundle.puzzles["custom:p1"] = [pz("z1", 700), pz("c1", 650)];
    const p = allIntroduced(emptyProgress(now));
    withDue(p, "pattern:p1", 5);
    withDue(p, "puzzle:y1", 4);
    withDue(p, "pattern:p2", 3);
    const plan = buildSession(bundle, p, now);
    expect(plan.steps[0]).toMatchObject({
      card: "pattern:p1",
      patternId: "p1",
    });
    expect((plan.steps[0] as { puzzle?: { id: string } }).puzzle?.id).toBe(
      "c1",
    );
    expect(plan.steps[1]).toMatchObject({ card: "puzzle:y1", patternId: "p2" });
    // pattern:p2's only puzzle (y1) is already used by its due puzzle card: step skipped
    expect(plan.steps.filter((x) => x.block === "review")).toHaveLength(2);
    expect(puzzleIds(plan.steps)).toEqual(["c1", "y1"]);
  });

  it("line cards cost 1.5 minutes", () => {
    const p = allIntroduced(emptyProgress(now));
    p.games = {
      g1: { segment: 3, full: 3, partial: 0, miss: 0, done: true },
      g2: { segment: 1, full: 1, partial: 0, miss: 0, done: true },
    };
    withDue(p, "line:o1/a", 1);
    expect(buildSession(makeBundle(), p, now).estimatedMinutes).toBe(1.5);
  });
  it("two due pattern cards sharing a theme get different puzzles", () => {
    const bundle = makeBundle();
    bundle.items.push(
      item({ kind: "pattern", id: "p3", order: 3, themes: ["t1"] }),
    );
    const p = allIntroduced(emptyProgress(now));
    p.introduced.p3 = now.toISOString();
    withDue(p, "pattern:p1", 5);
    withDue(p, "pattern:p3", 4);
    const ids = puzzleIds(buildSession(bundle, p, now).steps);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("new-pattern block excludes puzzles already used by due reviews", () => {
    const p = emptyProgress(now);
    withDue(p, "puzzle:z1", 3);
    withDue(p, "pattern:p2", 2); // p2 not introduced is irrelevant: card is due
    const ids = puzzleIds(buildSession(makeBundle(), p, now).steps);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((i) => i === "z1")).toHaveLength(1);
  });

  describe("introduced pattern without a review card", () => {
    const patternSteps = (steps: SessionStep[]) =>
      steps.filter((s) => s.block === "pattern");

    it("is served again without its intro (app closed after the intro)", () => {
      const p = emptyProgress(now);
      p.introduced = { p1: now.toISOString() };
      const plan = buildSession(makeBundle(), p, now);
      const steps = patternSteps(plan.steps);
      expect(steps.map((s) => (s as { item: string }).item)).toEqual([
        "puzzle",
        "puzzle",
        "puzzle",
      ]);
      expect(steps.every((s) => s.block === "pattern" && s.contentId === "p1")).toBe(true);
      expect(puzzleIds(steps)).toEqual(["z1", "z2", "z3"]);
    });

    it("costs no intro minutes", () => {
      const p = emptyProgress(now);
      p.introduced = { p1: now.toISOString() };
      const bundle = makeBundle();
      bundle.items = bundle.items.filter((i) => i.id !== "p2");
      const withIntro = buildSession(bundle, emptyProgress(now), now);
      const without = buildSession(bundle, p, now);
      expect(withIntro.estimatedMinutes - without.estimatedMinutes).toBe(2);
    });

    it("an introduced pattern with a card is skipped for the next new one", () => {
      const p = emptyProgress(now);
      p.introduced = { p1: now.toISOString() };
      withDue(p, "pattern:p1", -10);
      const steps = patternSteps(buildSession(makeBundle(), p, now).steps);
      expect(steps[0]).toEqual({ block: "pattern", item: "intro", contentId: "p2" });
      expect(puzzleIds(steps)).toEqual(["y1"]);
    });

    it("with an empty pool it is not selected again", () => {
      const bundle = makeBundle();
      delete bundle.puzzles.t1;
      const p = emptyProgress(now);
      p.introduced = { p1: now.toISOString() };
      const steps = patternSteps(buildSession(bundle, p, now).steps);
      expect(steps[0]).toEqual({ block: "pattern", item: "intro", contentId: "p2" });
    });

    it("whose puzzles are all used by today's reviews gets no empty block, and returns next session", () => {
      const p = emptyProgress(now);
      p.introduced = { p1: now.toISOString() };
      for (const id of ["z1", "z2", "z3", "z4"]) withDue(p, `puzzle:${id}`, 1);
      const today = buildSession(makeBundle(), p, now);
      expect(patternSteps(today.steps)).toEqual([]);

      // Next session: the puzzle cards were reviewed (no longer due).
      for (const id of ["z1", "z2", "z3", "z4"]) withDue(p, `puzzle:${id}`, -3);
      const next = patternSteps(buildSession(makeBundle(), p, now).steps);
      expect(next.length).toBeGreaterThan(0);
      expect(next.every((s) => s.block === "pattern" && s.item === "puzzle" && s.contentId === "p1")).toBe(true);
    });
  });
});
