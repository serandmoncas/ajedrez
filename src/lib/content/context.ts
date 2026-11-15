// Reads engine results, reference PGNs and puzzles from content/. Node-only (uses fs).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { EngineResult } from "../chess/claims";
import type { Puzzle } from "./puzzle";
import type { ValidationContext } from "./validate";

async function listFiles(dir: string, ext: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(ext))
      .map((e) => e.name)
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw new Error(`${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function loadValidationContext(contentDir: string): Promise<ValidationContext> {
  const engine: Record<string, EngineResult[]> = {};
  const engineDir = path.join(contentDir, "engine");
  for (const name of await listFiles(engineDir, ".json")) {
    const data = await readJson<EngineResult[]>(path.join(engineDir, name));
    if (data) engine[name.replace(/\.json$/, "")] = data;
  }

  const referencePgns: Record<string, string> = {};
  const sourcesDir = path.join(contentDir, "sources");
  for (const name of await listFiles(sourcesDir, ".pgn")) {
    referencePgns[name] = await readFile(path.join(sourcesDir, name), "utf8");
  }

  const themes = await readJson<string[]>(path.join(contentDir, "puzzles", "THEMES.json"));
  return { engine, referencePgns, puzzleThemes: new Set(themes ?? []) };
}

export async function loadPuzzles(contentDir: string): Promise<Record<string, Puzzle[]>> {
  const puzzles: Record<string, Puzzle[]> = {};
  const dir = path.join(contentDir, "puzzles");
  for (const name of await listFiles(dir, ".json")) {
    if (name === "THEMES.json") continue;
    const data = await readJson<Puzzle[]>(path.join(dir, name));
    if (data) puzzles[name.replace(/\.json$/, "")] = data;
  }
  return puzzles;
}
