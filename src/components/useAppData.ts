"use client";

import { useEffect, useState } from "react";
import { fetchBundle, type Bundle } from "@/lib/content/bundle-client";
import { userMessage } from "@/lib/errors";
import { openStore } from "@/lib/progress/open-store";
import type { ProgressStore } from "@/lib/progress/store";

export type AppData =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; bundle: Bundle; store: ProgressStore; persistent: boolean };

/** Loads the content bundle and opens the progress store (memory fallback) on the client. */
export function useAppData(): AppData {
  const [data, setData] = useState<AppData>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchBundle(), openStore()])
      .then(([bundle, { store, persistent }]) => {
        if (!cancelled) setData({ status: "ok", bundle, store, persistent });
      })
      .catch((e: unknown) => {
        if (!cancelled) setData({ status: "error", message: userMessage(e, "No se pudo cargar la app. Inténtalo de nuevo.") });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
