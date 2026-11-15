// Compiles validated content into the bundle the app fetches. Build-time only (uses node:crypto).
import { createHash } from "node:crypto";
import { marked } from "marked";
import type { Bundle, BundleItem, BundlePuzzle } from "./bundle-client";
import type { Puzzle } from "./puzzle";
import type { ContentItem, Position } from "./schema";

export type { Bundle, BundleItem, BundlePuzzle } from "./bundle-client";

function customPuzzles(itemId: string, positions: Position[]): BundlePuzzle[] {
  return positions.map((p, i) => ({
    id: `${itemId}#${i + 1}`,
    fen: p.fen,
    moves: p.solution,
    rating: 0,
    themes: [],
    opponentFirst: false,
  }));
}

export function compileBundle(items: ContentItem[], puzzles: Record<string, Puzzle[]>): Bundle {
  const outItems: BundleItem[] = [];
  const outPuzzles: Record<string, BundlePuzzle[]> = {};

  for (const [theme, list] of Object.entries(puzzles)) {
    outPuzzles[theme] = list.map((p) => ({ ...p, opponentFirst: true }));
  }

  for (const item of items) {
    const { body, claims, ...rest } = item;
    void claims;
    outItems.push({ ...rest, html: marked.parse(body, { async: false }) });
    if ((item.kind === "pattern" || item.kind === "technique") && item.positions?.length) {
      outPuzzles[`custom:${item.id}`] = customPuzzles(item.id, item.positions);
    }
  }

  const version = createHash("sha256")
    .update(JSON.stringify({ items: outItems, puzzles: outPuzzles }))
    .digest("hex")
    .slice(0, 12);
  return { version, items: outItems, puzzles: outPuzzles };
}
