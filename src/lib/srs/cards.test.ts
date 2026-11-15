import { describe, expect, it } from "vitest";
import { Rating } from "ts-fsrs";
import { emptyProgress, type Progress } from "../progress/types";
import {
  dueCards,
  fromCard,
  gradeAttempt,
  isMastered,
  recordPuzzle,
  reviewCard,
  toCard,
  type Attempt,
  type CardId,
} from "./cards";

const now = new Date("2026-11-15T10:00:00.000Z");
const day = 86_400_000;
const base: Attempt = { firstTry: true, usedHint: false, failed: false, seconds: 30, userMoves: 3 };

describe("gradeAttempt", () => {
  it("failed -> Again", () => {
    expect(gradeAttempt({ ...base, failed: true, usedHint: true })).toBe(Rating.Again);
  });
  it("hint -> Hard", () => {
    expect(gradeAttempt({ ...base, usedHint: true })).toBe(Rating.Hard);
  });
  it("not first try -> Hard", () => {
    expect(gradeAttempt({ ...base, firstTry: false })).toBe(Rating.Hard);
  });
  it("first try and fast (<= 10 s per move) -> Easy", () => {
    expect(gradeAttempt({ ...base, seconds: 30, userMoves: 3 })).toBe(Rating.Easy);
  });
  it("first try but slow -> Good", () => {
    expect(gradeAttempt({ ...base, seconds: 31, userMoves: 3 })).toBe(Rating.Good);
  });
  it("tolerates zero user moves", () => {
    expect(gradeAttempt({ ...base, seconds: 5, userMoves: 0 })).toBe(Rating.Easy);
  });
});

describe("toCard / fromCard", () => {
  it("round-trips a reviewed card", () => {
    const p = reviewCard(emptyProgress(now), "pattern:fork", Rating.Good, now);
    const s = p.cards["pattern:fork"];
    expect(fromCard(toCard(s))).toEqual(s);
    expect(toCard(s).due).toBeInstanceOf(Date);
  });
});

describe("reviewCard", () => {
  it("creates the card and schedules it in the future on Good", () => {
    const p = reviewCard(emptyProgress(now), "pattern:fork", Rating.Good, now);
    expect(new Date(p.cards["pattern:fork"].due).getTime()).toBeGreaterThan(now.getTime());
    expect(p.cards["pattern:fork"].reps).toBe(1);
  });
  it("does not mutate its input", () => {
    const input = emptyProgress(now);
    const snapshot = structuredClone(input);
    reviewCard(input, "pattern:fork", Rating.Good, now);
    expect(input).toEqual(snapshot);
  });
});

describe("dueCards", () => {
  it("sorts by overdueDays descending and ignores ids not in validIds", () => {
    const p: Progress = emptyProgress(now);
    const mk = (offsetDays: number) => ({
      ...fromCard({
        due: new Date(now.getTime() + offsetDays * day),
        stability: 1,
        difficulty: 5,
        scheduled_days: 1,
        learning_steps: 0,
        reps: 1,
        lapses: 0,
        state: 2,
      }),
    });
    p.cards["pattern:a"] = mk(-1);
    p.cards["pattern:b"] = mk(-5);
    p.cards["combo:borrada"] = mk(-9);
    p.cards["pattern:future"] = mk(3);
    const valid = new Set<CardId>(["pattern:a", "pattern:b", "pattern:future"]);
    const due = dueCards(p, now, valid);
    expect(due.map((d) => d.id)).toEqual(["pattern:b", "pattern:a"]);
    expect(due[0].overdueDays).toBeCloseTo(5);
    expect(due[0].due).toBeInstanceOf(Date);
  });
});

describe("recordPuzzle", () => {
  it("marks the puzzle seen and creates puzzle:<id> on failure", () => {
    const p = recordPuzzle(emptyProgress(now), "fork", "p1", { ...base, failed: true }, now);
    expect(p.seenPuzzles.p1).toBe(now.toISOString());
    expect(p.cards["puzzle:p1"]).toBeDefined();
    expect(p.patternResults.fork).toEqual([false]);
  });
  it("records a clean first-time solve in patternResults and creates no card", () => {
    const p = recordPuzzle(emptyProgress(now), "fork", "p1", base, now);
    expect(p.patternResults.fork).toEqual([true]);
    expect(p.cards["puzzle:p1"]).toBeUndefined();
  });
  it("a hint counts as not-clean", () => {
    const p = recordPuzzle(emptyProgress(now), "fork", "p1", { ...base, usedHint: true }, now);
    expect(p.patternResults.fork).toEqual([false]);
  });
  it("does not add to patternResults when the puzzle was seen before", () => {
    const p1 = recordPuzzle(emptyProgress(now), "fork", "p1", base, now);
    const later = new Date(now.getTime() + day);
    const p2 = recordPuzzle(p1, "fork", "p1", { ...base, failed: true }, later);
    expect(p2.patternResults.fork).toEqual([true]);
    expect(p2.seenPuzzles.p1).toBe(later.toISOString());
    expect(p2.cards["puzzle:p1"]).toBeDefined();
  });
  it("keeps only the last 10 results", () => {
    let p = emptyProgress(now);
    for (let i = 0; i < 12; i++) {
      p = recordPuzzle(p, "fork", `p${i}`, { ...base, failed: i < 2 }, now);
    }
    expect(p.patternResults.fork).toHaveLength(10);
    expect(p.patternResults.fork.every(Boolean)).toBe(true);
  });
  it("does not mutate its input", () => {
    const input = emptyProgress(now);
    const snapshot = structuredClone(input);
    recordPuzzle(input, "fork", "p1", { ...base, failed: true }, now);
    expect(input).toEqual(snapshot);
  });
});

describe("isMastered", () => {
  const withStability = (stability: number, results: boolean[]): Progress => {
    const p = reviewCard(emptyProgress(now), "pattern:fork", Rating.Good, now);
    p.cards["pattern:fork"] = { ...p.cards["pattern:fork"], stability };
    p.patternResults.fork = results;
    return p;
  };
  it("is false with only 2 results", () => {
    expect(isMastered(withStability(30, [true, true]), "fork", now)).toBe(false);
  });
  it("is true with 3 recent correct and enough stability", () => {
    expect(isMastered(withStability(21, [false, true, true, true]), "fork", now)).toBe(true);
  });
  it("is false with low stability", () => {
    expect(isMastered(withStability(20.9, [true, true, true]), "fork", now)).toBe(false);
  });
  it("is false when one of the last 3 is a miss", () => {
    expect(isMastered(withStability(30, [true, true, false, true]), "fork", now)).toBe(false);
  });
  it("is false without a pattern card", () => {
    expect(isMastered(emptyProgress(now), "fork", now)).toBe(false);
  });
});
