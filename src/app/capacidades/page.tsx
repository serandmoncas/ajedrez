"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PrivateModeNotice } from "@/components/PrivateModeNotice";
import { useAppData } from "@/components/useAppData";
import type { Bundle } from "@/lib/content/bundle-client";
import type { Progress } from "@/lib/progress/types";
import { isMastered } from "@/lib/srs/cards";
import { MASTERY_STABILITY_DAYS } from "@/lib/srs/config";
import { puzzlePool } from "@/lib/session/build";

/** Rated puzzles needed before the estimated rating means anything. */
const MIN_RATED_PUZZLES = 5;

export default function CapabilitiesPage() {
  const data = useAppData();
  const [progress, setProgress] = useState<Progress | null>(null);
  const store = data.status === "ok" ? data.store : null;

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    store.load().then((p) => !cancelled && setProgress(p));
    return () => {
      cancelled = true;
    };
  }, [store]);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Capacidades</h1>
      {data.status === "loading" && <p>Cargando...</p>}
      {data.status === "error" && <p>{data.message}</p>}
      {data.status === "ok" && !data.persistent && <PrivateModeNotice />}
      {data.status === "ok" && progress && <Summary bundle={data.bundle} p={progress} />}
      <Link href="/" className="underline">
        Volver al inicio
      </Link>
    </main>
  );
}

function Summary({ bundle, p }: { bundle: Bundle; p: Progress }) {
  const now = new Date();
  const allThemed = bundle.items.flatMap((i) => (i.kind === "pattern" || i.kind === "technique" ? [i] : []));
  // Items without any puzzle can't be mastered: they are lessons, counted apart.
  const themed = allThemed.filter((i) => puzzlePool(bundle, i).length > 0);
  const lessons = allThemed.filter((i) => puzzlePool(bundle, i).length === 0);
  const mastered = themed.filter((i) => isMastered(p, i.id, now)).length;
  const lessonsSeen = lessons.filter((i) => i.id in p.introduced).length;
  const openings = bundle.items.flatMap((i) => (i.kind === "opening" ? [i] : []));
  const games = bundle.items.flatMap((i) => (i.kind === "game" && p.games[i.id]?.done ? [i] : []));
  const lineMastered = (cardId: string) => (p.cards[cardId]?.stability ?? 0) >= MASTERY_STABILITY_DAYS;
  // Partial guesses (good alternatives) count as half a hit.
  const accuracy = (id: string) => {
    const g = p.games[id];
    const total = g.full + g.partial + g.miss;
    return total === 0 ? 0 : Math.round((100 * (g.full + g.partial / 2)) / total);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Patrones</h2>
        <p>
          Patrones dominados: {mastered} de {themed.length}
        </p>
        {lessons.length > 0 && (
          <p>
            Lecciones de técnica vistas: {lessonsSeen} de {lessons.length}
          </p>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Aperturas</h2>
        {openings.length === 0 ? (
          <p>Todavía no hay aperturas.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {openings.map((o) => (
              <li key={o.id}>
                {o.title}: {o.lines.filter((l) => lineMastered(`line:${o.id}/${l.id}`)).length} de {o.lines.length}{" "}
                líneas dominadas
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Partidas recorridas</h2>
        {games.length === 0 ? (
          <p>Todavía no terminas ninguna partida.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {games.map((g) => (
              <li key={g.id}>
                {g.title}: {accuracy(g.id)} % de acierto
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Rating</h2>
        <p>
          Rating estimado:{" "}
          {(p.rating.ratedCount ?? 0) >= MIN_RATED_PUZZLES ? Math.round(p.rating.r) : "aún sin datos"}
        </p>
      </section>
    </div>
  );
}
