import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { boardMock } from "./board-mock";
import { PuzzleRunner } from "./PuzzleRunner";

vi.mock("@/components/Board", async () => ({ Board: (await import("./board-mock")).MockBoard }));

const FEN = "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1";
const MATED = "R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1";
// Opera game, move 16: 16.Db8+ Cxb8 17.Td8#
const OPERA = "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16";
const OPERA_MOVES = ["b3b8", "d7b8", "d1d8"];

const setup = () => {
  const onDone = vi.fn();
  render(<PuzzleRunner fen={FEN} moves={["a1a8"]} themes={["backRankMate"]} opponentFirst={false} onDone={onDone} />);
  return onDone;
};
const move = (uci: string) => act(() => boardMock.props!.onMove!(uci));
const continuar = () => fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

afterEach(() => vi.useRealTimers());

describe("PuzzleRunner", () => {
  it("solving shows the final position and ¡Resuelto!, and reports on Continuar", () => {
    const onDone = setup();
    move("a1a8");
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("¡Resuelto!");
    expect(boardMock.props!.fen).toBe(MATED);
    expect(boardMock.props!.movable).toBe(false);
    expect(boardMock.props!.lastMove).toEqual(["a1", "a8"]);
    continuar();
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ firstTry: true, usedHint: false, failed: false, userMoves: 1 }));
  });

  it("a wrong move then the right one is not first try and keeps the fen", () => {
    const onDone = setup();
    move("a1a2");
    expect(onDone).not.toHaveBeenCalled();
    expect(boardMock.props!.fen).toBe(FEN);
    move("a1a8");
    continuar();
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ firstTry: false, userMoves: 2 }));
  });

  it("using a hint sets usedHint", () => {
    const onDone = setup();
    fireEvent.click(screen.getByRole("button", { name: "Pista" }));
    move("a1a8");
    continuar();
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ usedHint: true }));
  });

  it("showing the solution fails and waits for Continuar", () => {
    const onDone = setup();
    fireEvent.click(screen.getByRole("button", { name: "Ver solución" }));
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByText(/Solución: 1\. Ta8#/)).toBeInTheDocument();
    expect(boardMock.props!.lastMove).toEqual(["a1", "a8"]);
    expect(screen.queryByRole("button", { name: "Pista" })).toBeNull();
    continuar();
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ failed: true }));
  });

  it("freezes the seconds when solved (time on the result screen does not count)", () => {
    const onDone = vi.fn();
    let t = 1000;
    render(<PuzzleRunner fen={FEN} moves={["a1a8"]} themes={[]} opponentFirst={false} onDone={onDone} now={() => t} />);
    t = 6000;
    move("a1a8");
    t = 60000;
    continuar();
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ seconds: 5 }));
  });

  it("numbers the solution from the fen's fullmove number", () => {
    render(<PuzzleRunner fen={OPERA} moves={OPERA_MOVES} themes={[]} opponentFirst={false} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver solución" }));
    expect(screen.getByText("Solución: 16. Db8+ Cxb8 17. Td8#")).toBeInTheDocument();
  });

  it("shows the final auto-played reply and the after-solve content", () => {
    render(
      <PuzzleRunner
        fen={OPERA}
        moves={OPERA_MOVES.slice(0, 2)}
        themes={[]}
        opponentFirst={false}
        onDone={vi.fn()}
        afterSolved={<p>Así ganó Morphy.</p>}
      />,
    );
    expect(screen.queryByText("Así ganó Morphy.")).toBeNull();
    move("b3b8");
    expect(boardMock.props!.lastMove).toEqual(["d7", "b8"]);
    expect(screen.getByRole("status")).toHaveTextContent("¡Resuelto!");
    expect(screen.getByText("Así ganó Morphy.")).toBeInTheDocument();
  });

  it("opponentFirst: shows the original position, then plays the opponent's move after the delay", () => {
    vi.useFakeTimers();
    // Black blunders 0...Kh8?? hypothetically: moves[0] is the opponent's (black's) move.
    const fen = "6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1";
    render(<PuzzleRunner fen={fen} moves={["g8h8", "a1a8"]} themes={[]} opponentFirst onDone={vi.fn()} />);
    expect(boardMock.props!.fen).toBe(fen);
    expect(boardMock.props!.movable).toBe(false);
    expect(boardMock.props!.orientation).toBe("white");
    act(() => vi.advanceTimersByTime(400));
    expect(boardMock.props!.fen).not.toBe(fen);
    expect(boardMock.props!.lastMove).toEqual(["g8", "h8"]);
    expect(boardMock.props!.movable).toBe(true);
  });

  it("opponentFirst with no delay is ready right away", () => {
    const fen = "6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1";
    render(<PuzzleRunner fen={fen} moves={["g8h8", "a1a8"]} themes={[]} opponentFirst opponentDelayMs={0} onDone={vi.fn()} />);
    expect(boardMock.props!.lastMove).toEqual(["g8", "h8"]);
    expect(boardMock.props!.movable).toBe(true);
  });
});
