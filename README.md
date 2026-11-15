# Ajedrez

Entrenador diario de ajedrez en español (PWA): repaso espaciado de problemas, patrones,
aperturas y partidas famosas, en sesiones de hasta 30 minutos.

## Desarrollo

```bash
npm install
npm run dev
npm test
```

## Problemas de Lichess

La base de problemas de Lichess (CC0) pesa unos 300 MB y no se versiona (`data/raw/` está
ignorado). Para importarla:

```bash
mkdir -p data/raw
curl -o data/raw/lichess_db_puzzle.csv.zst https://database.lichess.org/lichess_db_puzzle.csv.zst && zstd -d data/raw/lichess_db_puzzle.csv.zst
npm run puzzles:import -- data/raw/lichess_db_puzzle.csv
```

Escribe `content/puzzles/<tema>.json` (hasta 80 problemas por tema, rating 600-1800) para los
temas de los patrones y técnicas de `content/`, y `content/puzzles/THEMES.json` con todos los
temas del CSV.

## Licencias

- Código: GPL-3.0 (`LICENSE`).
- Contenido (`content/`): CC BY-SA 4.0 (`content/LICENSE`).
- Problemas: base de Lichess (CC0).
