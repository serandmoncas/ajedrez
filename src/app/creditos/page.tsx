"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchBundle, type BundleItem } from "@/lib/content/bundle-client";

const LIBRARIES = [
  { name: "Base de problemas de Lichess", license: "CC0", url: "https://database.lichess.org/" },
  { name: "chessground", license: "GPL-3.0", url: "https://github.com/lichess-org/chessground" },
  { name: "chess.js", license: "BSD-2-Clause", url: "https://github.com/jhlywa/chess.js" },
  { name: "ts-fsrs", license: "MIT", url: "https://github.com/open-spaced-repetition/ts-fsrs" },
  {
    name: "Stockfish",
    license: "GPL-3.0, solo para verificar el contenido",
    url: "https://stockfishchess.org/",
  },
];

export default function CreditsPage() {
  const [items, setItems] = useState<BundleItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBundle()
      .then((b) => !cancelled && setItems([...b.items].sort((a, c) => a.title.localeCompare(c.title, "es"))))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Créditos</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Datos y programas</h2>
        <ul className="flex flex-col gap-1">
          {LIBRARIES.map((l) => (
            <li key={l.name}>
              <a href={l.url} className="underline">
                {l.name}
              </a>{" "}
              ({l.license})
            </li>
          ))}
        </ul>
        <p>El código de esta app es software libre bajo GPL-3.0. Los textos están bajo CC BY-SA 4.0.</p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Fuentes del contenido</h2>
        {items === null && <p>Cargando...</p>}
        {items?.length === 0 && <p>No hay contenido cargado.</p>}
        <ul className="flex flex-col gap-3">
          {items?.map((i) => (
            <li key={i.id}>
              <p className="font-semibold">{i.title}</p>
              <ul className="list-disc pl-6">
                {i.sources.map((s, n) => (
                  <li key={n}>
                    {s.url ? (
                      <a href={s.url} className="underline">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
      <Link href="/" className="underline">
        Volver al inicio
      </Link>
    </main>
  );
}
