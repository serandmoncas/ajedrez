---
id: mate-del-pasillo
title: Mate del pasillo
order: 2
themes: [backRankMate]
sources:
  - title: "Back-rank checkmate (Wikipedia)"
    url: https://en.wikipedia.org/wiki/Back-rank_checkmate
  - title: "Problemas de Lichess con el tema backRankMate (CC0)"
    url: https://lichess.org/training/backRankMate
examples:
  - fen: "6k1/5ppp/8/8/8/8/1r3PPP/3R2K1 w - - 0 1"
    solution: ["d1d8"]
    caption: "Juegan blancas: Td8#. Los peones f7, g7 y h7 encierran a su propio rey."
  - fen: "3rr1k1/5ppp/8/q7/8/8/4QPPP/4R1K1 w - - 0 1"
    solution: ["e2e8", "d8e8", "e1e8"]
    caption: "Juegan blancas: 1.Dxe8+! Txe8 2.Txe8#. La dama se entrega para eliminar al defensor de la última fila."
  - fen: "6k1/5pp1/7p/8/8/8/1r3PPP/3R2K1 w - - 0 1"
    solution: ["d1d8", "g8h7"]
    caption: "Con el peón en h6 (luft), Td8+ ya no es mate: el rey sale por h7."
claims:
  - id: ejemplo-1-mate
    fen: "6k1/5ppp/8/8/8/8/1r3PPP/3R2K1 w - - 0 1"
    move: "Rd8#"
    assert: wins
  - id: ejemplo-2-sacrificio
    fen: "3rr1k1/5ppp/8/q7/8/8/4QPPP/4R1K1 w - - 0 1"
    move: "Qxe8+"
    assert: wins
  - id: ejemplo-3-luft-iguala
    fen: "6k1/5pp1/7p/8/8/8/1r3PPP/3R2K1 w - - 0 1"
    assert: equal
---
## La idea

El rey se enroca, los peones de delante (f, g y h) se quedan en su casilla y protegen al
rey... hasta que una torre o una dama enemiga llega a la **última fila**. Entonces esos
mismos peones son una pared: el rey no tiene adónde ir y un jaque en la fila de atrás es
mate. Por eso se llama mate del **pasillo**: el rey está encerrado en un corredor.

Lo que hay que mirar en cada partida:

1. ¿El rey rival tiene casillas libres delante? Si sus tres peones siguen en la segunda
   fila (séptima para las negras), no.
2. ¿Quién defiende la última fila? Si la defiende una sola pieza, se puede **eliminar o
   desviar** a esa pieza, muchas veces entregando material, como en el segundo ejemplo.
3. ¿Puedo llegar a la fila con una torre o con la dama dando jaque?

En el primer ejemplo Td8# gana de inmediato. En el segundo, 1.Dxe8+! gana porque, tras
1...Txe8, la torre de e1 da mate en e8: las negras tenían más material, pero su última fila
estaba defendida solo por las torres.

## Cómo defenderse

- **Hacer luft** ("aire" en alemán): mover uno de los peones del enroque, por ejemplo h3 (o
  ...h6 con negras), para que el rey tenga una casilla de escape. En el tercer ejemplo, con
  el peón en h6, Td8+ ya no es mate y la posición está igualada.
- **No dejar sola la última fila**: mantener una torre o la dama vigilándola mientras haya
  piezas pesadas enemigas.
- Antes de mover la torre que defiende la fila de atrás, preguntarse: "¿y si me dan jaque
  ahí?".

Hacer luft cuesta un tiempo, así que se hace cuando hay piezas pesadas en juego y el
peligro es real, no por costumbre en la primera jugada.
