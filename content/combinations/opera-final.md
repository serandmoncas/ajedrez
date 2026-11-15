---
id: opera-final
title: "El final de la partida de la ópera"
order: 1
game:
  white: "Paul Morphy"
  black: "Duque Carlos II de Brunswick y conde Isouard"
  year: 1858
  event: "Partida de consulta, París"
fen: "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16"
solution: ["b3b8", "d7b8", "d1d8"]
expect: mate
sources:
  - title: "Opera Game (Wikipedia)"
    url: https://en.wikipedia.org/wiki/Opera_Game
links:
  games: [partida-de-la-opera]
claims:
  - id: db8-gana
    fen: "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16"
    move: "Qb8+"
    assert: wins
---
Juegan blancas. Es la jugada 16 de la partida de la ópera (París, 1858): Morphy tiene dama,
torre y alfil contra dama, torre, caballo y alfil, pero las piezas negras están atadas. El
caballo de d7 tapa la columna d: es lo único que impide que la torre de d1 llegue a d8. El alfil de g5 controla e7.

**¿Qué encontró Morphy?**

**16.Db8+!!** gana: entrega la dama. Es jaque, y la única respuesta legal es 16...Cxb8, que
saca al caballo de d7 y abre la columna d. Entonces **17.Td8#**: la torre da
jaque desde d8 y el alfil de g5 cubre e7; el rey no tiene adónde ir.

La idea para recordar: cuando una sola pieza estorba el camino hacia la casilla clave,
se la **desvía**, aunque cueste la dama.
