# Ajedrez — investigación y propuestas

> 2026-11-14 · Borrador para conversar. Nada construido todavía.
> Nombre de la carpeta (`~/Code/ajedrez`): provisional, decisión de Claude.

## 1. Qué dice la evidencia sobre cómo se aprende ajedrez

1. **El ajedrez es reconocer patrones.** De Groot (1946) y Chase & Simon (1973) mostraron que los maestros no calculan más lejos que los aficionados. Lo que hacen es *ver* la posición en bloques ("chunks"). Se calcula que un maestro guarda decenas de miles de patrones. Para aprender hay que **acumular patrones**, no memorizar reglas.
2. **La práctica deliberada es necesaria, pero no basta.** En los estudios, todos los que llegaron a maestro tenían al menos ~3.000 horas de práctica (Campitelli & Gobet). Pero la práctica explica más o menos un tercio de las diferencias de nivel (Burgoyne et al., 2019). Para quien empieza de adulto la conclusión es útil: hay que medir el progreso contra uno mismo, no contra un ideal de gran maestro.
3. **El estudio serio a solas es lo que más predice el nivel** (Charness et al., 2005): resolver posiciones, analizar partidas. Jugar mucho blitz no aparece como predictor. Campitelli & Gobet encontraron además un peso grande de la práctica **en grupo**. Eso le da sentido a los retos con invitados.
4. **Para un principiante el orden importa.** Entrenadores y literatura coinciden:
   - **Táctica primero.** Casi todas las partidas entre principiantes se deciden por una pieza que se deja colgada o por un mate de 1 a 3 jugadas.
   - **Finales básicos pronto** (mates elementales, rey y peón contra rey, regla del cuadrado). Enseñan qué vale cada pieza y cómo se usa el rey.
   - **Aperturas solo como principios** (centro, desarrollo, enroque) hasta ~1500 de rating. Memorizar líneas al empezar rinde poco.
   - **Partidas lentas y luego analizarlas**, sobre todo las perdidas. Ahí se aprende; jugar rápido solo pone a prueba lo que ya sabes.
5. **Repetición espaciada aplicada a posiciones.** Funciona igual que con vocabulario. Chessable ("MoveTrainer") la usa para aperturas. El *Método Woodpecker* (Smith & Tikkanen) consiste en repetir el **mismo** set de problemas en ciclos cada vez más cortos hasta que el patrón sale solo. Es la misma lógica de Fichas y del FSRS de mandarin-ia.
6. **"Adivina la jugada".** Es un método clásico: tapas una partida de maestro, intentas adivinar cada jugada y comparas. Te obliga a pensar como en una partida de verdad y además te enseña historia.

### Ruta sugerida por etapas

| Etapa | Qué | Señal de que puedes pasar a la siguiente |
|---|---|---|
| 0 | Reglas, notación algebraica, valor de las piezas | Lees y escribes una partida |
| 1 | Mates en 1–2, horquillas, clavadas, piezas colgadas | ~80 % de acierto en problemas fáciles |
| 2 | Principios de apertura + mates elementales (D+R, T+R) + finales de peón | Das mate con torre sin dudar |
| 3 | Partidas lentas (15+10 o más) + análisis propio de cada derrota | Pierdes por estrategia, ya no por descuidos |
| 4 | Estructuras de peones, planes, un repertorio pequeño | — |

## 2. Historia en una página (sirve como hilo para las lecciones)

- **s. VI, India:** *chaturanga*, el antepasado del ajedrez. Pasa a Persia (*chatrang*) y al mundo árabe (*shatranj*). De ahí vienen "jaque" (*shāh*, rey) y "mate" (*māt*).
- **s. X–XIII:** llega a Europa por al-Ándalus. En 1283 Alfonso X manda escribir el *Libro de los juegos*.
- **~1475, Valencia:** la dama se vuelve la pieza más poderosa. Nace el ajedrez moderno, al que llamaron "ajedrez de la dama". Lucena (1497) y Ruy López (1561) escriben tratados en español.
- **1749:** Philidor: *"los peones son el alma del ajedrez"*.
- **1858:** Morphy juega la *Partida de la Ópera*, la lección clásica de desarrollo.
- **1886:** Steinitz es el primer campeón mundial y propone la teoría posicional.
- **Años 1920:** los hipermodernos (Nimzowitsch, Réti) proponen controlar el centro a distancia.
- **1948–1972:** escuela soviética (Botvinnik), hasta Fischer–Spassky en 1972.
- **1997:** Deep Blue le gana a Kasparov. **2017:** AlphaZero aprende solo y juega "como humano".
- **Hoy:** Carlsen; Gukesh, campeón mundial a los 18 años (2024).

Igual que en italiano, el hilo puede ser **"partidas como recetas"**: cada partida famosa es una lección con su historia, una idea central y ejercicios.

## 3. Lo que ya existe (no hay que rehacerlo)

| Herramienta | Para qué sirve | Costo |
|---|---|---|
| **Lichess** | Jugar, problemas, estudios, "Aprender", análisis con Stockfish | Gratis y de código abierto |
| Chess.com | Lo mismo con más pulido, lecciones en video | Freemium |
| Chessable | Repetición espaciada de aperturas y libros | Pago |
| Listudy | Repetición espaciada gratuita sobre estudios de Lichess | Gratis |

**Recursos abiertos para construir encima:**

- **Base de problemas de Lichess:** ~6 millones de problemas con rating y etiquetas por tema, en dominio público (CC0). Se descarga como CSV.
- **Base de partidas de Lichess:** todas las partidas jugadas en Lichess, mes a mes.
- **API de Lichess:** `POST /api/challenge/open` crea un **enlace que cualquiera puede abrir para jugar**, y los enlaces vencen a las 24 h. Los parámetros están por verificar en la documentación oficial. También permite descargar tus propias partidas.
- **chess.js** (reglas, MIT) · **chessground** (tablero de Lichess, **GPL-3**: obliga a que el código sea abierto) o **react-chessboard** (MIT) · **Stockfish.js** (motor en el navegador, GPL-3; la versión *lite* pesa ~1,6 MB).

## 4. Propuestas, a partir de lo que ya hicimos

| # | Propuesta | Viene de | Esfuerzo |
|---|---|---|---|
| A | **Mazo de ajedrez para Fichas**: notación, valor de piezas, nombres de temas tácticos, mates elementales | Fichas / `~/Code/mazos` | Muy bajo |
| B | **"Partidas como recetas"**: 18–24 partidas históricas ordenadas por dificultad. Cada una trae su historia, la idea central, "adivina la jugada" y algo que produces tú | italiano | Bajo (contenido) |
| C | **Entrenador de patrones**: problemas de Lichess filtrados por tema, ciclos Woodpecker y FSRS, sesión diaria de 20 min sin rachas vacías | mandarin-ia | Medio |
| D | **Análisis nocturno de tus partidas**: por la noche descarga lo que jugaste en Lichess, Stockfish marca los errores, Claude explica 3 en español, y **tus propios errores se vuelven problemas** para C | turno-nocturno | Medio |
| E | **Diario de partidas**: una nota por partida importante, enlazada a aperturas, temas y rivales | DiarIA / bóveda | Bajo |
| F | **Mapa de conceptos**: un grafo de táctica → estrategia → finales con preguntas de repaso | metalearning | Medio |
| G | **App de retos con invitados** (sección 5) | Fichas PWA | Medio–alto |

## 5. App de retos con invitados: posibilidades

**Tipos de reto (de más simple a más complejo):**

1. **Reto del día:** el mismo problema para todos los invitados, se gana por acierto y por tiempo. Asíncrono y sin servidor de tiempo real.
2. **Adivina la jugada en grupo:** una partida famosa; cada uno propone la jugada del maestro y gana quien más se acerca. Puntos según la evaluación de Stockfish.
3. **"Juega desde aquí":** una posición de una partida histórica que tú y tu invitado continúan.
4. **Ajedrez por correspondencia:** una jugada al día, con notas de por qué la jugaste. Es lento y muy bueno para aprender con amigos o familia.
5. **Duelo en vivo** (partida o carrera de problemas): necesita tiempo real.

**Formas de construirla:**

| Opción | Cómo | A favor | En contra |
|---|---|---|---|
| **1. Apoyarse en Lichess** | La app crea el reto con la API y le manda al invitado un enlace de Lichess | Cero servidor; partidas en vivo con reloj y análisis incluidos | La experiencia sale de tu app; los enlaces vencen a las 24 h |
| **2. PWA propia** *(recomendada)* | Next.js + chess.js + tablero + Supabase (base de datos, tiempo real, invitado por enlace sin cuenta). Se instala en Android y iPhone como Fichas | Controlas los retos didácticos (1–4), plan gratis, una sola base de código | Hay que hacer el tiempo real si quieres el duelo en vivo |
| 3. Nativa (Expo / tiendas) | React Native | Notificaciones push más fiables en iOS | Cuentas de desarrollador, revisión de tiendas; sobra en esta etapa |

**Recomendación:** opción 2, empezando por los retos **asíncronos** (1, 2 y 4), que son los que más enseñan y no necesitan tiempo real. Para el duelo en vivo, al principio la app genera el enlace de Lichess (opción 1) en vez de construirlo.

## 6. Preguntas abiertas

- ¿Quiénes son los invitados y qué quieres que pase entre ustedes? (Define si va asíncrono o en vivo, con cuentas o sin ellas.)
- ¿Cuál es tu nivel hoy? ¿Ya sabes mover las piezas?
- ¿Quieres que el código sea abierto? (Así se puede usar chessground, el tablero de Lichess.)

## Fuentes

- Campitelli & Gobet; Burgoyne et al. 2019 — https://englelab.gatech.edu/articles/2019/Burgoyne_et_al_2019_AJP.pdf
- "Deliberate practice: necessary but not sufficient" — https://researchonline.lse.ac.uk/id/eprint/102854
- Base de datos de Lichess — https://database.lichess.org/
- API de Lichess — https://lichess.org/api
- Stockfish.js — https://github.com/nmrugg/stockfish.js
- chessground (GPL-3) — https://www.npmjs.com/package/chessground
