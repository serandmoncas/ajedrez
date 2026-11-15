"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchBundle, type BundleItem } from "@/lib/content/bundle-client";
import { userMessage } from "@/lib/errors";

const GROUPS: [BundleItem["kind"], string][] = [
  ["pattern", "Patrones"],
  ["technique", "Técnicas"],
  ["opening", "Aperturas"],
  ["game", "Partidas"],
  ["combination", "Combinaciones"],
];

type Loaded = { status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: BundleItem[] };

export default function LibraryPage() {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchBundle()
      .then((b) => !cancelled && setLoaded({ status: "ok", items: b.items }))
      .catch((e: unknown) => {
        if (!cancelled) setLoaded({ status: "error", message: userMessage(e, "No se pudo cargar la biblioteca.") });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Biblioteca</h1>
      {loaded.status === "loading" && <p>Cargando...</p>}
      {loaded.status === "error" && <p>{loaded.message}</p>}
      {loaded.status === "ok" &&
        GROUPS.map(([kind, label]) => {
          const items = loaded.items
            .filter((i) => i.kind === kind)
            .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "es"));
          if (items.length === 0) return null;
          return (
            <section key={kind} className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">{label}</h2>
              <ul className="flex flex-col gap-1">
                {items.map((i) => (
                  <li key={i.id}>
                    <Link href={`/aprender/${i.id}`} className="underline">
                      {i.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      <Link href="/" className="underline">
        Volver al inicio
      </Link>
    </main>
  );
}
