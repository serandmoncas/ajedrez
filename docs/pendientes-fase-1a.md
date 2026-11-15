# Pendientes de la fase 1A

Hallazgos menores de las revisiones que quedaron para después (copiados del registro de ejecución del 2026-11-15). Revisar antes del plan 1B (contenido completo).

- Task 4: minor (deferred): claims.ts:107 mateIn 0 on position treated as win (UCI mate 0 = side to move mated)
- Task 4: minor (deferred): claim.move never legality-checked in its fen; sanToUci permissive
- Task 4: minor (deferred): material test fixture Qxd5 wins a defended knight (bad chess in test)
- Task 4: minor (deferred): wrong comment validate.test.ts:296
- Task 4: minor (deferred): reference PGN with [FEN]/multi-game headers poorly reported
- Task 4: minor (deferred): opening line ids uniqueness not checked (card ids in T9)
- Task 4: minor (deferred): out-of-range comment key reported as illegal-game
- Task 4: minor (deferred): castling rights vs king/rook squares not checked
- Task 5: minor (deferred): flip/mover-perspective mapping untested (extract + test)
- Task 5: minor (deferred): uci.ts waitFor leaks error listeners; hangs if engine exits; stderr undrained
- Task 5: minor (deferred): ENGINE_PATH cwd-relative; spawn "node" vs process.execPath
- Task 5: minor (deferred): illegal claim SAN aborts whole run with stack trace
- Task 5: minor (deferred): stale engine json left when item loses claims
- Task 6: minor (deferred): within-band pick ignores popularity; CLI untested; stale theme files; fixture rows partly hand-edited (not purely real)
- Task 7: minor (deferred): THEMES/puzzle JSON not shape-checked; context.ts untested; version hash key-order sensitive; marked raw HTML (trusted content only); fetch network error not Spanish
- Task 8: minor (deferred): dbPromise cached after openDB rejection (no retry) — relevant to T14 private-mode fallback
- Task 8: minor (deferred): memory store doesn't clone initial/load result (behaves differently from IDB store)
- Task 8: minor (deferred): load() doesn't validate stored doc; no reopen-persistence test
- Task 9: minor (deferred): PATTERN_RESULTS_MAX coupled to schema .max(10); `in` matches prototype keys (use Object.hasOwn); ts-fsrs legacy API deprecated; type test only under tsc; Grade (not Rating) in signatures
- Task 10: minor (deferred): fitReviews uses continue (fills 30 min, may skip a more overdue 1.5-min line card) — add comment
- Task 10: minor (deferred): test gaps: R in (25,30] all blocks; opening dropped before game; empty-block donation keeps later block; extra with R>30
- Task 10: minor (deferred): clunky id split; no RED run recorded
- Task 11: minor (deferred): hint() throws when puzzle done (T13 must disable Pista when done); silent data errors in applyUci/canonicalUci; guess ply range unguarded; normalizeSan duplicated (line.ts & validate.ts); promo coverage gaps in line/guess; THEMES_ES prototype lookup
- Task 12: minor (deferred): invalid FEN throws in effect; Board reset/after/promotion untested; picker not keyboard-accessible; prop updates ignored while picker open
- Task 13: minor (deferred): opponent-first move not highlighted (lastMove from moves[0]); dead "¡Resuelto!" messages since onDone fires immediately; GuessRunner no guard for segment w/o guessing ply or out of range; runners need key remount (document for T14); page raw English fetch errors; test gaps (multi-move, opponent-first, black line); board-mock.tsx in prod folder; miss copy missing period
- Task 13: minor (deferred): puzzle solution numbering ignores FEN fullmove (always "1.")
- Task 14: minor (deferred): /ajustes,/creditos not precached; runtime-only JS caching + cache never pruned; offline errors in English (useAppData, ajustes); backup download revokeObjectURL immediately/link not attached (Safari/Firefox)

## Decisiones tomadas durante la ejecución

- T1 step 8 / T16 | push public repo / deploy | outward-facing → Ruling: deferred to end; ask Sergio |
- T15 step 5 | Sergio reviews content | human gate → Ruling: deferred to final handoff; rest of T15 proceeds |
- T3→T7 | loadContent on content/ | content/ empty until T15 → Ruling: missing dirs yield empty items, no throw |
- T6→T4/T7 | THEMES.json, puzzles/ | may be absent before T15 → Ruling: absent = empty set/record; unknown-theme only fires if a pattern declares themes |
- T8→T9 | SerializedCard vs ts-fsrs Card | Ruling: T8 defines SerializedCard (ts-fsrs Card fields with ISO dates) + toCard/fromCard helpers live in T9 cards.ts |
- T11→T13 | Lesson link status | Lesson needs progress to say "ya la estudiaste" → Ruling: Lesson gets optional prop introduced?: Record<string,string> |
- Task 2: complete (commits 6d75b8a..aa22475, review clean; minor: more formatMoveList tests). Ruling: trailer 'Claude Opus 5.5' is correct per controller attribution reminder.
- Ruling (T4 dispatch): solutions are UCI solver-first alternating; game ply keys 1-based; engine results keyed by item id + claimId; unknown-theme skipped when THEMES empty; material gain default 1 — why: plan silent; cost if wrong: small rework in T4/T7.
- Ruling (T4 concerns accepted): mateIn>=0 = win for side to move in fen; moveMateIn is mover's perspective, 0 = move itself mates → T5 engine-check must store mate this way (invert sign after move; mate 0 after move → moveMateIn 0). SAN strict parse; out-of-range comment ply → illegal-game. — cost if wrong: claim misgrading, caught in T5 manual check.
- Ruling: subagent commits may carry their own model's Co-Authored-By trailer (Sonnet/Haiku) — honest attribution; no rewrite. T5 TDD RED not recorded — accepted (tests exist), noted.
- Ruling (T6 dispatch): Puzzle type lives in src/lib/content/puzzle.ts (browser-safe), imported by scripts and app — why: plan placed it in scripts/lib but app needs it; cost if wrong: import path churn.
- Ruling (T7 dispatch): bundle.ts build-only (may use node:crypto); Bundle/BundleItem/BundlePuzzle types + fetchBundle in browser-safe src/lib/content/bundle-client.ts; BundlePuzzle adds opponentFirst (true Lichess, false custom positions); Node context loading in src/lib/content/context.ts; public/content/ git-ignored. — why: keep client bundle free of Node; cost if wrong: import churn in T9-T14. Later tasks must import Bundle types from @/lib/content/bundle-client.
- Task 7: Ruling: BundleItem Omit is non-distributive over the ContentItem union — real and load-bearing → carry into Task 9 dispatch: make BundleItem distributive in bundle-client.ts.
- Ruling (T9 dispatch): recordPuzzle doesn't review pattern card (session does); config constants in src/lib/srs/config.ts; pure functions; BundleItem made distributive (T7 carry-over) as separate commit.
- Ruling (T10 dispatch): validIds from bundle; pattern pool = themes ∪ custom:<id>; introduced keys: '<openingId>/<lineId>' for lines, item id for intros; blocks dropped whole when budget short (pattern puzzles may shrink 3→1); review first in step order. — cost if wrong: session composition tweaks in T14.
- Task 10: Ruling: when a pattern card's pool is empty after excluding session-used puzzles, skip the step (card stays due) — why: repeating a puzzle corrupts FSRS grading; cost: pattern card waits a day.
- Ruling (T11 dispatch): PuzzleState.index = next user move index; UCI without promo letter on last rank ≡ queen; startLine may take moves param; scoreGuess accepts same move in other notation via chess.js from/to compare; themes-es list given.
- Ruling (T12 dispatch): manual phone check (step 3) deferred to Sergio at handoff; /dev/tablero verified via build+curl then deleted.
- Task 12: Ruling: premovable default enabled can register premoves between move and parent fen update → carry into T13 dispatch: set premovable:{enabled:false} in Board initial config (1-line).
- Task 13: Ruling: line failed = Ver solución OR mistakes >= max(2, ceil(userMovesRequired/2)); Lesson gets titles prop, page loads progress; LineRunner seconds from "Empezar" accepted.
- Ruling (T14): see task-14-rulings.md (step→progress mapping, combo cards created on game completion, capacidades, store fallback, credits, PWA). Gap fixed: plan had no path creating combo cards.
- Task 14: Ruling: introduced-without-card patterns stay "new" (no intro, serve puzzles); empty-pool patterns get a Good card at intro.
- Final review: With fixes (0 critical, 9 important, minors). Ruling: single fix wave covers all Important + selected minors + content; rulings embedded in final-findings.md (game intro step in SessionRunner, demo-first for new lines, lastDailySession optional field, ratedCount optional field, empty-pool items get no card, /biblioteca page, comment-wrong-side rule for alternatives).
