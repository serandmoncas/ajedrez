"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { PrivateModeNotice } from "@/components/PrivateModeNotice";
import { openStore, type OpenedStore } from "@/lib/progress/open-store";

/** Local date as AAAA-MM-DD. */
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function SettingsPage() {
  const [opened, setOpened] = useState<OpenedStore | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    openStore().then((o) => !cancelled && setOpened(o));
    return () => {
      cancelled = true;
    };
  }, []);

  async function exportBackup() {
    if (!opened) return;
    const blob = new Blob([await opened.store.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${today()}.ajedrez-respaldo.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!opened || !file) return;
    if (!window.confirm("Esto reemplaza tu progreso actual por el del respaldo. ¿Continuar?")) return;
    try {
      await opened.store.importJson(await file.text());
      setMessage("Respaldo importado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo importar el respaldo.");
    }
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      {!opened && <p>Cargando...</p>}
      {opened && (
        <>
          {!opened.persistent && <PrivateModeNotice />}
          <p>Tu progreso vive solo en este dispositivo. Guarda un respaldo de vez en cuando.</p>
          <button
            type="button"
            onClick={() => void exportBackup()}
            className="min-h-12 rounded bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            Exportar respaldo
          </button>
          <label className="flex min-h-12 cursor-pointer items-center justify-center rounded border px-4 py-2">
            Importar respaldo
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => void importBackup(e)}
            />
          </label>
          {message && <p role="status">{message}</p>}
        </>
      )}
      <Link href="/" className="underline">
        Volver al inicio
      </Link>
    </main>
  );
}
