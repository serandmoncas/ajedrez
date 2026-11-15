import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "@/lib/progress/store";
import { emptyProgress } from "@/lib/progress/types";
import SettingsPage from "./page";

const store = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/lib/progress/open-store", () => ({ openStore: async () => store.value }));

const pick = (text: string) =>
  act(async () => {
    const input = screen.getByLabelText("Importar respaldo") as HTMLInputElement;
    const file = new File([text], "x.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });
  });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Ajustes", () => {
  it("exports a backup named after today's date", async () => {
    store.value = { store: createMemoryStore(emptyProgress(new Date())), persistent: true };
    render(<SettingsPage />);
    const button = await screen.findByRole("button", { name: "Exportar respaldo" });
    const created: HTMLAnchorElement[] = [];
    const inBodyAtClick: boolean[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === "a") {
        created.push(el as HTMLAnchorElement);
        vi.spyOn(el as HTMLAnchorElement, "click").mockImplementation(() => {
          inBodyAtClick.push(document.body.contains(el));
        });
      }
      return el;
    });
    URL.createObjectURL = vi.fn(() => "blob:x");
    const revoke = vi.fn();
    URL.revokeObjectURL = revoke;
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    await act(async () => fireEvent.click(button));
    expect(created[0].download).toMatch(/^\d{4}-\d{2}-\d{2}\.ajedrez-respaldo\.json$/);
    // Some browsers only download from an anchor in the document.
    expect(inBodyAtClick).toEqual([true]);
    expect(document.body.contains(created[0])).toBe(false);
    // Revoking right away can cancel the download.
    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith("blob:x");
  });

  it("asks for confirmation and shows the Spanish error for an invalid backup", async () => {
    store.value = { store: createMemoryStore(), persistent: true };
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<SettingsPage />);
    await screen.findByRole("button", { name: "Exportar respaldo" });
    await pick("no es json");
    expect(confirm).toHaveBeenCalled();
    expect(await screen.findByText("El respaldo no es válido")).toBeInTheDocument();
  });

  it("does nothing when the import is not confirmed", async () => {
    const s = createMemoryStore();
    const spy = vi.spyOn(s, "importJson");
    store.value = { store: s, persistent: true };
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<SettingsPage />);
    await screen.findByRole("button", { name: "Exportar respaldo" });
    await pick(JSON.stringify(emptyProgress(new Date())));
    expect(spy).not.toHaveBeenCalled();
  });
});
