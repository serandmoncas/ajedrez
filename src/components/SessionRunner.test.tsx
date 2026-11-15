import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Bundle, BundleItem } from "@/lib/content/bundle-client";
import { createMemoryStore } from "@/lib/progress/store";
import { emptyProgress } from "@/lib/progress/types";
import { localDate } from "@/lib/session/apply";
import { reviewCard } from "@/lib/srs/cards";
import { Rating } from "ts-fsrs";
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
const click = (name: string) => act(async () => fireEvent.click(screen.getByRole("button", { name })));

describe("SessionRunner", () => {
  it("saves after each step, then ends with an extra review-only session", async () => {
    const store = createMemoryStore(emptyProgress(now));
    render(<SessionRunner bundle={bundle} store={store} now={() => now} />);

    expect(await screen.findByRole("heading", { name: "Mate del pasillo" })).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Continuar" })));
    expect((await store.load()).introduced["back-rank"]).toBe(now.toISOString());

    await screen.findByText("Encuentra la mejor jugada.");
    await move("a1a8");
    expect(screen.getByRole("status")).toHaveTextContent("¡Resuelto!");
    await click("Continuar");
    const saved = await store.load();
    expect(saved.seenPuzzles.pz1).toBe(now.toISOString());
    expect(saved.cards["pattern:back-rank"]).toBeDefined();
    expect(saved.lastDailySession).toBe(localDate(now));

    expect(await screen.findByText("Sesión terminada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
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

  it("the same day, re-entering serves review only and offers to learn something new", async () => {
    const store = createMemoryStore({ ...emptyProgress(now), lastDailySession: localDate(now) });
    render(<SessionRunner bundle={bundle} store={store} now={() => now} />);
    expect(await screen.findByText("Ya hiciste la sesión de hoy. Esto es solo repaso.")).toBeInTheDocument();
    expect(screen.getByText("No hay más repasos por ahora.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mate del pasillo" })).toBeNull();
    await click("Aprender algo nuevo");
    expect(await screen.findByRole("heading", { name: "Mate del pasillo" })).toBeInTheDocument();
  });

  it("a game shows its lesson before the first segment and a Tramo header", async () => {
    const withGame: Bundle = {
      version: "t",
      items: [
        item({
          kind: "game",
          id: "g1",
          title: "La partida",
          order: 1,
          html: "<p>Historia de la partida.</p>",
          white: "Morphy",
          black: "Duque",
          year: 1858,
          event: "Consulta",
          moves: ["e4", "e5", "Nf3"],
          side: "w",
          segments: [{ from: 1, to: 3 }],
          sources: [{ title: "x" }],
        }),
      ],
      puzzles: {},
    };
    render(<SessionRunner bundle={withGame} store={createMemoryStore(emptyProgress(now))} now={() => now} />);
    expect(await screen.findByText("Tramo 1 de 1 — La partida")).toBeInTheDocument();
    expect(screen.getByText("Historia de la partida.")).toBeInTheDocument();
    expect(screen.getByText("Morphy – Duque, 1858 (Consulta)")).toBeInTheDocument();
    await click("Continuar");
    expect(screen.getByText("Tramo 1 de 1 — La partida")).toBeInTheDocument();
    expect(screen.getByText("¿Qué jugó el maestro?")).toBeInTheDocument();
  });

  it("a combination review shows its game before and its explanation after solving", async () => {
    const withCombo: Bundle = {
      version: "t",
      items: [
        item({
          kind: "combination",
          id: "c1",
          title: "Final brillante",
          order: 1,
          html: "<p>La torre baja a a8.</p>",
          game: { white: "Morphy", black: "Duque", year: 1858, event: "Consulta" },
          fen: FEN,
          solution: ["a1a8"],
          sources: [{ title: "x" }],
        }),
      ],
      puzzles: {},
    };
    const due = reviewCard(emptyProgress(now), "combo:c1", Rating.Again, new Date(now.getTime() - 86_400_000));
    render(<SessionRunner bundle={withCombo} store={createMemoryStore(due)} now={() => now} />);
    expect(await screen.findByRole("heading", { name: "Final brillante" })).toBeInTheDocument();
    expect(screen.getByText("Morphy – Duque, 1858")).toBeInTheDocument();
    expect(screen.queryByText("La torre baja a a8.")).toBeNull();
    await move("a1a8");
    expect(screen.getByText("La torre baja a a8.")).toBeInTheDocument();
    await click("Continuar");
    expect(await screen.findByText("Sesión terminada")).toBeInTheDocument();
  });

  it("a new opening line is shown move by move before the drill", async () => {
    const withOpening: Bundle = {
      version: "t",
      items: [
        item({
          kind: "opening",
          id: "o1",
          title: "Italiana",
          order: 1,
          html: "",
          lines: [{ id: "l1", name: "Línea uno", side: "w", moves: ["e4", "e5"], idea: "i" }],
          sources: [{ title: "x" }],
        }),
      ],
      puzzles: {},
    };
    render(<SessionRunner bundle={withOpening} store={createMemoryStore(emptyProgress(now))} now={() => now} />);
    expect(await screen.findByRole("heading", { name: "Italiana" })).toBeInTheDocument();
    await click("Continuar");
    expect(screen.getByRole("button", { name: "Siguiente jugada" })).toBeInTheDocument();
  });

  it("pattern puzzles hint with the pattern's themes first", async () => {
    const store = createMemoryStore({ ...emptyProgress(now), introduced: { "back-rank": now.toISOString() } });
    const b: Bundle = {
      ...bundle,
      puzzles: { backRankMate: [{ ...bundle.puzzles.backRankMate[0], themes: ["fork", "backRankMate"] }] },
    };
    render(<SessionRunner bundle={b} store={store} now={() => now} />);
    await screen.findByText("Encuentra la mejor jugada.");
    await click("Pista");
    expect(screen.getByRole("status")).toHaveTextContent(/pasillo/i);
  });
});
