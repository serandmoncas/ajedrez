import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Board } from "./Board";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("Board", () => {
  it("mounts chessground and creates the .cg-wrap element", () => {
    const { container } = render(<Board fen={START} orientation="white" movable />);
    expect(container.querySelector(".cg-wrap")).not.toBeNull();
  });

  it("shows no promotion picker initially", () => {
    render(<Board fen={START} orientation="white" movable />);
    expect(screen.queryByRole("button", { name: "Dama" })).toBeNull();
  });

  it("unmounts without error", () => {
    const { unmount } = render(
      <Board fen={START} orientation="black" movable={false} shapes={[{ orig: "e2", dest: "e4", brush: "green" }]} />,
    );
    expect(() => unmount()).not.toThrow();
  });
});
