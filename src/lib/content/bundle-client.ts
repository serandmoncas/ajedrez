// Browser-safe bundle types and client fetch (no Node imports).
import type { ContentItem } from "./schema";
import type { Puzzle } from "./puzzle";
import { UserFacingError } from "../errors";

/** Distributes over the ContentItem union so narrowing by `kind` exposes kind-specific fields. */
export type BundleItem = ContentItem extends infer T
  ? T extends ContentItem
    ? Omit<T, "body" | "claims"> & { html: string }
    : never
  : never;
/** opponentFirst: true when moves[0] is the opponent's move (Lichess); false for custom positions. */
export type BundlePuzzle = Puzzle & { opponentFirst: boolean };
export type Bundle = {
  version: string;
  items: BundleItem[];
  puzzles: Record<string, BundlePuzzle[]>;
};

const OFFLINE = "No se pudo cargar el contenido. Revisa tu conexión.";

export async function fetchBundle(): Promise<Bundle> {
  let res: Response;
  try {
    res = await fetch("/content/bundle.json");
  } catch {
    throw new UserFacingError(OFFLINE);
  }
  if (!res.ok) {
    throw new UserFacingError(`No se pudo cargar el contenido (HTTP ${res.status}).`);
  }
  try {
    return (await res.json()) as Bundle;
  } catch {
    throw new UserFacingError(OFFLINE);
  }
}
