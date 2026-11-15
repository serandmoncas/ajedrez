// Usage: npm run puzzles:import -- data/raw/lichess_db_puzzle.csv
// Streams the Lichess puzzle CSV (never loads it whole) and writes content/puzzles/<theme>.json.
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { loadContent } from "../src/lib/content/load";
import { DEFAULTS, bandOf, matchesFilters, parsePuzzleRow, selectPuzzles, type PuzzleRow } from "./lib/puzzles";

const OUT_DIR = path.join("content", "puzzles");

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Uso: npm run puzzles:import -- <ruta al lichess_db_puzzle.csv>");
    process.exit(1);
  }

  const { items } = await loadContent("content");
  const wanted = new Set<string>();
  for (const item of items) {
    if (item.kind === "pattern" || item.kind === "technique") {
      for (const t of item.themes ?? []) wanted.add(t);
    }
  }
  const themes = [...wanted].sort();

  // Filter while streaming and cap each (theme, 100-point band) bucket at perTheme rows:
  // selectPuzzles never takes more than perTheme from one band, so memory stays bounded.
  const seenThemes = new Set<string>();
  const buckets = new Map<string, PuzzleRow[]>();
  const rl = readline.createInterface({ input: createReadStream(csvPath), crlfDelay: Infinity });
  for await (const line of rl) {
    const row = parsePuzzleRow(line);
    if (!row) continue;
    for (const t of row.themes) seenThemes.add(t);
    if (!matchesFilters(row)) continue;
    for (const t of row.themes) {
      if (!wanted.has(t)) continue;
      const key = `${t}\0${bandOf(row.rating)}`;
      const bucket = buckets.get(key);
      if (!bucket) buckets.set(key, [row]);
      else if (bucket.length < DEFAULTS.perTheme) bucket.push(row);
    }
  }
  const kept = [...buckets.values()].flat();

  await mkdir(OUT_DIR, { recursive: true });
  const allThemes = [...seenThemes].sort();
  await writeFile(path.join(OUT_DIR, "THEMES.json"), JSON.stringify(allThemes, null, 2) + "\n");
  console.log(`THEMES.json: ${allThemes.length} temas vistos en el CSV`);

  if (themes.length === 0) {
    console.log("No hay patrones ni técnicas con temas en content/ todavía: no se escribieron archivos por tema.");
    return;
  }

  const byTheme = selectPuzzles(kept, themes);
  for (const theme of themes) {
    const puzzles = byTheme[theme];
    await writeFile(path.join(OUT_DIR, `${theme}.json`), JSON.stringify(puzzles, null, 2) + "\n");
    console.log(`${theme}.json: ${puzzles.length} problemas${puzzles.length === 0 ? " (¡ninguno!)" : ""}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
