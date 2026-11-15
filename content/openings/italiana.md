---
id: italiana
title: Apertura italiana
order: 1
eco: "C50-C54"
sources:
  - title: "Italian Game (Wikipedia)"
    url: https://en.wikipedia.org/wiki/Italian_Game
  - title: "Blackburne Shilling Gambit (Wikipedia)"
    url: https://en.wikipedia.org/wiki/Blackburne_Shilling_Gambit
  - title: "Explorador de aperturas de Lichess (partidas de maestros)"
    url: https://lichess.org/analysis#explorer
lines:
  - id: clasica-c3-d4
    name: "Giuoco Piano clásico: 4.c3 y 5.d4"
    side: w
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Bd2", "Bxd2+", "Nbxd2", "d5"]
    idea: "Las blancas preparan d4 con c3 para tener dos peones en el centro. Tras 6.cxd4 las negras dan jaque con 6...Ab4+ y, después de los cambios, golpean el centro con 8...d5; la posición queda igualada."
  - id: pianissimo-negras
    name: "Giuoco Pianissimo con negras: 4.c3 Cf6 5.d3"
    side: b
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O", "O-O"]
    idea: "Con 5.d3 las blancas juegan despacio, sin abrir el centro. Las negras se desarrollan con naturalidad: ...d6 sostiene el peón de e5 y el enroque pone al rey a salvo. La posición está igualada y la partida se decide por maniobras."
traps:
  - name: "Gambito Blackburne Shilling: 3...Cd4"
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nd4", "Nxe5", "Qg5", "Nxf7", "Qxg2", "Rf1", "Qxe4+", "Be2", "Nf3#"]
    comment: "3...Cd4 deja el peón de e5 aparentemente colgado. 4.Cxe5? es un error: 4...Dg5 ataca a la vez el caballo de e5 y el peón de g2, y 5.Cxf7?? pierde por 5...Dxg2 6.Tf1 Dxe4+ 7.Ae2 Cf3#, un mate de la coz. Lo correcto es 4.Cxd4 (la mejor) o 4.O-O. Si ya se jugó 4.Cxe5 Dg5, lo mejor es 5.Axf7+."
claims:
  - id: clasica-iguala
    fen: "r1bqk2r/ppp2ppp/2n2n2/3p4/2BPP3/5N2/PP1N1PPP/R2QK2R w KQkq - 0 9"
    assert: equal
  - id: clasica-jaque-es-la-mejor
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b5/2BPP3/5N2/PP3PPP/RNBQK2R b KQkq - 0 6"
    move: "Bb4+"
    assert: best
  - id: clasica-ab6-error
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b5/2BPP3/5N2/PP3PPP/RNBQK2R b KQkq - 0 6"
    move: "Bb6"
    assert: mistake
  - id: pianissimo-iguala
    fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 w - - 2 7"
    assert: equal
  - id: trampa-cxe5-error
    fen: "r1bqkbnr/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
    move: "Nxe5"
    assert: mistake
  - id: trampa-cxd4-mejor
    fen: "r1bqkbnr/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
    move: "Nxd4"
    assert: best
  - id: trampa-enroque-bueno
    fen: "r1bqkbnr/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
    move: "O-O"
    assert: best
  - id: trampa-cxf7-error
    fen: "r1b1kbnr/pppp1ppp/8/4N1q1/2BnP3/8/PPPP1PPP/RNBQK2R w KQkq - 1 5"
    move: "Nxf7"
    assert: mistake
  - id: trampa-axf7-mejor
    fen: "r1b1kbnr/pppp1ppp/8/4N1q1/2BnP3/8/PPPP1PPP/RNBQK2R w KQkq - 1 5"
    move: "Bxf7+"
    assert: best
---
## Qué es

La Italiana empieza con **1.e4 e5 2.Cf3 Cc6 3.Ac4**. El alfil va a c4, la llamada
"diagonal italiana", desde donde apunta a **f7**: el punto débil de las negras, defendido
solo por el rey. Si las negras responden **3...Ac5** se llama **Giuoco Piano** ("juego
tranquilo"); si responden 3...Cf6 es la defensa de los dos caballos, que se estudia aparte.

## Un poco de historia

Es una de las aperturas más antiguas que se conocen: aparece en el manuscrito de
Gotinga, la obra más antigua conocida sobre el ajedrez moderno, y la estudiaron en el siglo
XVI jugadores como Pedro Damiano y Giulio Polerio. Gioachino Greco la jugaba en las partidas
que recopiló hacia 1620, y casi siempre respondía a 3...Ac5 con 4.c3. En el siglo XX la
Española (3.Ab5) la superó en popularidad; la Italiana volvió a jugarse más a finales de siglo con las
líneas lentas con d3 (el *Giuoco Pianissimo*).

## La idea y el plan

Las blancas quieren:

1. **Desarrollar rápido** el caballo y el alfil del rey y **enrocar**.
2. **Ganar el centro** con c3 y d4: c3 prepara d4 para que, si las negras capturan, las
   blancas puedan retomar con el peón de c.
3. Si no hay prisa, jugar **d3** (el *Giuoco Pianissimo*, "muy tranquilo"): menos teoría y
   más maniobras.

Las negras responden con lo mismo: desarrollo, enroque y, en el momento justo, el golpe
**...d5** contra el centro.

## Las dos líneas

- **Con blancas, la clásica 4.c3 Cf6 5.d4.** Tras 5...exd4 6.cxd4 la mejor respuesta es el
  jaque 6...Ab4+; en cambio, 6...Ab6 es un error. Después de 7.Ad2 Axd2+ 8.Cbxd2 d5 las negras igualan.
- **Con negras, el Pianissimo 4.c3 Cf6 5.d3.** Se juega ...d6 y se enroca; la posición está
  igualada.

## Una trampa para conocer

Después de 3...Cd4 (el gambito Blackburne Shilling) el peón de e5 parece regalado, pero
4.Cxe5? es un error y 5.Cxf7?? pierde la partida. Míralo en la trampa de esta lección.
