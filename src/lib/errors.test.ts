import { describe, expect, it } from "vitest";
import { UserFacingError, userMessage } from "./errors";

describe("userMessage", () => {
  it("keeps our Spanish messages and hides anything else behind the fallback", () => {
    expect(userMessage(new UserFacingError("El respaldo no es válido"), "x")).toBe("El respaldo no es válido");
    expect(userMessage(new TypeError("Failed to fetch"), "No se pudo cargar.")).toBe("No se pudo cargar.");
    expect(userMessage("boom", "No se pudo cargar.")).toBe("No se pudo cargar.");
  });
});
