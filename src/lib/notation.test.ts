import { describe, expect, it } from "vitest";
import { formatMoveList, toSpanishSan } from "./notation";

describe("toSpanishSan", () => {
  it("traduce las letras de pieza al español", () => {
    expect(toSpanishSan("Nf3")).toBe("Cf3");
    expect(toSpanishSan("Bxf7+")).toBe("Axf7+");
    expect(toSpanishSan("Qh5#")).toBe("Dh5#");
    expect(toSpanishSan("Rae1")).toBe("Tae1");
    expect(toSpanishSan("Kxe2")).toBe("Rxe2");
  });

  it("deja el enroque igual", () => {
    expect(toSpanishSan("O-O-O")).toBe("O-O-O");
  });

  it("traduce la pieza de la coronación", () => {
    expect(toSpanishSan("exd8=Q+")).toBe("exd8=D+");
  });

  it("no toca los peones", () => {
    expect(toSpanishSan("e4")).toBe("e4");
  });
});

describe("formatMoveList", () => {
  it("numera las jugadas de a pares", () => {
    expect(formatMoveList(["e4", "e5", "Nf3"])).toBe("1. e4 e5 2. Cf3");
  });

  it("empieza por la jugada de negras cuando startPly es 1", () => {
    expect(formatMoveList(["Nc6"], 1)).toBe("1... Cc6");
  });
});
