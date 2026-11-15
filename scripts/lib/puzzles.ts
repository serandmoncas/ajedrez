import type { Puzzle } from "../../src/lib/content/puzzle";

export type PuzzleRow = Puzzle & { popularity: number; nbPlays: number };

export type SelectOptions = {
  min?: number;
  max?: number;
  perTheme?: number;
  minPopularity?: number;
  minPlays?: number;
};

export const BAND = 100;
export const DEFAULTS = { min: 600, max: 1800, perTheme: 80, minPopularity: 80, minPlays: 500 };

export function bandOf(rating: number): number {
  return Math.floor(rating / BAND);
}

// Rating in [min, max] (inclusive), popularity >= minPopularity, nbPlays >= minPlays.
export function matchesFilters(row: PuzzleRow, opts: SelectOptions = {}): boolean {
  const { min, max, minPopularity, minPlays } = { ...DEFAULTS, ...opts };
  return (
    row.rating >= min &&
    row.rating <= max &&
    row.popularity >= minPopularity &&
    row.nbPlays >= minPlays
  );
}

// CSV: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags[,...]
// Lichess puzzle fields never contain commas or quotes, so a plain split is enough.
export function parsePuzzleRow(line: string): PuzzleRow | null {
  const cols = line.trim().split(",");
  if (cols.length < 8) return null;
  const rating = Number(cols[3]);
  const popularity = Number(cols[5]);
  const nbPlays = Number(cols[6]);
  if (![rating, popularity, nbPlays].every(Number.isFinite)) return null; // header
  const moves = cols[2].split(" ").filter(Boolean);
  if (moves.length < 2) return null;
  return {
    id: cols[0],
    fen: cols[1],
    moves,
    rating,
    themes: cols[7].split(" ").filter(Boolean),
    popularity,
    nbPlays,
  };
}

export function toPuzzle(row: PuzzleRow): Puzzle {
  const { id, fen, moves, rating, themes } = row;
  return { id, fen, moves, rating, themes };
}

// Spread picks across rating bands of 100 points, taking one per band in turns
// (round-robin; evenly spaced bands when there are fewer slots than bands).
function spread(candidates: PuzzleRow[], limit: number): PuzzleRow[] {
  const bands = new Map<number, PuzzleRow[]>();
  for (const row of [...candidates].sort((a, b) => a.rating - b.rating || a.id.localeCompare(b.id))) {
    const key = bandOf(row.rating);
    const band = bands.get(key);
    if (band) band.push(row);
    else bands.set(key, [row]);
  }
  const queues = [...bands.entries()].sort((a, b) => a[0] - b[0]).map(([, rows]) => rows);
  const picked: PuzzleRow[] = [];
  for (let i = 0; picked.length < limit; i++) {
    const active = queues.filter((q) => i < q.length);
    if (active.length === 0) break;
    const remaining = limit - picked.length;
    // Fewer slots than bands left: take evenly spaced bands so the whole range is covered.
    const chosen =
      remaining >= active.length
        ? active
        : Array.from({ length: remaining }, (_, k) =>
            active[Math.floor(((k + 0.5) * active.length) / remaining)],
          );
    for (const q of chosen) picked.push(q[i]);
  }
  return picked.sort((a, b) => a.rating - b.rating || a.id.localeCompare(b.id));
}

export function selectPuzzles(
  rows: Iterable<PuzzleRow | null>,
  themes: string[],
  opts: SelectOptions = {},
): Record<string, Puzzle[]> {
  const { perTheme } = { ...DEFAULTS, ...opts };
  const wanted = new Set(themes);
  const pool: Record<string, PuzzleRow[]> = Object.fromEntries(themes.map((t) => [t, []]));
  const seen = new Set<string>(); // "<theme>\0<id>": the same puzzle may arrive more than once
  for (const row of rows) {
    if (!row) continue;
    if (!matchesFilters(row, opts)) continue;
    for (const t of row.themes) {
      if (!wanted.has(t) || seen.has(`${t}\0${row.id}`)) continue;
      seen.add(`${t}\0${row.id}`);
      pool[t].push(row);
    }
  }
  return Object.fromEntries(
    themes.map((t) => [t, spread(pool[t], perTheme).map(toPuzzle)]),
  );
}
