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
    render(<Lesson item={item} onContinue={onContinue} introduced={{ italiana: "Apertura Italiana" }} />);
    expect(screen.getByText("Ataca dos piezas.")).toBeInTheDocument();
    expect(screen.getByText("Ejemplo uno")).toBeInTheDocument();
    expect(screen.getByTestId("board")).toHaveAttribute("data-movable", "false");
    expect(screen.getByRole("link", { name: "Apertura Italiana" })).toHaveAttribute("href", "/aprender/italiana");
    expect(screen.getByText("(ya la estudiaste)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "inmortal" })).toHaveAttribute("href", "/aprender/inmortal");
    expect(screen.getByText("(la verás más adelante)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onContinue).toHaveBeenCalled();
  });
});
