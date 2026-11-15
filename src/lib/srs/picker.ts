import type { Puzzle } from "../content/puzzle";
import type { Progress } from "../progress/types";

/**
 * Unseen puzzles first (ascending rating); when all were seen, the one seen
 * longest ago. Null for an empty list.
 */
export function nextPuzzleForPattern(p: Progress, puzzles: Puzzle[], now: Date): Puzzle | null {
  void now;
  if (puzzles.length === 0) return null;
  const unseen = puzzles.filter((z) => !(z.id in p.seenPuzzles));
  if (unseen.length > 0) return [...unseen].sort((a, b) => a.rating - b.rating)[0];
  return [...puzzles].sort(
    (a, b) => Date.parse(p.seenPuzzles[a.id]) - Date.parse(p.seenPuzzles[b.id]),
  )[0];
}
