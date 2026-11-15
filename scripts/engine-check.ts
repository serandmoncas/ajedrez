// Runs Stockfish over every claim in content/ and stores EngineResult[] per item.
// Usage: npm run engine:check [-- --id <contentId>] [--depth 22] [--content <dir>] [--out <dir>]
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { Chess } from "chess.js";
import { claimPasses, type EngineResult } from "../src/lib/chess/claims";
import type { Claim } from "../src/lib/content/schema";
import { loadContent } from "../src/lib/content/load";
import { UciEngine } from "./lib/uci";

const { values } = parseArgs({
  options: {
    id: { type: "string" },
    depth: { type: "string", default: "22" },
    content: { type: "string", default: "content" },
    out: { type: "string", default: "content/engine" },
  },
});
const depth = Number(values.depth);
if (!Number.isInteger(depth) || depth < 2) {
  console.error(`--depth inválido: ${values.depth}`);
  process.exit(2);
}

// Engine reports from the side to move; flip so the mover's point of view is kept after a move.
function flip(v: number | undefined): number | undefined {
  return v === undefined ? undefined : -v || 0;
}

async function analyze(engine: UciEngine, claim: Claim): Promise<EngineResult> {
  await engine.newGame();
  const pos = await engine.search(claim.fen, depth);
  const result: EngineResult = {
    claimId: claim.id,
    fen: claim.fen,
    depth: pos.info?.depth ?? 0,
    bestMove: pos.bestMove,
    evalCp: pos.info?.cp,
    mateIn: pos.info?.mate,
  };
  if (claim.move === undefined) return result;

  const chess = new Chess(claim.fen);
  const played = chess.move(claim.move); // throws on illegal SAN: surfaces as a content error
  const uci = played.from + played.to + (played.promotion ?? "");
  result.move = claim.move;
  if (chess.isCheckmate()) {
    result.moveMateIn = 0;
    return result;
  }
  await engine.newGame();
  const after = await engine.search(claim.fen, depth - 1, [uci]);
  result.moveEvalCp = flip(after.info?.cp);
  result.moveMateIn = after.info?.mate === 0 ? 0 : flip(after.info?.mate);
  return result;
}

function describeEval(r: EngineResult, claim: Claim): string {
  const cp = claim.move !== undefined ? r.moveEvalCp : r.evalCp;
  const mate = claim.move !== undefined ? r.moveMateIn : r.mateIn;
  if (mate !== undefined) return `mate ${mate}`;
  return cp !== undefined ? `${cp >= 0 ? "+" : ""}${cp} cp` : "—";
}

async function main(): Promise<void> {
  const { items, errors } = await loadContent(values.content!);
  for (const e of errors) console.error(`Error de contenido: ${e.file}: ${e.message}`);
  if (errors.length > 0) process.exit(1);

  const targets = items.filter(
    (i) => (i.claims?.length ?? 0) > 0 && (values.id === undefined || i.id === values.id),
  );
  if (values.id !== undefined && targets.length === 0) {
    console.error(`No hay afirmaciones para el id "${values.id}".`);
    process.exit(1);
  }

  const engine = new UciEngine();
  await engine.init();
  const rows: string[][] = [["id", "afirmación", "assert", "eval", "resultado"]];
  let failures = 0;
  try {
    for (const item of targets) {
      const results: EngineResult[] = [];
      for (const claim of item.claims!) {
        const r = await analyze(engine, claim);
        results.push(r);
        const ok = claimPasses(claim, r);
        if (!ok) failures++;
        rows.push([item.id, claim.id, claim.assert, describeEval(r, claim), ok ? "pasa" : "falla"]);
      }
      await mkdir(values.out!, { recursive: true });
      await writeFile(path.join(values.out!, `${item.id}.json`), JSON.stringify(results, null, 2) + "\n");
    }
  } finally {
    engine.quit();
  }

  const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => r[c].length)));
  for (const row of rows) console.log(row.map((cell, c) => cell.padEnd(widths[c])).join("  "));
  if (failures > 0) {
    console.error(`\n${failures} afirmación(es) fallan.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
