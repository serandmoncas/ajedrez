import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("shows the title and a link to start the session", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Ajedrez" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Empezar sesión" })).toHaveAttribute(
      "href",
      "/sesion",
    );
  });

  it("links to capacidades, ajustes and créditos", () => {
    render(<Home />);
    for (const [name, href] of [["Capacidades", "/capacidades"], ["Ajustes", "/ajustes"], ["Créditos", "/creditos"]]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });
});
