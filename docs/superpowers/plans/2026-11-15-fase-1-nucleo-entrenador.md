# Fase 1A — Núcleo del entrenador de ajedrez (con contenido de muestra) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una PWA instalable en el celular con la sesión diaria completa (repaso, patrón, apertura, partida) funcionando de punta a punta sobre un contenido de muestra pequeño pero ya verificado. Incluye las herramientas para producir el resto del contenido.

**Architecture:** Next.js (App Router) sirve una app que corre del lado del cliente. El contenido vive en `content/` como Markdown con frontmatter. Un build lo valida (zod, chess.js, resultados guardados de Stockfish y fuentes) y lo compila a `public/content/bundle.json`. El progreso se guarda en IndexedDB detrás de `ProgressStore`. La lógica de sesión, FSRS y calificación son funciones puras en `src/lib/`, y la UI solo las llama.

**Tech Stack:** Next.js 16.4.3, React 19.3.0, TypeScript 5, Tailwind 4, Vitest 5 + Testing Library + jsdom, chessground 9.2.1, chess.js 1.4.0, ts-fsrs 6.0.0, idb 8.0.4, gray-matter 4.0.3, marked 18.2.0, zod 4.6.7. Desarrollo: fake-indexeddb 6.2.8, stockfish 19.0.1 (npm, solo para scripts locales), tsx.

**Spec:** `docs/superpowers/specs/2026-11-14-entrenador-ajedrez-design.md`

**Alcance:** este plan **no** escribe la primera versión completa del contenido (~12 patrones, 8 aperturas, 10 partidas, 10 combinaciones). Solo trae una pieza de cada tipo (Task 15). El contenido completo es el plan 1B, por tandas que Sergio aprueba, y usa las herramientas de las Tasks 4–6.

## Global Constraints

- Identificadores y comentarios de código en inglés; docs, UI y mensajes de commit en español (Conventional Commits).
- Notación visible en español: R, D, T, A, C; peones sin letra. Internamente se usa SAN/UCI en inglés.
- Repo **público** `serandmoncas/ajedrez`, remoto `git@github-serandmoncas:serandmoncas/ajedrez.git`. Código bajo GPL-3.0 (`LICENSE`); textos de `content/` bajo CC BY-SA 4.0 (`content/LICENSE`).
- Nunca hay secretos ni datos personales en el repo. Los respaldos exportados (`*.ajedrez-respaldo.json`) van en `.gitignore`.
- Solo planes gratuitos. La app no hace llamadas de red en tiempo de uso, salvo cargar sus propios archivos estáticos.
- La app no incluye Stockfish. Stockfish corre solo en `scripts/` en el computador de Sergio.
- Créditos obligatorios en `/creditos`: base de problemas de Lichess (CC0), chessground (GPL-3), chess.js, ts-fsrs y las fuentes de cada contenido.
- Sesión: Repaso ~8 min, Patrón nuevo ~5, Apertura ~5, Partida ~7. Tope total de 30 min.
- Problemas de Lichess: rating entre 600 y 1800, hasta 80 por tema.
- Versiones exactas en `package.json` (sin `^`) para las dependencias de ajedrez y FSRS.

## Review Focus

1. **Coronación:** problemas y líneas con coronación (UCI `e7e8q`, SAN `e8=D`). Se espera que el tablero pregunte la pieza o corone dama, y que la calificación sea correcta. Test en Task 11.
2. **Primera jugada de los problemas de Lichess:** la primera jugada es del rival. Se espera que la app la juegue sola y que el tablero quede orientado hacia el lado que resuelve. Test en Task 11.
3. **Varias jugadas ganadoras en el último paso:** si el problema termina en mate y el usuario da **otro** mate distinto al de la base, se cuenta como acierto, igual que en Lichess. Test en Task 11.
4. **Contenido que cambia o desaparece:** si una actualización renombra o borra una pieza, el progreso viejo con ids que ya no existen no debe romper la app. Se ignoran sin borrarse. Test en Task 8 y Task 10.
5. **Volver tras semanas sin abrir la app:** con cientos de minutos de repaso vencido, la sesión no pasa de 30 min, no mete material nuevo y prioriza lo más vencido. Test en Task 10.

---

## Estructura de archivos

```
content/                       # contenido fuente (CC BY-SA 4.0)
  patterns/*.md  techniques/*.md  combinations/*.md  games/*.md  openings/*.md
  sources/*.pgn                # PGN de referencia descargados (partidas famosas)
  puzzles/<theme>.json         # subconjunto de la base de Lichess (CC0)
  engine/<contentId>.json      # resultados guardados de Stockfish por afirmación
scripts/
  build-content.ts             # valida y compila -> public/content/bundle.json
  engine-check.ts              # corre Stockfish sobre las afirmaciones (local)
  import-puzzles.ts            # filtra el CSV de Lichess -> content/puzzles/
  lib/                         # código compartido de scripts (con tests)
src/
  lib/notation.ts              # SAN -> notación española
  lib/content/schema.ts        # tipos zod de las 5 clases de contenido
  lib/content/load.ts          # lee content/ (solo Node)
  lib/content/validate.ts      # reglas de verificación
  lib/chess/claims.ts          # criterios de aprobación de afirmaciones con motor
  lib/progress/store.ts        # ProgressStore + implementación IndexedDB
  lib/srs/cards.ts             # ids de tarjetas, FSRS, calificación
  lib/srs/picker.ts            # siguiente problema de un patrón
  lib/srs/rating.ts            # rating estimado tipo Glicko
  lib/session/build.ts         # arma la sesión diaria
  lib/exercises/*.ts           # lógica pura de problema, línea y adivina-la-jugada
  components/Board.tsx         # envoltorio de chessground
  components/runners/*.tsx     # UI de cada ejercicio
  app/                         # páginas: /, /sesion, /capacidades, /aprender/[id], /ajustes, /creditos
public/sw.js                   # service worker
```

---

### Task 1: Repo y esqueleto

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `src/test/setup.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `eslint.config.mjs`, `.gitignore`, `LICENSE`, `content/LICENSE`, `README.md`, `CLAUDE.md`, `AGENTS.md`
- Test: `src/app/page.test.tsx`

**Interfaces:**
- Produces: alias `@/` → `src/`; scripts npm `dev`, `build` (con `prebuild: tsx scripts/build-content.ts`), `test`, `lint`, `content:check`, `engine:check`, `puzzles:import`.

- [ ] **Step 1:** `git init` en `~/Code/ajedrez` (ya existe `docs/`). Crea el proyecto Next.js con las versiones de Global Constraints. Copia la configuración de Vitest y Turbopack/Tailwind de `~/Code/mandarin-ia` (`vitest.config.ts`, `src/test/setup.ts`, regla de Turbopack para CSS).
- [ ] **Step 2: Test que falla:** `page.test.tsx` renderiza `Home` y espera `getByRole("heading", { name: "Ajedrez" })` y un enlace `"Empezar sesión"` con `href="/sesion"`.
- [ ] **Step 3:** Corre `npm test`. Esperado: FAIL.
- [ ] **Step 4:** Implementa `Home` mínima. `layout.tsx` con `lang="es"`.
- [ ] **Step 5:** Corre `npm test && npm run lint`. Esperado: PASS.
- [ ] **Step 6:**
  - `LICENSE`: texto completo de GPL-3.0.
  - `content/LICENSE`: CC BY-SA 4.0.
  - `.gitignore`: `node_modules`, `.next`, `.env*` salvo `.env.example`, `*.ajedrez-respaldo.json`, `data/raw/`.
  - `CLAUDE.md` siguiendo el de mandarin-ia: propósito, convenciones de Global Constraints, comandos.
- [ ] **Step 7: Commit** de docs + esqueleto: `chore: esqueleto Next.js, licencias y docs de diseño`.
- [ ] **Step 8:** **Pedir OK a Sergio** antes de crear el repo público. Luego `gh repo create serandmoncas/ajedrez --public --source . --remote origin`, cambiar el remoto a `git@github-serandmoncas:serandmoncas/ajedrez.git` y hacer `git push -u origin main`.

### Task 2: Notación en español

**Files:** Create `src/lib/notation.ts` · Test `src/lib/notation.test.ts`

**Interfaces:**
- Produces: `toSpanishSan(san: string): string`, `formatMoveList(sans: string[], startPly?: number): string` (p. ej. `"1. e4 e5 2. Cf3"`).

- [ ] **Step 1: Tests que fallan:**
  ```ts
  expect(toSpanishSan("Nf3")).toBe("Cf3");
  expect(toSpanishSan("Bxf7+")).toBe("Axf7+");
  expect(toSpanishSan("Qh5#")).toBe("Dh5#");
  expect(toSpanishSan("Rae1")).toBe("Tae1");
  expect(toSpanishSan("Kxe2")).toBe("Rxe2");
  expect(toSpanishSan("O-O-O")).toBe("O-O-O");
  expect(toSpanishSan("exd8=Q+")).toBe("exd8=D+");
  expect(toSpanishSan("e4")).toBe("e4");
  expect(formatMoveList(["e4","e5","Nf3"])).toBe("1. e4 e5 2. Cf3");
  expect(formatMoveList(["Nc6"], 1)).toBe("1... Cc6");
  ```
- [ ] **Step 2:** Corre `npx vitest run src/lib/notation.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** Implementa. La letra de pieza solo se traduce en la primera posición y después de `=` (las columnas `b`, `d`, `e` son minúsculas y no se tocan).
- [ ] **Step 4:** Corre los tests. Esperado: PASS.
- [ ] **Step 5: Commit** `feat: notación algebraica en español`.

### Task 3: Esquema y carga del contenido

**Files:** Create `src/lib/content/schema.ts`, `src/lib/content/load.ts` · Test `src/lib/content/schema.test.ts`, `src/lib/content/load.test.ts`, fixtures en `src/lib/content/__fixtures__/content/`

**Interfaces:**
- Produces (tipos inferidos de zod, exportados):
  ```ts
  type Source = { title: string; url?: string };
  type Claim = { id: string; fen: string; move?: string /*SAN*/; assert: "wins" | "mistake" | "best" | "equal" };
  type Links = { patterns?: string[]; openings?: string[]; games?: string[]; combinations?: string[] };
  type Position = { fen: string; solution: string[] /*UCI, user moves first*/; caption?: string };
  type Base = { id: string /*kebab-case*/; title: string; order: number; sources: Source[] /*min 1*/; links?: Links; claims?: Claim[]; body: string /*markdown*/ };
  type Pattern     = Base & { kind: "pattern";     themes?: string[]; examples: Position[] /*1-3*/; positions?: Position[] };
  type Technique   = Base & { kind: "technique";   themes?: string[]; examples: Position[]; positions?: Position[] };
  type Combination = Base & { kind: "combination"; game: { white: string; black: string; year: number; event: string }; fen: string; solution: string[] /*UCI*/; expect: "mate" | "material"; materialGain?: number };
  type Game        = Base & { kind: "game"; white: string; black: string; year: number; event: string; site: string; referencePgn: string /*file in content/sources*/; moves: string[] /*SAN from start*/; side: "w" | "b"; segments: { from: number; to: number }[] /*ply ranges, 1-based inclusive*/; alternatives?: Record<string /*ply*/, { san: string; comment: string }[]>; comments?: Record<string /*ply*/, string> };
  type Opening     = Base & { kind: "opening"; eco: string; lines: { id: string; name: string; side: "w" | "b"; moves: string[] /*SAN, max 24 plies*/; idea: string }[]; traps?: { name: string; moves: string[]; comment: string }[] };
  type ContentItem = Pattern | Technique | Combination | Game | Opening;
  const contentItemSchema: z.ZodType<ContentItem>; // discriminatedUnion on "kind"
  function loadContent(dir: string): Promise<{ items: ContentItem[]; errors: { file: string; message: string }[] }>;
  ```
- Regla del spec que impone el esquema: un `pattern` necesita `themes` (≥1) **o** `positions` (≥10). Un `opening` tiene líneas de máximo 24 medias jugadas (~12 jugadas).

- [ ] **Step 1: Tests que fallan (schema):**
  - un patrón con `themes: ["backRankMate"]` y 1 ejemplo pasa;
  - un patrón sin `themes` y con 9 `positions` falla con un mensaje que contiene `"themes"`;
  - `sources: []` falla;
  - un `id` con mayúsculas falla;
  - una línea de apertura con 25 jugadas falla.
- [ ] **Step 2:** Corre los tests. Esperado: FAIL.
- [ ] **Step 3:** Implementa `schema.ts`.
- [ ] **Step 4: Test que falla (load):** `loadContent(fixturesDir)` con 2 archivos válidos y 1 con frontmatter roto devuelve `items.length === 2` y `errors[0].file` terminado en el nombre del roto. `body` es el Markdown sin frontmatter. `kind` se toma de la carpeta (`patterns/` → `"pattern"`) y debe coincidir si viene en el frontmatter.
- [ ] **Step 5:** Implementa `load.ts` con gray-matter y fs. Corre los tests. Esperado: PASS.
- [ ] **Step 6: Commit** `feat: esquema y carga del contenido`.

### Task 4: Verificación del contenido

**Files:** Create `src/lib/content/validate.ts`, `src/lib/chess/claims.ts` · Test `src/lib/content/validate.test.ts`, `src/lib/chess/claims.test.ts`

**Interfaces:**
- Consumes: `ContentItem` (Task 3).
- Produces:
  ```ts
  type EngineResult = { claimId: string; fen: string; move?: string; depth: number; evalCp?: number /*side to move*/; mateIn?: number; bestMove: string /*UCI*/; moveEvalCp?: number; moveMateIn?: number };
  function claimPasses(claim: Claim, r: EngineResult): boolean;
  type Issue = { itemId: string; rule: string; message: string };
  function validateBundle(items: ContentItem[], ctx: { engine: Record<string, EngineResult[]>; referencePgns: Record<string, string>; puzzleThemes: Set<string> }): Issue[];
  ```
- **Criterios de `claimPasses`** *(defaults; el spec los deja al constructor)*. Evaluaciones en centipeones desde el lado que mueve en `fen`; un mate cuenta como ±10000:
  - `wins` → la evaluación de la posición (o de `move`, si viene) es ≥ +200, o es mate a favor;
  - `mistake` → `move` pierde ≥ 100 respecto a `bestMove`;
  - `best` → `move` es `bestMove` o está a ≤ 30 de él;
  - `equal` → |eval| ≤ 50.
  - La profundidad debe ser ≥ 20; si no, la afirmación falla.

- [ ] **Step 1: Tests que fallan (claims):** un caso de cada criterio que pasa y uno que no; con `depth: 18` falla aunque la evaluación cuadre.
- [ ] **Step 2:** Implementa `claimPasses`. Corre los tests. Esperado: PASS.
- [ ] **Step 3: Tests que fallan (validate)**, una regla por test, con el nombre de regla esperado en `issue.rule`:
  - `illegal-fen`: FEN inválido en cualquier `examples`/`positions`/`fen`;
  - `illegal-solution`: una jugada UCI ilegal en `solution`;
  - `combination-outcome`: con `expect: "mate"` la secuencia no termina en jaque mate; con `expect: "material"` el balance de material (P1, C3, A3, T5, D9) del lado que resuelve no sube al menos `materialGain`;
  - `illegal-game`: `moves` de una partida no es una partida legal;
  - `reference-mismatch`: `moves` difiere de `referencePgns[referencePgn]` (compara SAN jugada por jugada e informa la primera media jugada distinta);
  - `bad-segment`: segmentos fuera de rango, superpuestos o desordenados;
  - `alternative-illegal`: una alternativa no es legal en esa media jugada;
  - `illegal-line`: una línea o trampa de apertura no es legal;
  - `broken-link`: un enlace apunta a un id inexistente o de otro tipo;
  - `missing-engine-result` / `claim-failed`: una afirmación sin resultado guardado o cuyo resultado no pasa `claimPasses`;
  - `stale-engine-result`: el `fen` o `move` guardado no coincide con la afirmación actual;
  - `unknown-theme`: un tema de patrón o técnica que no está en `puzzleThemes`;
  - `duplicate-id`: dos piezas con el mismo id.
- [ ] **Step 4:** Implementa `validateBundle` con chess.js. Corre los tests. Esperado: PASS.
- [ ] **Step 5: Commit** `feat: verificación de legalidad, fuentes y afirmaciones del contenido`.

### Task 5: Script de Stockfish (local)

**Files:** Create `scripts/engine-check.ts`, `scripts/lib/uci.ts` · Test `scripts/lib/uci.test.ts` (incluido en el `include` de Vitest)

**Interfaces:**
- Consumes: `loadContent`, `Claim`, `EngineResult`, `claimPasses`.
- Produces: `parseInfoLine(line: string): { depth: number; cp?: number; mate?: number; pv: string[] } | null`; CLI `npm run engine:check [-- --id <contentId>] [--depth 22]` que escribe `content/engine/<contentId>.json` (un `EngineResult[]`) e imprime una tabla pasa/falla.

- [ ] **Step 1: Tests que fallan:** `parseInfoLine("info depth 22 seldepth 30 multipv 1 score cp 145 nodes 1 pv e2e4 e7e5")` → `{depth:22, cp:145, pv:["e2e4","e7e5"]}`; `"... score mate -3 ... pv h7h8"` → `mate:-3`; `"bestmove e2e4"` → `null`.
- [ ] **Step 2:** Implementa `parseInfoLine`. Corre los tests. Esperado: PASS.
- [ ] **Step 3:** Implementa el CLI con el paquete npm `stockfish` (19.0.1, devDependency) en modo Node, por UCI.
  - Por cada afirmación: `position fen <fen>` → `go depth N` para la evaluación y la mejor jugada.
  - Si hay `move`: `position fen <fen> moves <uci>` → `go depth N-1` y se invierte el signo, así `moveEvalCp` queda en la perspectiva del que movió.
  - Los SAN se convierten a UCI con chess.js.
- [ ] **Step 4: Verificación manual:** crea una afirmación temporal en un fixture (`fen` del mate del pasillo, `assert: "wins"`) y corre `npm run engine:check -- --id <id>`. Esperado: archivo JSON escrito y la fila marcada "pasa". Borra el fixture.
- [ ] **Step 5: Commit** `feat: script local de verificación con Stockfish`.

### Task 6: Importar problemas de Lichess

**Files:** Create `scripts/import-puzzles.ts`, `scripts/lib/puzzles.ts` · Test `scripts/lib/puzzles.test.ts`, fixture `scripts/lib/__fixtures__/puzzles.csv` (~30 filas reales)

**Interfaces:**
- Produces:
  ```ts
  type Puzzle = { id: string; fen: string /*before opponent's move*/; moves: string[] /*UCI; [0] is opponent's*/; rating: number; themes: string[] };
  function parsePuzzleRow(line: string): (Puzzle & { popularity: number; nbPlays: number }) | null; // CSV: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
  function selectPuzzles(rows: Iterable<ReturnType<typeof parsePuzzleRow>>, themes: string[], opts?: { min?: 600; max?: 1800; perTheme?: 80; minPopularity?: 80; minPlays?: 500 }): Record<string, Puzzle[]>;
  ```
- CLI: `npm run puzzles:import -- data/raw/lichess_db_puzzle.csv`. Los temas salen de todos los `patterns` y `techniques` de `content/`. El CLI lee el CSV línea por línea (sin cargarlo entero) y escribe `content/puzzles/<theme>.json` y `content/puzzles/THEMES.json` (todos los temas vistos en el CSV, para `unknown-theme`).

- [ ] **Step 1: Tests que fallan:**
  - `parsePuzzleRow` de la cabecera → `null`;
  - de una fila → `moves.length ≥ 2`, `themes` partido por espacios;
  - `selectPuzzles(rows, ["backRankMate"], { perTheme: 5 })` → 5 problemas, todos con rating en [600,1800] y popularidad ≥ 80, repartidos por rating (ordenados de menor a mayor, sin quedarse solo con los primeros 5 del archivo).
- [ ] **Step 2:** Implementa. Para repartir por rating: agrupa por franjas de 100 puntos y toma por turnos de cada franja. Corre los tests. Esperado: PASS.
- [ ] **Step 3:** En el README, documenta la descarga: `curl -o data/raw/lichess_db_puzzle.csv.zst https://database.lichess.org/lichess_db_puzzle.csv.zst && zstd -d data/raw/lichess_db_puzzle.csv.zst`. `data/raw/` está ignorado.
- [ ] **Step 4: Commit** `feat: importación de problemas de Lichess por tema`.

### Task 7: Compilar el bundle de contenido

**Files:** Create `scripts/build-content.ts`, `src/lib/content/bundle.ts` · Test `src/lib/content/bundle.test.ts`, `src/lib/content/real-content.test.ts`

**Interfaces:**
- Consumes: Tasks 3, 4, 6.
- Produces:
  ```ts
  type BundleItem = Omit<ContentItem, "body" | "claims"> & { html: string };
  type Bundle = { version: string /*hash sha256 del contenido, 12 chars*/; items: BundleItem[]; puzzles: Record<string, Puzzle[]> };
  function compileBundle(items: ContentItem[], puzzles: Record<string, Puzzle[]>): Bundle; // markdown->html con marked; las `positions` de patrones/técnicas se agregan como puzzles[`custom:<id>`] con id `<id>#<n>`, moves = solution, rating 0, themes = []
  async function fetchBundle(): Promise<Bundle>; // cliente: GET /content/bundle.json
  ```
- CLI: `tsx scripts/build-content.ts` carga, valida (con `content/engine/`, `content/sources/` y `THEMES.json`) y, si hay problemas, los imprime y sale con código 1; si no, escribe `public/content/bundle.json`. `npm run content:check` hace lo mismo sin escribir.

- [ ] **Step 1: Test que falla:** `compileBundle` convierte `**hola**` en `<strong>hola</strong>`, quita `claims` y mantiene `version` estable para la misma entrada y distinta si cambia un texto.
- [ ] **Step 2:** Implementa. Corre los tests. Esperado: PASS.
- [ ] **Step 3:** `real-content.test.ts` corre `loadContent("content")` + `validateBundle` sobre el contenido real y espera `issues` vacío. Así, `npm test` falla si alguien sube contenido roto.
- [ ] **Step 4: Commit** `feat: compilación y validación del contenido en el build`.

### Task 8: Progreso en el dispositivo

**Files:** Create `src/lib/progress/types.ts`, `src/lib/progress/store.ts` · Test `src/lib/progress/store.test.ts` (con `fake-indexeddb/auto`)

**Interfaces:**
- Produces:
  ```ts
  type Progress = {
    schemaVersion: 1;
    cards: Record<string /*cardId*/, SerializedCard /*ts-fsrs Card con fechas ISO*/>;
    seenPuzzles: Record<string /*puzzleId*/, string /*ISO*/>;
    patternResults: Record<string /*patternId*/, boolean[] /*últimos primeros intentos en problemas nuevos, máx 10*/>;
    introduced: Record<string /*contentId*/, string /*ISO*/>;
    games: Record<string /*gameId*/, { segment: number; full: number; partial: number; miss: number; done: boolean }>;
    rating: { r: number; rd: number; updatedAt: string };
  };
  function emptyProgress(now: Date): Progress; // rating {r:1200, rd:350}
  interface ProgressStore { load(): Promise<Progress>; save(p: Progress): Promise<void>; exportJson(): Promise<string>; importJson(json: string): Promise<void> }
  function createIndexedDbStore(dbName?: "ajedrez"): ProgressStore;
  function createMemoryStore(initial?: Progress): ProgressStore; // tests y respaldo si IndexedDB no está
  ```
- Un documento único bajo la clave `"progress"`. Así la fase 3 cambia la implementación (Supabase) sin tocar el resto.

- [ ] **Step 1: Tests que fallan:**
  - `load()` en una base vacía → `emptyProgress`;
  - `save` y luego `load` → igual;
  - `exportJson` → `importJson` en otro store → igual;
  - `importJson("{")` lanza `Error` con mensaje en español (`"El respaldo no es válido"`) y **no** cambia lo guardado;
  - `importJson` de un respaldo con `schemaVersion: 2` lanza error;
  - un progreso con ids que ya no existen en el contenido se carga sin cambios (el store no conoce el contenido).
- [ ] **Step 2:** Implementa con `idb`. Valida la importación con zod. Corre los tests. Esperado: PASS.
- [ ] **Step 3: Commit** `feat: progreso en IndexedDB con exportar/importar`.

### Task 9: Tarjetas, calificación y rating

**Files:** Create `src/lib/srs/cards.ts`, `src/lib/srs/picker.ts`, `src/lib/srs/rating.ts` · Tests al lado

**Interfaces:**
- Consumes: `Progress`, `Bundle`, `Puzzle`.
- Produces:
  ```ts
  type CardId = `pattern:${string}` | `puzzle:${string}` | `line:${string}/${string}` | `combo:${string}`;
  type Attempt = { firstTry: boolean; usedHint: boolean; failed: boolean; seconds: number; userMoves: number };
  function gradeAttempt(a: Attempt): Rating; // ts-fsrs Rating
  function reviewCard(p: Progress, id: CardId, rating: Rating, now: Date): Progress; // crea la tarjeta si no existe
  function dueCards(p: Progress, now: Date, validIds: Set<CardId>): { id: CardId; due: Date; overdueDays: number }[]; // más vencidas primero; ignora ids que no están en validIds
  function recordPuzzle(p: Progress, patternId: string, puzzleId: string, a: Attempt, now: Date): Progress; // marca visto; si falló crea tarjeta puzzle:<id>; si era nuevo registra en patternResults
  function isMastered(p: Progress, patternId: string, now: Date): boolean;
  function nextPuzzleForPattern(p: Progress, puzzles: Puzzle[], now: Date): Puzzle | null; // nunca vistos (rating ascendente) y luego el visto hace más tiempo
  function updateRating(r: { r: number; rd: number }, puzzleRating: number, solved: boolean): { r: number; rd: number }; // Glicko-1, RD del problema = 80, RD mínimo 50
  ```
- **Calificación** *(defaults; ajustables en `src/lib/srs/config.ts`)*:
  - `failed` → Again;
  - `usedHint` o `!firstTry` → Hard;
  - primer intento y `seconds / userMoves ≤ 10` → Easy;
  - si no → Good.
- **Dominado** *(defaults)*: la tarjeta `pattern:<id>` tiene `stability ≥ 21` días **y** los últimos 3 de `patternResults[id]` son `true`.

- [ ] **Step 1: Tests que fallan:**
  - cada rama de `gradeAttempt`;
  - `reviewCard` con Good sobre una tarjeta nueva deja `due > now`;
  - `dueCards` ordena por `overdueDays` descendente y descarta `combo:borrada` si no está en `validIds`;
  - `nextPuzzleForPattern` devuelve primero uno no visto y, con todos vistos, el más antiguo;
  - `recordPuzzle` con un fallo crea `puzzle:<id>`;
  - `isMastered` es false con 2 aciertos y true con 3 y estabilidad suficiente;
  - `updateRating({r:1200,rd:350}, 1200, true).r > 1200` y `rd < 350`.
- [ ] **Step 2:** Implementa. Corre los tests. Esperado: PASS.
- [ ] **Step 3: Commit** `feat: tarjetas FSRS, calificación automática y rating estimado`.

### Task 10: Armar la sesión diaria

**Files:** Create `src/lib/session/build.ts`, `src/lib/session/config.ts` · Test `src/lib/session/build.test.ts`

**Interfaces:**
- Consumes: Tasks 7–9.
- Produces:
  ```ts
  type SessionStep =
    | { block: "review"; card: CardId; patternId?: string; puzzle?: Puzzle }
    | { block: "pattern"; item: "intro" | "puzzle"; contentId: string; puzzle?: Puzzle }
    | { block: "opening"; item: "intro" | "line"; openingId: string; lineId: string }
    | { block: "game"; gameId: string; segment: number };
  type SessionPlan = { steps: SessionStep[]; estimatedMinutes: number; newMaterial: boolean };
  function buildSession(bundle: Bundle, p: Progress, now: Date, opts?: { extra?: boolean; allowNew?: boolean }): SessionPlan;
  ```
- **Reglas** (del spec; los minutos por ítem son defaults en `config.ts`: problema 1, línea 1.5, intro 2, tramo de partida 7):
  - Presupuesto: Repaso 8 min, Patrón 5, Apertura 5, Partida 7. Total ≤ 30.
  - Cada bloque avanza por su lista ordenada (`order`), en pistas paralelas. Patrón nuevo = el primer `pattern` o `technique` sin `introduced`: intro + 3 problemas de sus temas (o de sus `positions`).
  - Si el repaso vencido excede su presupuesto, usa el tiempo de los bloques nuevos, en este orden: patrón, apertura, partida. Si el repaso pasa de 30, la sesión es solo repaso (los 30 min más vencidos) y `newMaterial: false`.
  - Si un bloque se queda sin material, su tiempo pasa al repaso.
  - La partida en curso continúa con su siguiente segmento; al terminarla empieza la siguiente por `order`.
  - `extra: true` → solo repaso y `newMaterial: false`, salvo `allowNew: true`.
  - Los ids de tarjetas que no existen en el bundle se ignoran (Review Focus 4).

- [ ] **Step 1: Tests que fallan:**
  - progreso vacío → bloques `pattern`, `opening`, `game` presentes y `estimatedMinutes ≤ 30`;
  - **500 tarjetas vencidas** (Review Focus 5) → solo pasos `review`, `estimatedMinutes ≤ 30`, `newMaterial === false`, y la primera es la más vencida;
  - 12 min de repaso vencido → el bloque `pattern` desaparece antes que `opening`;
  - todo introducido → sin bloque `pattern`, más repaso;
  - `extra: true` → sin material nuevo;
  - tarjeta `line:apertura-borrada/x` ignorada;
  - partida con segmento 2 de 3 hecho → paso `game` con `segment: 2` (índice 0-based del siguiente).
- [ ] **Step 2:** Implementa. Corre los tests. Esperado: PASS.
- [ ] **Step 3: Commit** `feat: armado de la sesión diaria con tope de 30 minutos`.

### Task 11: Lógica pura de los ejercicios

**Files:** Create `src/lib/exercises/puzzle.ts`, `src/lib/exercises/line.ts`, `src/lib/exercises/guess.ts` · Tests al lado

**Interfaces:**
- Produces:
  ```ts
  // Problema (Lichess: moves[0] la juega el rival automáticamente). Posiciones propias: offset 0.
  type PuzzleState = { fen: string; orientation: "white" | "black"; index: number; mistakes: number; hintLevel: 0 | 1 | 2; done: boolean; solved: boolean };
  function startPuzzle(fen: string, moves: string[], opts: { opponentFirst: boolean }): PuzzleState; // aplica moves[0] si opponentFirst; orientation = lado que resuelve
  function playPuzzleMove(s: PuzzleState, moves: string[], uci: string): { state: PuzzleState; result: "correct" | "wrong" | "solved"; reply?: string };
  function hint(s: PuzzleState, moves: string[], themes: string[]): { state: PuzzleState; text: string }; // nivel 1: "Busca: <tema en español>"; nivel 2: "Mueve <pieza en español> de <casilla>"
  // Línea de apertura
  type LineState = { fen: string; ply: number; mistakes: number; done: boolean };
  function startLine(side: "w" | "b"): LineState; // si side=b, juega sola la primera jugada blanca
  function playLineMove(s: LineState, moves: string[], san: string, side: "w" | "b"): { state: LineState; result: "correct" | "wrong" | "done"; expected?: string };
  // Adivina la jugada
  type GuessResult = { kind: "full" | "partial" | "miss"; masterSan: string; comment?: string };
  function scoreGuess(game: Game, ply: number, guessSan: string): GuessResult;
  ```
- **Reglas:**
  - Una jugada equivocada en un problema cuenta como error, deshace la jugada y deja seguir. El intento queda como `firstTry: false`.
  - En el **último** paso, cualquier jugada que dé mate se acepta (Review Focus 3).
  - Al coronar, el UCI lleva la pieza (`e7e8q`). Coronar otra pieza distinta de la esperada es error, salvo que también dé mate en el último paso.
  - SAN se compara normalizado: sin `+`, `#`, `!` ni `?`.

- [ ] **Step 1: Tests que fallan:**
  - un problema real de Lichess del fixture (Task 6) arranca con la jugada del rival ya aplicada y `orientation` del otro color (Review Focus 2);
  - un problema de coronación `["…", "e7e8q"]` acepta `e7e8q` y rechaza `e7e8r` (Review Focus 1);
  - un problema de mate en 1 con dos mates posibles acepta ambos;
  - `hint` nivel 1 con tema `fork` → `"Busca: horquilla"`; nivel 2 → `"Mueve el caballo de f3"`;
  - `startLine("b")` deja `ply: 1`;
  - `scoreGuess` → `full` con la jugada del maestro, `partial` con una alternativa (con su comentario), `miss` con otra jugada;
  - `scoreGuess` acepta `"Qb8+"` y `"Qb8"` como la misma jugada.
- [ ] **Step 2:** Implementa con chess.js. Los nombres de temas en español van en `src/lib/exercises/themes-es.ts`, con al menos los temas del contenido de muestra y los de la ruta del spec. Corre los tests. Esperado: PASS.
- [ ] **Step 3: Commit** `feat: lógica de problemas, líneas y adivina la jugada`.

### Task 12: Tablero

**Files:** Create `src/components/Board.tsx`, `src/lib/chess/dests.ts` · Test `src/lib/chess/dests.test.ts`, `src/components/Board.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  function legalDests(fen: string): Map<string, string[]>; // formato de chessground (from -> [to])
  type BoardProps = { fen: string; orientation: "white" | "black"; movable: boolean; lastMove?: [string, string]; shapes?: { orig: string; dest?: string; brush: "green" | "red" | "blue" }[]; onMove?: (uci: string) => void };
  function Board(props: BoardProps): JSX.Element; // "use client"
  ```
- Al soltar un peón en la última fila se muestra un selector de pieza (D, T, A, C) antes de llamar a `onMove(uci+pieza)`. Importa el CSS de chessground (base, brown, cburnett).

- [ ] **Step 1: Tests que fallan:** `legalDests` de la posición inicial tiene 10 orígenes y `g1 → [f3, h3]`. `Board` monta sin error en jsdom y crea un elemento `.cg-wrap` (con chessground real; si jsdom no lo soporta, prueba solo que el contenedor existe).
- [ ] **Step 2:** Implementa. Monta chessground en un `useEffect` y actualízalo con `api.set` cuando cambian las props. Corre los tests. Esperado: PASS.
- [ ] **Step 3: Verificación manual:** página temporal `/dev/tablero` en `npm run dev`. En el celular (misma red) se arrastra y se toca para mover. Borra la página.
- [ ] **Step 4: Commit** `feat: tablero chessground con jugadas legales y coronación`.

### Task 13: Pantallas de ejercicios y lecciones

**Files:** Create `src/components/runners/PuzzleRunner.tsx`, `LineRunner.tsx`, `GuessRunner.tsx`, `src/components/Lesson.tsx`, `src/app/aprender/[id]/page.tsx` · Tests `*.test.tsx`

**Interfaces:**
- Consumes: Tasks 11, 12, `BundleItem`.
- Produces:
  ```ts
  function PuzzleRunner(p: { fen: string; moves: string[]; themes: string[]; opponentFirst: boolean; onDone: (a: Attempt) => void }): JSX.Element;
  function LineRunner(p: { opening: Opening; lineId: string; onDone: (a: Attempt) => void }): JSX.Element; // muestra "idea" antes de empezar
  function GuessRunner(p: { game: Game; segment: number; onDone: (r: { full: number; partial: number; miss: number }) => void }): JSX.Element; // juega solo las jugadas del rival
  function Lesson(p: { item: BundleItem; onContinue: () => void }): JSX.Element; // html + ejemplos en tableros + enlaces ("ya la estudiaste" / "la verás más adelante")
  ```
- Todo el texto visible está en español y las jugadas se muestran con `toSpanishSan`. Botones: "Pista", "Ver solución" (cuenta como fallo), "Continuar".

- [ ] **Step 1: Tests que fallan (con Testing Library, simulando `onMove` del `Board` mockeado):**
  - `PuzzleRunner`: resolverlo llama `onDone` con `firstTry: true`; pedir pista y resolver da `usedHint: true`; "Ver solución" da `failed: true`;
  - `GuessRunner`: un segmento de 2 jugadas del lado que adivina, con una correcta y una alternativa, da `{full:1, partial:1, miss:0}`, y el comentario de la alternativa se ve en pantalla;
  - `Lesson`: renderiza el `html` y un enlace a una apertura enlazada.
- [ ] **Step 2:** Implementa. Corre los tests. Esperado: PASS.
- [ ] **Step 3: Commit** `feat: pantallas de problemas, líneas, partidas y lecciones`.

### Task 14: Sesión, capacidades, ajustes, créditos y PWA

**Files:** Create `src/app/sesion/page.tsx`, `src/components/SessionRunner.tsx`, `src/app/capacidades/page.tsx`, `src/app/ajustes/page.tsx`, `src/app/creditos/page.tsx`, `src/app/manifest.ts`, `public/sw.js`, `src/components/RegisterSW.tsx`, `public/icons/*` · Tests `SessionRunner.test.tsx`, `capacidades.test.tsx`

**Interfaces:**
- Consumes: `fetchBundle`, `ProgressStore`, `buildSession`, runners, `reviewCard`, `recordPuzzle`, `updateRating`, `isMastered`.
- Produces: `SessionRunner({ bundle, store, now })`, que recorre `SessionPlan.steps`, aplica cada resultado al progreso y guarda tras **cada** paso (si se cierra la app a mitad, no se pierde lo hecho).

- [ ] **Step 1: Tests que fallan:**
  - `SessionRunner` con un bundle de muestra y un store en memoria: tras completar el primer problema, `store.load()` ya tiene `seenPuzzles` con ese id;
  - al final se ve "Sesión terminada" y un botón "Sesión extra (solo repaso)";
  - `capacidades` muestra los patrones dominados / total, las aperturas por línea dominada, las partidas recorridas con % de acierto y el rating redondeado. **No** muestra rachas ni puntos.
- [ ] **Step 2:** Implementa.
  - Ajustes: "Exportar respaldo" descarga `AAAA-MM-DD.ajedrez-respaldo.json`; "Importar respaldo" pide confirmación y muestra el error en español si falla.
  - Si IndexedDB no abre (p. ej., navegación privada), se usa `createMemoryStore` con el aviso visible "Tu progreso no se guardará en este modo".
- [ ] **Step 3:** PWA:
  - `manifest.ts` como el de mandarin-ia (`name: "Ajedrez"`, `lang: "es"`, `display: "standalone"`).
  - `sw.js`: precarga `/`, `/sesion`, `/capacidades`, `/content/bundle.json`; cache-first para estáticos y network-first para `bundle.json`, con respaldo en caché.
  - `RegisterSW` lo registra solo en producción.
- [ ] **Step 4:** Corre `npm test && npm run build`. Esperado: PASS y build sin errores.
- [ ] **Step 5: Verificación manual:** `npm run build && npm start`, abrir en el celular e instalar. Activar el modo avión y recargar: la sesión sigue funcionando.
- [ ] **Step 6: Commit** `feat: sesión diaria, capacidades, respaldo, créditos y PWA`.

### Task 15: Contenido de muestra verificado

**Files:** Create:
- `content/patterns/mate-del-pasillo.md` (tema `backRankMate`)
- `content/techniques/notacion-algebraica.md`
- `content/openings/italiana.md`
- `content/games/partida-de-la-opera.md` (Morphy vs. duque de Brunswick y conde Isouard, París 1858)
- `content/combinations/opera-final.md` (16.Db8+!! Cxb8 17.Td8#)
- `content/sources/morphy-opera-1858.pgn`
- `content/puzzles/*.json` (de Task 6)
- `content/engine/*.json` (de Task 5)

**Interfaces:**
- Consumes: el esquema de Task 3. Produce un `bundle.json` real.

- [ ] **Step 1:** Descarga el CSV de Lichess (README, Task 6) y corre `npm run puzzles:import`. Esperado: `content/puzzles/backRankMate.json` con ≤ 80 problemas y `THEMES.json`.
- [ ] **Step 2:** Escribe las 5 piezas en español. Cada una lleva `sources`: Wikipedia de la Partida de la Ópera, y Wikipedia o el explorador de Lichess para la Italiana. Las frases con "gana", "es un error", "es la mejor" o "iguala" llevan su `claim`. El PGN de referencia se descarga de una base pública (p. ej., la de Lichess o chessgames) y su URL queda citada en `sources`.
- [ ] **Step 3:** Corre `npm run engine:check`. Esperado: todas las afirmaciones "pasa". Si alguna falla, se corrige el **texto**; nunca se cambia el criterio.
- [ ] **Step 4:** Corre `npm run content:check && npm test`. Esperado: sin issues y PASS.
- [ ] **Step 5:** **Sergio revisa** las 5 piezas en `/aprender/<id>` (`npm run dev`) y aprueba.
- [ ] **Step 6: Commit** `content: muestra verificada (pasillo, notación, Italiana, Ópera)`.

### Task 16: Publicar en Vercel

- [ ] **Step 1:** Con OK de Sergio: `vercel link` en el equipo `serandmoncas-6387s-projects` (proyecto `ajedrez`) y `vercel deploy --prod`. El clasificador ha bloqueado antes este comando para Claude, así que Sergio lo puede correr con `! vercel deploy --prod`.
- [ ] **Step 2: Verificación:** abrir la URL de producción en el celular, instalar y completar una sesión. Revisar que `/creditos` muestre las licencias.
- [ ] **Step 3:** Añadir la URL al README. **Commit** `docs: URL de producción`.

---

## Siguiente plan (1B): contenido completo

Se trabaja por tandas de 3–5 piezas con el flujo de Task 15:
1. Sergio aprueba la lista.
2. Claude escribe los borradores con fuentes y afirmaciones.
3. Se corren `engine:check` y `content:check`.
4. Sergio revisa en la app.
5. Commit.

Meta del spec: ~12 patrones, 8 aperturas, 10 partidas y 10 combinaciones, más las técnicas de fundamentos y finales elementales.
