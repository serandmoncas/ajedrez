// Loads, validates and compiles content/ into public/content/bundle.json.
// `--check` validates without writing.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { compileBundle } from "../src/lib/content/bundle";
import { loadValidationContext, loadPuzzles } from "../src/lib/content/context";
import { loadContent } from "../src/lib/content/load";
import { validateBundle } from "../src/lib/content/validate";

async function main() {
  const check = process.argv.includes("--check");
  const contentDir = path.resolve("content");
  const { items, errors } = await loadContent(contentDir);
  const ctx = await loadValidationContext(contentDir);
  const issues = validateBundle(items, ctx);

  for (const e of errors) console.error(`ERROR ${e.file}: ${e.message}`);
  for (const i of issues) console.error(`ERROR ${i.itemId} [${i.rule}]: ${i.message}`);
  if (errors.length > 0 || issues.length > 0) {
    console.error(`contenido inválido: ${errors.length + issues.length} problema(s)`);
    process.exit(1);
  }

  const bundle = compileBundle(items, await loadPuzzles(contentDir));
  if (check) {
    console.log(`contenido válido: ${items.length} elementos (versión ${bundle.version})`);
    return;
  }
  const out = path.resolve("public/content/bundle.json");
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(bundle));
  console.log(`bundle escrito: ${out} (${items.length} elementos, versión ${bundle.version})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
