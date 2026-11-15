import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { boardMock } from "./board-mock";
import { LineRunner } from "./LineRunner";

vi.mock("@/components/Board", async () => ({ Board: (await import("./board-mock")).MockBoard }));

const opening = {
  lines: [{ id: "l1", name: "Italiana", side: "w" as const, moves: ["e4", "e5", "Nf3", "Nc6"], idea: "Desarrollo rápido." }],
};
const move = (uci: string) => act(() => boardMock.props!.onMove!(uci));

describe("LineRunner", () => {
  it("shows the idea before starting, then plays the line", () => {
    const onDone = vi.fn();
    render(<LineRunner opening={opening} lineId="l1" onDone={onDone} />);
    expect(screen.getByText("Desarrollo rápido.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    move("e2e4");
    move("g1f3");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ firstTry: true, userMoves: 2 }));
  });

  it("a wrong move shows the expected move in Spanish and counts as a mistake", () => {
    const onDone = vi.fn();
    render(<LineRunner opening={opening} lineId="l1" onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    move("d2d4");
    expect(screen.getByRole("status")).toHaveTextContent("e4");
    move("e2e4");
    move("g1f3");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ firstTry: false, userMoves: 3 }));
  });
});
