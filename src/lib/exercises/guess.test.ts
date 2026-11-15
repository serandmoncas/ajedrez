import { describe, expect, it } from "vitest";
import type { Game } from "../content/schema";
import { scoreGuess } from "./guess";

const game = {
  moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"],
  alternatives: { "5": [{ san: "Bc4", comment: "Italiana, también buena." }] },
  comments: { "5": "La Ruy López." },
} as unknown as Game;

describe("scoreGuess", () => {
  it("full with the master move and its comment", () => {
    expect(scoreGuess(game, 5, "Bb5")).toEqual({
      kind: "full",
      masterSan: "Bb5",
      comment: "La Ruy López.",
    });
  });
  it("partial with an alternative", () => {
    const r = scoreGuess(game, 5, "Bc4");
    expect(r.kind).toBe("partial");
    expect(r.comment).toBe("Italiana, también buena.");
  });
  it("miss otherwise", () => {
    expect(scoreGuess(game, 5, "d4").kind).toBe("miss");
    expect(scoreGuess(game, 5, "garbage").kind).toBe("miss");
  });
  it("ignores check/annotation marks", () => {
    expect(scoreGuess(game, 5, "Bb5+!").kind).toBe("full");
    const g = { moves: ["e4", "f5", "Qh5"], side: "w" } as unknown as Game;
    expect(scoreGuess(g, 3, "Qh5+").kind).toBe("full");
    expect(scoreGuess(g, 3, "Qh5").kind).toBe("full");
  });
});
