import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { openStore } from "./open-store";
import type { ProgressStore } from "./store";

describe("openStore", () => {
  it("uses IndexedDB when it opens", async () => {
    const { persistent } = await openStore();
    expect(persistent).toBe(true);
  });

  it("falls back to a working memory store when IndexedDB fails", async () => {
    const broken = () => ({ load: () => Promise.reject(new Error("blocked")) }) as unknown as ProgressStore;
    const { store, persistent } = await openStore(broken);
    expect(persistent).toBe(false);
    const p = await store.load();
    await store.save({ ...p, introduced: { x: p.rating.updatedAt } });
    expect((await store.load()).introduced).toHaveProperty("x");
  });
});

describe("openStore persistence", () => {
  it("asks the browser to keep the data when IndexedDB opens, ignoring failures", async () => {
    const { vi } = await import("vitest");
    const persist = vi.fn(() => Promise.reject(new Error("no")));
    vi.stubGlobal("navigator", { ...navigator, storage: { persist } });
    const { persistent } = await openStore();
    expect(persistent).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
