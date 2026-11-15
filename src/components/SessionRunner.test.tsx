import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Bundle, BundleItem } from "@/lib/content/bundle-client";
import { createMemoryStore } from "@/lib/progress/store";
import { emptyProgress } from "@/lib/progress/types";
import { boardMock } from "./runners/board-mock";
import { SessionRunner } from "./SessionRunner";

vi.mock("@/components/Board", async () => ({ Board: (await import("./runners/board-mock")).MockBoard }));

const FEN = "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1";
const now = new Date("2026-11-15T10:00:00.000Z");
const item = (x: Record<string, unknown>) => x as unknown as BundleItem;

const bundle: Bundle = {
  version: "t",
  items: [
    item({
      kind: "pattern",
      id: "back-rank",
      title: "Mate del pasillo",
      order: 1,
      html: "<p>El rey sin casillas.</p>",
      themes: ["backRankMate"],
      examples: [{ fen: FEN, solution: ["a1a8"] }],
      sources: [{ title: "x" }],
    }),
  ],
  puzzles: {
    backRankMate: [{ id: "pz1", fen: FEN, moves: ["a1a8"], rating: 1000, themes: ["backRankMate"], opponentFirst: false }],
  },
};

const move = (uci: string) => act(async () => boardMock.props!.onMove!(uci));

describe("SessionRunner", () => {
  it("saves after each step, then ends with an extra review-only session", async () => {
    const store = createMemoryStore(emptyProgress(now));
    render(<SessionRunner bundle={bundle} store={store} now={() => now} />);

    expect(await screen.findByRole("heading", { name: "Mate del pasillo" })).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Continuar" })));
    expect((await store.load()).introduced["back-rank"]).toBe(now.toISOString());

    await screen.findByText("Encuentra la mejor jugada.");
    await move("a1a8");
    const saved = await store.load();
    expect(saved.seenPuzzles.pz1).toBe(now.toISOString());
    expect(saved.cards["pattern:back-rank"]).toBeDefined();

    expect(await screen.findByText("Sesión terminada")).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sesión extra (solo repaso)" })));
    // Nothing is due yet right after learning it.
    expect(await screen.findByText("No hay más repasos por ahora.")).toBeInTheDocument();
  });

  it("an empty plan says there is nothing for today and offers the extra session", async () => {
    const empty: Bundle = { version: "t", items: [], puzzles: {} };
    render(<SessionRunner bundle={empty} store={createMemoryStore()} now={() => now} />);
    expect(await screen.findByText("No hay nada para hoy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sesión extra (solo repaso)" })).toBeInTheDocument();
  });
});
