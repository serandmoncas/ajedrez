// Reads content/ from disk. Node-only (uses fs); do not import from browser code.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { contentItemSchema, type ContentItem, type ContentKind } from "./schema";

const FOLDER_KIND: Record<string, ContentKind> = {
  patterns: "pattern",
  techniques: "technique",
  combinations: "combination",
  games: "game",
  openings: "opening",
};

export type ContentError = { file: string; message: string };
export type LoadedContent = { items: ContentItem[]; errors: ContentError[] };

async function listMarkdown(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => e.name)
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function loadContent(dir: string): Promise<LoadedContent> {
  const items: ContentItem[] = [];
  const errors: ContentError[] = [];

  for (const [folder, kind] of Object.entries(FOLDER_KIND)) {
    for (const name of await listMarkdown(path.join(dir, folder))) {
      const file = path.join(dir, folder, name);
      try {
        const parsed = matter(await readFile(file, "utf8"));
        const declared = parsed.data.kind;
        if (declared !== undefined && declared !== kind) {
          errors.push({
            file,
            message: `kind "${String(declared)}" does not match folder ${folder}/ (expected "${kind}")`,
          });
          continue;
        }
        const result = contentItemSchema.safeParse({ ...parsed.data, kind, body: parsed.content });
        if (result.success) {
          items.push(result.data);
        } else {
          const message = result.error.issues
            .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("; ");
          errors.push({ file, message });
        }
      } catch (err) {
        errors.push({ file, message: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  return { items, errors };
}
