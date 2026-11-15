import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { boardMock } from "./board-mock";
import { PuzzleRunner } from "./PuzzleRunner";

vi.mock("@/components/Board", async () => ({ Board: (await import("./board-mock")).MockBoard }));

const FEN = "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1";
const setup = () => {
  const onDone = vi.fn();
  render(<PuzzleRunner fen={FEN} moves={["a1a8"]} themes={["backRankMate"]} opponentFirst={false} onDone={onDone} />);
  return onDone;
};
const move = (uci: string) => act(() => boardMock.props!.onMove!(uci));

describe("PuzzleRunner", () => {
  it("solving on the first try reports firstTry", () => {
    const onDone = setup();
    move("a1a8");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ firstTry: true, usedHint: false, failed: false, userMoves: 1 }));
  });

  it("a wrong move then the right one is not first try and keeps the fen", () => {
    const onDone = setup();
    move("a1a2");
    expect(onDone).not.toHaveBeenCalled();
    expect(boardMock.props!.fen).toBe(FEN);
    move("a1a8");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ firstTry: false, userMoves: 2 }));
  });

  it("using a hint sets usedHint", () => {
    const onDone = setup();
    fireEvent.click(screen.getByRole("button", { name: "Pista" }));
    move("a1a8");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ usedHint: true }));
  });

  it("showing the solution fails and waits for Continuar", () => {
    const onDone = setup();
    fireEvent.click(screen.getByRole("button", { name: "Ver solución" }));
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pista" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ failed: true }));
  });

  it("measures seconds with the injected clock", () => {
    const onDone = vi.fn();
    let t = 1000;
    render(<PuzzleRunner fen={FEN} moves={["a1a8"]} themes={[]} opponentFirst={false} onDone={onDone} now={() => t} />);
    t = 6000;
    move("a1a8");
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ seconds: 5 }));
  });
});
