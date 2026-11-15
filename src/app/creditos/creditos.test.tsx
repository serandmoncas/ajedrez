import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BundleItem } from "@/lib/content/bundle-client";
import CreditsPage from "./page";

const item = {
  kind: "game",
  id: "inmortal",
  title: "La Inmortal",
  sources: [{ title: "Partida en Wikipedia", url: "https://es.wikipedia.org/wiki/Partida_inmortal" }, { title: "Libro sin enlace" }],
} as unknown as BundleItem;
vi.mock("@/lib/content/bundle-client", () => ({ fetchBundle: async () => ({ version: "t", items: [item], puzzles: {} }) }));

describe("Créditos", () => {
  it("lists the required credits and every content source", async () => {
    render(<CreditsPage />);
    expect(screen.getByRole("link", { name: "Base de problemas de Lichess" })).toHaveAttribute("href", "https://database.lichess.org/");
    for (const name of ["chessground", "chess.js", "ts-fsrs", "Stockfish"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(await screen.findByText("La Inmortal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Partida en Wikipedia" })).toHaveAttribute(
      "href",
      "https://es.wikipedia.org/wiki/Partida_inmortal",
    );
    expect(screen.getByText("Libro sin enlace")).toBeInTheDocument();
  });
});
