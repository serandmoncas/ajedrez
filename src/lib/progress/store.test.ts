import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createIndexedDbStore, createMemoryStore } from "./store";
import { emptyProgress, type Progress } from "./types";

const now = new Date("2026-11-15T10:00:00.000Z");
let n = 0;
const fresh = () => createIndexedDbStore(`test-${n++}`);

function sample(): Progress {
  const p = emptyProgress(now);
  p.cards["c1"] = {
    due: now.toISOString(),
    stability: 2.5,
    difficulty: 5,
    scheduled_days: 3,
    learning_steps: 0,
    reps: 2,
    lapses: 0,
    state: 2,
    last_review: now.toISOString(),
  };
  p.seenPuzzles["p1"] = now.toISOString();
  p.patternResults["fork"] = [true, false];
  return p;
}

describe("progress store", () => {
  it("emptyProgress uses the initial rating", () => {
    expect(emptyProgress(now).rating).toEqual({ r: 1200, rd: 350, updatedAt: now.toISOString() });
  });

  it("load on an empty db returns empty progress", async () => {
    const p = await fresh().load();
    expect(p.schemaVersion).toBe(1);
    expect(p.cards).toEqual({});
    expect(p.rating.r).toBe(1200);
    expect(p.rating.rd).toBe(350);
  });

  it("save then load round-trips", async () => {
    const s = fresh();
    await s.save(sample());
    expect(await s.load()).toEqual(sample());
  });

  it("export then import into another store is equal", async () => {
    const a = fresh();
    await a.save(sample());
    const b = fresh();
    await b.importJson(await a.exportJson());
    expect(await b.load()).toEqual(sample());
  });

  it("invalid JSON throws a Spanish error and keeps saved data", async () => {
    const s = fresh();
    await s.save(sample());
    await expect(s.importJson("{")).rejects.toThrow("El respaldo no es válido");
    await expect(s.importJson("{")).rejects.toBeInstanceOf(Error);
    expect(await s.load()).toEqual(sample());
  });

  it("schema-invalid backup is rejected without writing", async () => {
    const s = fresh();
    await s.save(sample());
    await expect(s.importJson(JSON.stringify({ schemaVersion: 1, cards: 5 }))).rejects.toThrow(
      "El respaldo no es válido",
    );
    expect(await s.load()).toEqual(sample());
  });

  it.each([
    ["card due", (p: Progress) => void (p.cards["c1"].due = "banana")],
    ["card last_review", (p: Progress) => void (p.cards["c1"].last_review = "")],
    ["seenPuzzles", (p: Progress) => void (p.seenPuzzles["p1"] = "nope")],
    ["introduced", (p: Progress) => void (p.introduced["x"] = "")],
    ["rating.updatedAt", (p: Progress) => void (p.rating.updatedAt = "yesterday")],
  ])("invalid date in %s is rejected without writing", async (_n, mutate) => {
    const s = fresh();
    await s.save(sample());
    const bad = sample();
    mutate(bad);
    await expect(s.importJson(JSON.stringify(bad))).rejects.toThrow("El respaldo no es válido");
    expect(await s.load()).toEqual(sample());
  });

  it("real toISOString values round-trip through import", async () => {
    const s = fresh();
    const p = sample();
    p.introduced["x"] = new Date(1234567890123).toISOString();
    await s.importJson(JSON.stringify(p));
    expect(await s.load()).toEqual(p);
  });

  it("schemaVersion 2 is rejected without writing", async () => {
    const s = fresh();
    await s.save(sample());
    const v2 = JSON.stringify({ ...sample(), schemaVersion: 2 });
    await expect(s.importJson(v2)).rejects.toThrow(/versión 2/);
    expect(await s.load()).toEqual(sample());
  });

  it("ids unknown to the content load unchanged", async () => {
    const s = fresh();
    const p = sample();
    p.cards["gone-card"] = { ...p.cards["c1"] };
    p.seenPuzzles["removed-puzzle"] = now.toISOString();
    await s.save(p);
    expect(await s.load()).toEqual(p);
  });

  it("memory store behaves the same", async () => {
    const s = createMemoryStore();
    await s.save(sample());
    const t = createMemoryStore();
    await t.importJson(await s.exportJson());
    expect(await t.load()).toEqual(sample());
    await expect(t.importJson("nope")).rejects.toThrow("El respaldo no es válido");
  });
});
