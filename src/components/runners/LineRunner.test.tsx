import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { boardMock } from "./board-mock";
import { LineRunner } from "./LineRunner";

vi.mock("@/components/Board", async () => ({ Board: (await import("./board-mock")).MockBoard }));

const opening = {
  lines: [
    { id: "l1", name: "Italiana", side: "w" as const, moves: ["e4", "e5", "Nf3", "Nc6"], idea: "Desarrollo rápido." },
    { id: "l2", name: "Con negras", side: "b" as const, moves: ["e4", "e5", "Nf3", "Nc6"], idea: "Simetría." },
  ],
};
const move = (uci: string) => act(() => boardMock.props!.onMove!(uci));
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("LineRunner", () => {
  it("shows the idea before starting, then plays the line and reports on Continuar", () => {
    const onDone = vi.fn();
    render(<LineRunner opening={opening} lineId="l1" onDone={onDone} />);
    expect(screen.getByText("Desarrollo rápido.")).toBeInTheDocument();
    click("Empezar");
    move("e2e4");
    expect(boardMock.props!.lastMove).toEqual(["e7", "e5"]);
    move("g1f3");
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("¡Línea completa!");
    // The final auto-played reply is on the board.
    expect(boardMock.props!.lastMove).toEqual(["b8", "c6"]);
    expect(boardMock.props!.movable).toBe(false);
    click("Continuar");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ firstTry: true, userMoves: 2 }));
  });

  it("freezes the seconds when the line is complete", () => {
    const onDone = vi.fn();
    let t = 0;
    render(<LineRunner opening={opening} lineId="l1" onDone={onDone} now={() => t} />);
    t = 1000;
    click("Empezar");
    t = 5000;
    move("e2e4");
    move("g1f3");
    t = 90000;
    click("Continuar");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ seconds: 4 }));
  });

  it("as black, the auto-played first move is shown as last move", () => {
    render(<LineRunner opening={opening} lineId="l2" onDone={vi.fn()} />);
    click("Empezar");
    expect(boardMock.props!.lastMove).toEqual(["e2", "e4"]);
  });

  it("a wrong move shows the expected move in Spanish and counts as a mistake", () => {
    const onDone = vi.fn();
    render(<LineRunner opening={opening} lineId="l1" onDone={onDone} />);
    click("Empezar");
    move("d2d4");
    expect(screen.getByRole("status")).toHaveTextContent("e4");
    move("e2e4");
    move("g1f3");
    click("Continuar");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ firstTry: false, userMoves: 3 }));
  });

  it("Ver solución shows the rest of the line in Spanish and fails on Continuar", () => {
    const onDone = vi.fn();
    render(<LineRunner opening={opening} lineId="l1" onDone={onDone} />);
    click("Empezar");
    move("e2e4");
    click("Ver solución");
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByText(/Solución: .*Cf3/)).toBeInTheDocument();
    click("Continuar");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ failed: true }));
  });

  it("marks failed when mistakes reach max(2, ceil(required/2))", () => {
    const onDone = vi.fn();
    render(<LineRunner opening={opening} lineId="l1" onDone={onDone} />);
    click("Empezar");
    move("d2d4");
    move("d2d3");
    move("e2e4");
    move("g1f3");
    click("Continuar");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ failed: true }));
  });

  it("demoFirst: steps through the line move by move, then Practicar starts the drill and the clock", () => {
    const onDone = vi.fn();
    let t = 0;
    render(<LineRunner opening={opening} lineId="l1" onDone={onDone} demoFirst now={() => t} />);
    expect(screen.getByText("Desarrollo rápido.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Empezar" })).toBeNull();
    expect(boardMock.props!.movable).toBe(false);
    click("Siguiente jugada");
    expect(boardMock.props!.lastMove).toEqual(["e2", "e4"]);
    expect(screen.getByText("1. e4")).toBeInTheDocument();
    click("Siguiente jugada");
    click("Siguiente jugada");
    click("Siguiente jugada");
    expect(screen.getByText("1. e4 e5 2. Cf3 Cc6")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Siguiente jugada" })).toBeNull();
    t = 10_000;
    click("Practicar");
    expect(boardMock.props!.movable).toBe(true);
    t = 13_000;
    move("e2e4");
    move("g1f3");
    click("Continuar");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ seconds: 3, firstTry: true }));
  });
});
