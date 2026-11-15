---
id: notacion-algebraica
title: Notación algebraica
order: 1
sources:
  - title: "Notación algebraica (Wikipedia en español)"
    url: https://es.wikipedia.org/wiki/Notaci%C3%B3n_algebraica
  - title: "Algebraic notation (chess) (Wikipedia)"
    url: https://en.wikipedia.org/wiki/Algebraic_notation_(chess)
examples:
  - fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    solution: ["e2e4"]
    caption: "1.e4: el peón de rey avanza de e2 a e4. Los peones no llevan letra."
  - fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4"
    solution: ["h5f7"]
    caption: "Dxf7#: la dama de h5 captura (x) en f7 y da jaque mate (#), protegida por el alfil de c4."
  - fen: "8/4P1k1/8/8/8/8/8/4K3 w - - 0 1"
    solution: ["e7e8q"]
    caption: "e8=D: el peón llega a la última fila y corona dama."
---
## El tablero tiene coordenadas

Cada casilla tiene un nombre: una **letra** para la columna (de la *a* a la *h*, de
izquierda a derecha desde el lado de las blancas) y un **número** para la fila (del 1 al 8,
desde las blancas). La casilla de abajo a la izquierda de las blancas es *a1*; el rey blanco
empieza en *e1* y el negro en *e8*.

## Cómo se escribe una jugada

Se escribe la **letra de la pieza** y la **casilla de llegada**. En español:

| Pieza | Letra |
|---|---|
| Rey | R |
| Dama | D |
| Torre | T |
| Alfil | A |
| Caballo | C |
| Peón | (sin letra) |

Ejemplos: **Cf3** es "caballo a f3"; **e4** es "peón a e4"; **Dh5** es "dama a h5".

Las jugadas se numeran por parejas: **1.e4 e5** es la primera jugada de las blancas y la
respuesta de las negras. Cuando se escribe solo una jugada de las negras se ponen tres
puntos: **2...Cc6**.

## Signos

- **x** captura: *Axf7* es "el alfil captura en f7". Cuando el que captura es un peón, se
  pone la columna de donde sale: *exd5* es "el peón de la columna e captura en d5".
- **+** jaque: *Axf7+*.
- **#** jaque mate: *Td8#*.
- **O-O** enroque corto (por el lado del rey) y **O-O-O** enroque largo (por el lado de la
  dama).
- **=** coronación: *e8=D* es "el peón llega a e8 y se convierte en dama".

## Cuando dos piezas pueden ir a la misma casilla

Si dos caballos (o dos torres) pueden llegar a la misma casilla, se añade la columna o la
fila de donde sale la pieza: **Cbd7** es "el caballo de la columna b va a d7"; **T1e2** es
"la torre de la fila 1 va a e2".

## Signos de comentario

En los libros y en esta app verás también **!** (buena jugada), **!!** (jugada brillante),
**?** (error) y **??** (error grave). No son parte de la jugada: son la opinión de quien
comenta.

En inglés las letras cambian (K, Q, R, B, N), pero las casillas y los signos son los mismos.
