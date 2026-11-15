# CLAUDE.md

@AGENTS.md

## Propósito

ajedrez es una PWA en español para entrenar ajedrez a diario: repaso espaciado (FSRS) de
problemas, patrones, aperturas y partidas famosas, con sesiones de máximo 30 minutos. Todo
corre en el navegador (progreso en IndexedDB); Stockfish solo se usa en `scripts/`, en el
computador de Sergio, para verificar el contenido.

Docs de diseño y plan: `docs/`.

## Convenciones

- Identificadores y comentarios de código en **inglés**; docs, UI y mensajes de commit en **español** (Conventional Commits).
- Notación visible en español: R, D, T, A, C; peones sin letra. Internamente se usa SAN/UCI en inglés.
- Repo **público** `serandmoncas/ajedrez` (remoto `git@github-serandmoncas:serandmoncas/ajedrez.git`). Código bajo GPL-3.0 (`LICENSE`); textos de `content/` bajo CC BY-SA 4.0 (`content/LICENSE`).
- Sin secretos ni datos personales en el repo. Los respaldos (`*.ajedrez-respaldo.json`) están en `.gitignore`.
- **Solo planes gratuitos**. La app no hace llamadas de red en uso, salvo cargar sus propios archivos estáticos.
- La app no incluye Stockfish; corre solo en `scripts/`.
- Créditos obligatorios en `/creditos`: base de problemas de Lichess (CC0), chessground (GPL-3), chess.js, ts-fsrs y las fuentes de cada contenido.
- Sesión: Repaso ~8 min, Patrón nuevo ~5, Apertura ~5, Partida ~7; tope total 30 min.
- Problemas de Lichess: rating entre 600 y 1800, hasta 80 por tema.
- Versiones exactas (sin `^`) para las dependencias de ajedrez y FSRS.

## Comandos

```bash
npm run dev            # desarrollo
npm run build          # build (prebuild compila el contenido)
npm test               # tests (vitest: src/ y scripts/)
npm run lint           # eslint
npm run content:check  # valida el contenido
npm run engine:check   # Stockfish sobre las afirmaciones (local)
npm run puzzles:import # importa problemas de Lichess
```
