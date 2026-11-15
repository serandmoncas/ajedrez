import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Bundle, BundleItem } from "@/lib/content/bundle-client";
import { UserFacingError } from "@/lib/errors";
import LibraryPage from "./page";

const item = (x: Record<string, unknown>) => x as unknown as BundleItem;
const bundle: Bundle = {
  version: "t",
  items: [
    item({ kind: "game", id: "opera", title: "La ópera", order: 1 }),
    item({ kind: "pattern", id: "pasillo", title: "Mate del pasillo", order: 1 }),
    item({ kind: "technique", id: "notacion", title: "Notación", order: 1 }),
    item({ kind: "opening", id: "italiana", title: "Italiana", order: 1 }),
    item({ kind: "combination", id: "final", title: "El final", order: 1 }),
  ],
  puzzles: {},
};

const fetched = vi.hoisted(() => ({ fn: null as null | (() => Promise<unknown>) }));
vi.mock("@/lib/content/bundle-client", () => ({ fetchBundle: () => fetched.fn!() }));

describe("Biblioteca", () => {
  it("lists every item grouped by kind, linking to its lesson", async () => {
    fetched.fn = async () => bundle;
    render(<LibraryPage />);
    const groups: [string, string, string][] = [
      ["Patrones", "Mate del pasillo", "/aprender/pasillo"],
      ["Técnicas", "Notación", "/aprender/notacion"],
      ["Aperturas", "Italiana", "/aprender/italiana"],
      ["Partidas", "La ópera", "/aprender/opera"],
      ["Combinaciones", "El final", "/aprender/final"],
    ];
    for (const [heading, title, href] of groups) {
      const section = (await screen.findByRole("heading", { name: heading })).closest("section")!;
      expect(within(section).getByRole("link", { name: title })).toHaveAttribute("href", href);
    }
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Patrones", "Técnicas", "Aperturas", "Partidas", "Combinaciones"]);
  });

  it("shows only a Spanish message when loading fails", async () => {
    fetched.fn = async () => {
      throw new UserFacingError("No se pudo cargar el contenido. Revisa tu conexión.");
    };
    render(<LibraryPage />);
    expect(await screen.findByText("No se pudo cargar el contenido. Revisa tu conexión.")).toBeInTheDocument();
  });
});
