// Browser-safe bundle types and client fetch (no Node imports).
import type { ContentItem } from "./schema";
import type { Puzzle } from "./puzzle";

export type BundleItem = Omit<ContentItem, "body" | "claims"> & { html: string };
/** opponentFirst: true when moves[0] is the opponent's move (Lichess); false for custom positions. */
export type BundlePuzzle = Puzzle & { opponentFirst: boolean };
export type Bundle = {
  version: string;
  items: BundleItem[];
  puzzles: Record<string, BundlePuzzle[]>;
};

export async function fetchBundle(): Promise<Bundle> {
  const res = await fetch("/content/bundle.json");
  if (!res.ok) {
    throw new Error(`No se pudo cargar el contenido (HTTP ${res.status}).`);
  }
  return (await res.json()) as Bundle;
}
