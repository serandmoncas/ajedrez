// Chess-semantics and cross-reference checks over the whole content bundle.
// Shape is already guaranteed by the zod schemas; this is the guard against wrong chess content.
import { Chess, type Color, type PieceSymbol } from "chess.js";
import { claimPasses, type EngineResult } from "../chess/claims";
import type { Claim, ContentItem, Game, Opening, Position } from "./schema";

export type Issue = { itemId: string; rule: string; message: string };

export type ValidationContext = {
  engine: Record<string, EngineResult[]>; // by content item id
  referencePgns: Record<string, string>; // by `referencePgn` file name -> raw PGN text
  puzzleThemes: Set<string>;
};

const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function tryChess(fen: string): Chess | undefined {
  try {
    const chess = new Chess(fen);
    // chess.js accepts positions where the side NOT to move is in check; those are unreachable.
    const waiting: Color = chess.turn() === "w" ? "b" : "w";
    for (const row of chess.board()) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === waiting && chess.isAttacked(sq.square, chess.turn())) {
          return undefined;
        }
      }
    }
    return chess;
  } catch {
    return undefined;
  }
}

/** Plays one UCI move (e.g. "e7e8q"); returns false if it is illegal or malformed. */
function playUci(chess: Chess, uci: string): boolean {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return false;
  try {
    const m = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined });
    // chess.js ignores a promotion suffix on a non-promotion move; the UCI must round-trip exactly.
    return m.from + m.to + (m.promotion ?? "") === uci;
  } catch {
    return false;
  }
}

function playSan(chess: Chess, san: string): boolean {
  try {
    // strict: content must be real SAN, not long algebraic like "e2e4"
    chess.move(san, { strict: true });
    return true;
  } catch {
    return false;
  }
}

/** Material from `color`'s point of view: own pieces minus the opponent's. */
function balance(chess: Chess, color: Color): number {
  let total = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq) total += (sq.color === color ? 1 : -1) * PIECE_VALUE[sq.type];
    }
  }
  return total;
}

/** Number of leading plies of `moves` that are legal from the initial position. */
function legalPrefix(moves: string[]): number {
  const chess = new Chess();
  for (let i = 0; i < moves.length; i++) if (!playSan(chess, moves[i])) return i;
  return moves.length;
}

const normalizeSan = (san: string) => san.replace(/[+#!?]/g, "");

function checkPositions(item: ContentItem & { kind: "pattern" | "technique" }, out: Issue[]) {
  const groups: [string, Position[]][] = [
    ["examples", item.examples],
    ["positions", item.positions ?? []],
  ];
  for (const [label, list] of groups) {
    list.forEach((p, i) => {
      const where = `${label}[${i}]`;
      const chess = tryChess(p.fen);
      if (!chess) {
        out.push({ itemId: item.id, rule: "illegal-fen", message: `FEN inválido en ${where}: "${p.fen}".` });
        return;
      }
      for (const uci of p.solution) {
        if (!playUci(chess, uci)) {
          out.push({
            itemId: item.id,
            rule: "illegal-solution",
            message: `Jugada ilegal "${uci}" en la solución de ${where} (${p.fen}).`,
          });
          return;
        }
      }
    });
  }
}

function checkCombination(item: ContentItem & { kind: "combination" }, out: Issue[]) {
  const chess = tryChess(item.fen);
  if (!chess) {
    out.push({ itemId: item.id, rule: "illegal-fen", message: `FEN inválido: "${item.fen}".` });
    return;
  }
  const solver = chess.turn();
  const before = balance(chess, solver);
  for (const uci of item.solution) {
    if (!playUci(chess, uci)) {
      out.push({ itemId: item.id, rule: "illegal-solution", message: `Jugada ilegal "${uci}" en la solución.` });
      return;
    }
  }
  if (item.expect === "mate") {
    if (!chess.isCheckmate() || chess.turn() === solver) {
      out.push({
        itemId: item.id,
        rule: "combination-outcome",
        message: "Se esperaba que quien resuelve dé jaque mate al final de la solución, pero la secuencia no termina así.",
      });
    }
    return;
  }
  const needed = item.materialGain ?? 1;
  const gain = balance(chess, solver) - before;
  if (gain < needed) {
    out.push({
      itemId: item.id,
      rule: "combination-outcome",
      message: `Se esperaba ganar al menos ${needed} de material, pero la ganancia es ${gain}.`,
    });
  }
}

function checkGame(item: Game, ctx: ValidationContext, out: Issue[]) {
  const n = item.moves.length;
  const legal = legalPrefix(item.moves);
  if (legal < n) {
    out.push({
      itemId: item.id,
      rule: "illegal-game",
      message: `La jugada "${item.moves[legal]}" (media jugada ${legal + 1}) es ilegal.`,
    });
  }

  // Reference PGN comparison.
  const pgn = ctx.referencePgns[item.referencePgn];
  if (pgn === undefined) {
    out.push({
      itemId: item.id,
      rule: "reference-mismatch",
      message: `Falta el archivo de referencia "${item.referencePgn}".`,
    });
  } else {
    const ref = new Chess();
    let history: string[] | undefined;
    try {
      ref.loadPgn(pgn);
      history = ref.history();
    } catch {
      out.push({
        itemId: item.id,
        rule: "reference-mismatch",
        message: `No se pudo leer el PGN de referencia "${item.referencePgn}".`,
      });
    }
    if (history) {
      const a = item.moves.map(normalizeSan);
      const b = history.map(normalizeSan);
      const len = Math.max(a.length, b.length);
      for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
          out.push({
            itemId: item.id,
            rule: "reference-mismatch",
            message: `Difiere de "${item.referencePgn}" en la media jugada ${i + 1}: contenido "${a[i] ?? "(fin)"}", referencia "${b[i] ?? "(fin)"}".`,
          });
          break;
        }
      }
    }
  }

  // Segments: 1-based inclusive ply ranges, ascending and non-overlapping.
  let prevTo = 0;
  item.segments.forEach((s, i) => {
    const label = `segmento ${i + 1} (${s.from}-${s.to})`;
    if (s.to > n) {
      out.push({ itemId: item.id, rule: "bad-segment", message: `El ${label} sale del rango 1..${n}.` });
    } else if (s.from > s.to) {
      out.push({ itemId: item.id, rule: "bad-segment", message: `El ${label} tiene el inicio después del final.` });
    } else if (s.from <= prevTo) {
      out.push({
        itemId: item.id,
        rule: "bad-segment",
        message: `El ${label} se superpone con el anterior o está desordenado.`,
      });
    }
    prevTo = Math.max(prevTo, s.to);
  });

  // Alternatives: an alternative at ply N replaces moves[N-1], so it must be legal before it.
  for (const [key, alts] of Object.entries(item.alternatives ?? {})) {
    const ply = Number(key);
    if (ply < 1 || ply > n) {
      out.push({
        itemId: item.id,
        rule: "alternative-illegal",
        message: `La alternativa en la media jugada ${key} está fuera del rango 1..${n}.`,
      });
      continue;
    }
    // Only the guessing side's plies are guessed, so an alternative elsewhere is never shown.
    if ((item.side === "w") !== (ply % 2 === 1)) {
      out.push({
        itemId: item.id,
        rule: "comment-wrong-side",
        message: `La alternativa en la media jugada ${key} es del bando que no adivina: nunca se mostraría.`,
      });
      continue;
    }
    if (legal < ply - 1) continue; // game itself is broken before here; already reported
    for (const alt of alts) {
      const chess = new Chess();
      item.moves.slice(0, ply - 1).forEach((m) => chess.move(m, { strict: true }));
      if (!playSan(chess, alt.san)) {
        out.push({
          itemId: item.id,
          rule: "alternative-illegal",
          message: `La alternativa "${alt.san}" no es legal en la media jugada ${ply}.`,
        });
      }
    }
  }

  // Comments keyed by a ply that does not exist. No dedicated rule in the spec: reported as illegal-game.
  for (const key of Object.keys(item.comments ?? {})) {
    const ply = Number(key);
    if (ply < 1 || ply > n) {
      out.push({
        itemId: item.id,
        rule: "illegal-game",
        message: `El comentario en la media jugada ${key} está fuera del rango 1..${n}.`,
      });
    }
  }
}

function checkOpening(item: Opening, out: Issue[]) {
  const check = (label: string, moves: string[]) => {
    const legal = legalPrefix(moves);
    if (legal < moves.length) {
      out.push({
        itemId: item.id,
        rule: "illegal-line",
        message: `${label}: la jugada "${moves[legal]}" (media jugada ${legal + 1}) es ilegal.`,
      });
    }
  };
  for (const line of item.lines) check(`Línea "${line.name}"`, line.moves);
  for (const trap of item.traps ?? []) check(`Trampa "${trap.name}"`, trap.moves);
}

function checkClaims(item: ContentItem, ctx: ValidationContext, out: Issue[]) {
  const results = ctx.engine[item.id] ?? [];
  const seen = new Set<string>();
  for (const claim of item.claims ?? []) {
    if (seen.has(claim.id)) {
      out.push({ itemId: item.id, rule: "duplicate-id", message: `Afirmación repetida "${claim.id}".` });
      continue;
    }
    seen.add(claim.id);
    if (!tryChess(claim.fen)) {
      out.push({
        itemId: item.id,
        rule: "illegal-fen",
        message: `FEN inválido en la afirmación "${claim.id}": "${claim.fen}".`,
      });
    }
    checkClaim(item.id, claim, results.find((r) => r.claimId === claim.id), out);
  }
}

function checkClaim(itemId: string, claim: Claim, r: EngineResult | undefined, out: Issue[]) {
  if (!r) {
    out.push({
      itemId,
      rule: "missing-engine-result",
      message: `La afirmación "${claim.id}" no tiene resultado guardado del motor.`,
    });
  } else if (r.fen !== claim.fen || r.move !== claim.move) {
    out.push({
      itemId,
      rule: "stale-engine-result",
      message: `El resultado guardado de "${claim.id}" es de otra posición o jugada; vuelve a correr el motor.`,
    });
  } else if (!claimPasses(claim, r)) {
    out.push({
      itemId,
      rule: "claim-failed",
      message: `La afirmación "${claim.id}" (${claim.assert}) no se cumple según el motor (profundidad ${r.depth}).`,
    });
  }
}

function checkLinks(item: ContentItem, kindById: Map<string, ContentItem["kind"]>, out: Issue[]) {
  const l = item.links;
  if (!l) return;
  const groups: [string, string[] | undefined, ContentItem["kind"][]][] = [
    ["patterns", l.patterns, ["pattern", "technique"]],
    ["openings", l.openings, ["opening"]],
    ["games", l.games, ["game"]],
    ["combinations", l.combinations, ["combination"]],
  ];
  for (const [name, ids, kinds] of groups) {
    for (const id of ids ?? []) {
      const kind = kindById.get(id);
      if (!kind || !kinds.includes(kind)) {
        out.push({
          itemId: item.id,
          rule: "broken-link",
          message: kind
            ? `El enlace ${name} → "${id}" apunta a una pieza de otro tipo (${kind}).`
            : `El enlace ${name} → "${id}" apunta a un id que no existe.`,
        });
      }
    }
  }
}

export function validateBundle(items: ContentItem[], ctx: ValidationContext): Issue[] {
  const out: Issue[] = [];

  const kindById = new Map<string, ContentItem["kind"]>();
  for (const item of items) {
    if (kindById.has(item.id)) {
      out.push({ itemId: item.id, rule: "duplicate-id", message: `El id "${item.id}" está repetido.` });
    } else {
      kindById.set(item.id, item.kind);
    }
  }

  for (const item of items) {
    switch (item.kind) {
      case "pattern":
      case "technique":
        checkPositions(item, out);
        // Only checked once puzzles have been imported: before that the set is empty and the rule is skipped.
        if (ctx.puzzleThemes.size > 0) {
          for (const theme of item.themes ?? []) {
            if (!ctx.puzzleThemes.has(theme)) {
              out.push({
                itemId: item.id,
                rule: "unknown-theme",
                message: `El tema "${theme}" no existe en los problemas importados.`,
              });
            }
          }
        }
        break;
      case "combination":
        checkCombination(item, out);
        break;
      case "game":
        checkGame(item, ctx, out);
        break;
      case "opening":
        checkOpening(item, out);
        break;
    }
    checkClaims(item, ctx, out);
    checkLinks(item, kindById, out);
  }
  return out;
}
