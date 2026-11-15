---
id: partida-de-la-opera
title: "La partida de la ópera: Morphy, París 1858"
order: 1
white: "Paul Morphy"
black: "Duque Carlos II de Brunswick y conde Isouard (en consulta)"
year: 1858
event: "Partida de consulta"
site: "París, Théâtre-Italien (Salle Ventadour)"
referencePgn: morphy-opera-1858.pgn
side: w
sources:
  - title: "Opera Game (Wikipedia)"
    url: https://en.wikipedia.org/wiki/Opera_Game
  - title: "PGN de referencia: base de partidas de Morphy de PGN Mentor (Morphy.zip)"
    url: https://www.pgnmentor.com/players/Morphy.zip
links:
  combinations: [opera-final]
moves: ["e4", "e5", "Nf3", "d6", "d4", "Bg4", "dxe5", "Bxf3", "Qxf3", "dxe5", "Bc4", "Nf6", "Qb3", "Qe7", "Nc3", "c6", "Bg5", "b5", "Nxb5", "cxb5", "Bxb5+", "Nbd7", "O-O-O", "Rd8", "Rxd7", "Rxd7", "Rd1", "Qe6", "Bxd7+", "Nxd7", "Qb8+", "Nxb8", "Rd8#"]
segments:
  - { from: 1, to: 12 }
  - { from: 13, to: 22 }
  - { from: 23, to: 33 }
alternatives:
  "15":
    - san: "Qxb7"
      comment: "También gana: 8.Dxb7 se lleva un peón (8...Db4+ 9.Dxb4 Axb4+). Morphy prefirió seguir desarrollando sus piezas."
comments:
  "5": "Las negras eligieron 2...d6, la defensa Philidor, que lleva el nombre de François-André Danican Philidor, el maestro más fuerte de la segunda mitad del siglo XVIII y también compositor de ópera. Con 3.d4 Morphy ataca el centro enseguida."
  "7": "3...Ag4 clava el caballo de f3 contra la dama. Hoy se juega más 3...exd4 o 3...Cf6. Morphy captura en e5."
  "9": "Si las negras retoman con 4...dxe5, es un error: 5.Dxd8+ Rxd8 6.Cxe5 gana un peón y el rey negro ya no puede enrocar. Por eso cambiaron el alfil por el caballo. Morphy retoma con la dama, que queda activa en f3."
  "11": "Tras 5...dxe5 la dama blanca ya está en juego y las negras no han sacado ninguna pieza (su alfil se cambió). 6.Ac4 apunta a f7."
  "13": "6...Cf6 es un error: ahora 7.Db3, junto con el alfil de c4 ataca f7, y además ataca b7; es la mejor jugada. Era mejor defender f7 con 6...Df6."
  "15": "7...De7 frena la amenaza: si 7...Cc6, 8.Axf7+ Re7 (o Rd7) 9.De6#. Pero la dama tapa al alfil de f8. Con 8.Cc3 Morphy saca otra pieza en vez de ir por el peón de b7; también así gana."
  "17": "8...c6 libera la séptima fila: ahora la dama de e7 defiende el peón de b7. 9.Ag5 clava el caballo de f6 contra la dama."
  "19": "9...b5 es un error: quiere echar al alfil, pero 10.Cxb5! gana. Morphy entrega el caballo para abrir líneas contra el rey negro, que sigue en el centro."
  "21": "Tras 10...cxb5, 11.Axb5+ da jaque. El caballo que tape en d7 quedará clavado contra el rey."
  "23": "Enroque largo: la torre llega a la columna d, abierta, frente al caballo clavado de d7. Si 12...O-O-O, 13.Aa6+ Rc7 14.Db7#."
  "25": "13.Txd7! gana: elimina un defensor. Tras 13...Txd7 la torre negra de d7 queda clavada por el alfil de b5."
  "27": "La otra torre se suma contra d7. La torre de d7 está clavada contra el rey, y el caballo de f6, que la defiende, está clavado contra la dama."
  "29": "14...De6 intenta desclavar el caballo de f6. Morphy cambia su alfil por la torre: 15.Axd7+."
  "31": "16.Db8+!! Sacrificio de dama: es jaque y la única respuesta legal es capturarla con el caballo de d7, que así deja abierta la columna d para la torre."
  "33": "Mate. Morphy da mate con las dos únicas piezas que le quedan además del rey: la torre da jaque en d8 y el alfil de g5 cubre e7. A esta posición final se le llama a veces el «mate de la ópera»."
claims:
  - id: dxe5-error
    fen: "rn1qkbnr/ppp2ppp/3p4/4P3/4P1b1/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 4"
    move: "dxe5"
    assert: mistake
  - id: cf6-error
    fen: "rn1qkbnr/ppp2ppp/8/4p3/2B1P3/5Q2/PPP2PPP/RNB1K2R b KQkq - 1 6"
    move: "Nf6"
    assert: mistake
  - id: df6-mejor
    fen: "rn1qkbnr/ppp2ppp/8/4p3/2B1P3/5Q2/PPP2PPP/RNB1K2R b KQkq - 1 6"
    move: "Qf6"
    assert: best
  - id: db3-mejor
    fen: "rn1qkb1r/ppp2ppp/5n2/4p3/2B1P3/5Q2/PPP2PPP/RNB1K2R w KQkq - 2 7"
    move: "Qb3"
    assert: best
  - id: cc3-gana
    fen: "rn2kb1r/ppp1qppp/5n2/4p3/2B1P3/1Q6/PPP2PPP/RNB1K2R w KQkq - 4 8"
    move: "Nc3"
    assert: wins
  - id: dxb7-gana
    fen: "rn2kb1r/ppp1qppp/5n2/4p3/2B1P3/1Q6/PPP2PPP/RNB1K2R w KQkq - 4 8"
    move: "Qxb7"
    assert: wins
  - id: b5-error
    fen: "rn2kb1r/pp2qppp/2p2n2/4p1B1/2B1P3/1QN5/PPP2PPP/R3K2R b KQkq - 1 9"
    move: "b5"
    assert: mistake
  - id: cxb5-gana
    fen: "rn2kb1r/p3qppp/2p2n2/1p2p1B1/2B1P3/1QN5/PPP2PPP/R3K2R w KQkq - 0 10"
    move: "Nxb5"
    assert: wins
  - id: txd7-gana
    fen: "3rkb1r/p2nqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR3R w k - 3 13"
    move: "Rxd7"
    assert: wins
  - id: db8-gana
    fen: "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16"
    move: "Qb8+"
    assert: wins
---
## La historia

Paul Morphy, maestro estadounidense, jugó esta partida en París en octubre o
noviembre de 1858, en el palco del duque Carlos II de Brunswick en el Théâtre-Italien (la
Salle Ventadour), mientras en el escenario se representaba una ópera. Fue una **partida de
consulta**: el duque y el conde Isouard decidían juntos cada jugada de las negras, y Morphy
llevaba las blancas solo. Las fuentes no se ponen de acuerdo sobre qué ópera se
representaba esa noche.

## Por qué importa

Muestra el valor del **desarrollo rápido**. Morphy saca sus piezas,
enroca y abre líneas mientras las negras pierden tiempo; cuando el rey negro sigue en el
centro, Morphy entrega material para atacarlo y termina dando mate con solo dos piezas. Las
negras eran aficionados, pero la lógica del ataque es la misma en cualquier nivel: piezas
activas contra un rey sin enrocar.

## Cómo practicarla

Juegas con las blancas, en tres tramos: intenta adivinar cada jugada de Morphy. Fíjate en
las clavadas: casi todo el ataque se apoya en piezas negras que no se pueden mover.
