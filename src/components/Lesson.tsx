"use client";

import Link from "next/link";
import { Chess } from "chess.js";
import { Board } from "@/components/Board";
import type { BundleItem } from "@/lib/content/bundle-client";

type Props = {
  item: BundleItem;
  onContinue: () => void;
  /** id -> ISO date the user first studied it (status only). */
  introduced?: Record<string, string>;
  /** id -> title, used as link text. */
  titles?: Record<string, string>;
};

export function Lesson({ item, onContinue, introduced = {}, titles = {} }: Props) {
  const links = item.links;
  const linkedIds = links
    ? [
        ...(links.patterns ?? []),
        ...(links.openings ?? []),
        ...(links.games ?? []),
        ...(links.combinations ?? []),
      ]
    : [];
  const examples = item.kind === "pattern" || item.kind === "technique" ? item.examples : [];

  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{item.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: item.html }} />
      {examples.map((ex, i) => (
        <figure key={i} className="flex flex-col gap-2">
          <Board
            fen={ex.fen}
            orientation={new Chess(ex.fen).turn() === "w" ? "white" : "black"}
            movable={false}
          />
          {ex.caption && <figcaption className="text-center">{ex.caption}</figcaption>}
        </figure>
      ))}
      {linkedIds.length > 0 && (
        <ul className="flex flex-col gap-1">
          {linkedIds.map((id) => (
            <li key={id}>
              <Link href={`/aprender/${id}`} className="underline">
                {titles[id] ?? "contenido"}
              </Link>{" "}
              <span className="text-[var(--subtle)]">
                ({id in introduced ? "ya la estudiaste" : "la verás más adelante"})
              </span>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onContinue}
        className="min-h-12 rounded bg-[var(--accent)] px-4 py-2 font-semibold text-white"
      >
        Continuar
      </button>
    </article>
  );
}
