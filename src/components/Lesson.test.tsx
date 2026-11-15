import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BundleItem } from "@/lib/content/bundle-client";
import { Lesson } from "./Lesson";

vi.mock("@/components/Board", async () => ({ Board: (await import("./runners/board-mock")).MockBoard }));

const item = {
  kind: "pattern",
  id: "fork",
  title: "Horquilla",
  html: "<p>Ataca dos piezas.</p>",
  links: { openings: ["italiana"], games: ["inmortal"] },
  examples: [{ fen: "6k1/8/8/8/8/8/8/6K1 w - - 0 1", solution: ["g1g2"], caption: "Ejemplo uno" }],
} as unknown as BundleItem;

describe("Lesson", () => {
  it("renders html, example boards, links with study status and continues", () => {
    const onContinue = vi.fn();
    render(<Lesson item={item} onContinue={onContinue} introduced={{ italiana: "2026-11-01T10:00:00.000Z" }} titles={{ italiana: "Apertura Italiana", inmortal: "La Inmortal" }} />);
    expect(screen.getByText("Ataca dos piezas.")).toBeInTheDocument();
    expect(screen.getByText("Ejemplo uno")).toBeInTheDocument();
    expect(screen.getByTestId("board")).toHaveAttribute("data-movable", "false");
    expect(screen.getByRole("link", { name: "Apertura Italiana" })).toHaveAttribute("href", "/aprender/italiana");
    expect(screen.getByText("(ya lo estudiaste)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "La Inmortal" })).toHaveAttribute("href", "/aprender/inmortal");
    expect(screen.getByText("(lo verás más adelante)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onContinue).toHaveBeenCalled();
  });

  it("never shows a bare id when a title is missing", () => {
    render(<Lesson item={item} onContinue={() => {}} titles={{}} />);
    expect(screen.queryByText("italiana")).toBeNull();
    expect(screen.getAllByRole("link", { name: "contenido" })).toHaveLength(2);
  });

  it("styles the lesson body with the .lesson class", () => {
    const { container } = render(<Lesson item={item} onContinue={() => {}} />);
    expect(container.querySelector(".lesson")?.innerHTML).toBe("<p>Ataca dos piezas.</p>");
  });

  it("an opening shows its traps with Spanish moves and the comment", () => {
    const opening = {
      kind: "opening",
      id: "italiana",
      title: "Italiana",
      html: "",
      lines: [],
      traps: [{ name: "Trampa X", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nd4"], comment: "Cuidado con e5." }],
    } as unknown as BundleItem;
    render(<Lesson item={opening} onContinue={() => {}} />);
    expect(screen.getByRole("heading", { name: "Trampa X" })).toBeInTheDocument();
    expect(screen.getByText("1. e4 e5 2. Cf3 Cc6 3. Ac4 Cd4")).toBeInTheDocument();
    expect(screen.getByText("Cuidado con e5.")).toBeInTheDocument();
  });

  it("a game shows players, year and event", () => {
    const game = {
      kind: "game",
      id: "opera",
      title: "La ópera",
      html: "<p>Historia.</p>",
      white: "Paul Morphy",
      black: "Duque",
      year: 1858,
      event: "Partida de consulta",
    } as unknown as BundleItem;
    render(<Lesson item={game} onContinue={() => {}} />);
    expect(screen.getByText("Paul Morphy – Duque, 1858 (Partida de consulta)")).toBeInTheDocument();
    expect(screen.getByText("Historia.")).toBeInTheDocument();
  });
});
