import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Bundle, BundleItem } from "@/lib/content/bundle-client";
import { createMemoryStore } from "@/lib/progress/store";
import { emptyProgress, type Progress, type SerializedCard } from "@/lib/progress/types";
import CapabilitiesPage from "./page";

const now = new Date("2026-11-15T10:00:00.000Z");
const item = (x: Record<string, unknown>) => x as unknown as BundleItem;
const bundle: Bundle = {
  version: "t",
  items: [
    item({ kind: "pattern", id: "p1", title: "Clavada", order: 1 }),
    item({ kind: "technique", id: "p2", title: "Rayos X", order: 2 }),
    item({ kind: "opening", id: "o1", title: "Italiana", order: 1, lines: [{ id: "a" }, { id: "b" }] }),
    item({ kind: "game", id: "g1", title: "La Inmortal", order: 1 }),
    item({ kind: "game", id: "g2", title: "La Siempreviva", order: 2 }),
  ],
  puzzles: {},
};

const card = (stability: number): SerializedCard => ({
  due: now.toISOString(),
  stability,
  difficulty: 5,
  scheduled_days: 1,
  learning_steps: 0,
  reps: 3,
  lapses: 0,
  state: 2,
});

function progress(): Progress {
  const p = emptyProgress(now);
  p.cards = { "pattern:p1": card(30), "pattern:p2": card(2), "line:o1/a": card(25), "line:o1/b": card(3) };
  p.patternResults = { p1: [true, true, true], p2: [true] };
  p.games = {
    g1: { segment: 2, full: 3, partial: 2, miss: 1, done: true },
    g2: { segment: 1, full: 1, partial: 0, miss: 0, done: false },
  };
  p.rating = { r: 1234.6, rd: 120, updatedAt: now.toISOString() };
  return p;
}

const opened = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/lib/content/bundle-client", () => ({ fetchBundle: async () => bundle }));
vi.mock("@/lib/progress/open-store", () => ({ openStore: async () => opened.value }));

describe("Capacidades", () => {
  it("shows mastered patterns, opening lines, finished games and the rounded rating", async () => {
    opened.value = { store: createMemoryStore(progress()), persistent: true };
    render(<CapabilitiesPage />);
    expect(await screen.findByText("Patrones dominados: 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Italiana: 1 de 2 líneas dominadas")).toBeInTheDocument();
    // Partial guesses count as half: (3 + 1) / 6 = 67 %.
    expect(screen.getByText("La Inmortal: 67 % de acierto")).toBeInTheDocument();
    expect(screen.queryByText(/La Siempreviva/)).toBeNull();
    expect(screen.getByText("Rating estimado: 1235")).toBeInTheDocument();
    expect(screen.queryByText(/racha/i)).toBeNull();
    expect(screen.queryByText(/puntos/i)).toBeNull();
    expect(screen.queryByText("Tu progreso no se guardará en este modo")).toBeNull();
  });

  it("warns when progress cannot be stored", async () => {
    opened.value = { store: createMemoryStore(), persistent: false };
    render(<CapabilitiesPage />);
    expect(await screen.findByText("Tu progreso no se guardará en este modo")).toBeInTheDocument();
  });
});
