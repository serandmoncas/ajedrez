import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Game } from "@/lib/content/schema";
import { boardMock } from "./board-mock";
import { GuessRunner } from "./GuessRunner";

vi.mock("@/components/Board", async () => ({ Board: (await import("./board-mock")).MockBoard }));

const game = {
  moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"],
  side: "w",
  segments: [{ from: 2, to: 5 }],
  alternatives: { "5": [{ san: "Bc4", comment: "Bc4 también es buena." }] },
  comments: { "3": "Ataca el peón." },
} as unknown as Game;
const move = (uci: string) => act(() => boardMock.props!.onMove!(uci));

describe("GuessRunner", () => {
  it("scores a full and a partial guess and shows the alternative comment", () => {
    const onDone = vi.fn();
    render(<GuessRunner game={game} segment={0} onDone={onDone} />);
    move("g1f3");
    expect(screen.getByText("¡Exacto!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    move("f1c4");
    expect(screen.getByText(/Bc4 también es buena/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onDone).toHaveBeenCalledWith({ full: 1, partial: 1, miss: 0 });
  });

  it("a miss shows the master move in Spanish notation", () => {
    const onDone = vi.fn();
    render(<GuessRunner game={game} segment={0} onDone={onDone} />);
    move("b1c3");
    expect(screen.getByText("El maestro jugó Cf3")).toBeInTheDocument();
    expect(screen.getByText("Ataca el peón.")).toBeInTheDocument();
  });
});
