# Diseño — Entrenador personal de ajedrez (fase 1)

> Fecha: 2026-11-14 · Estado: aprobado por Sergio (2026-11-15)
> Carpeta: `~/Code/ajedrez` (nombre provisional; decisión de Claude)
> Investigación previa: [`docs/01-investigacion-y-propuestas.md`](../../01-investigacion-y-propuestas.md)

Las decisiones de Sergio se marcan como tales. Las demás llevan *(decisión de Claude)* y se pueden corregir.

## 1. Intención y el porqué

Sergio quiere aprender ajedrez como aprende todo: construyendo sus propias herramientas. Ya mueve las piezas "medianamente". Quiere **desarrollar sus habilidades y conocer las jugadas reconocidas y las aperturas** antes de jugar, enseñar y competir con amigos.

El proyecto completo tiene tres fases:
1. **Entrenador personal** (este documento): aprender solo con contenido preparado.
2. **Tutor con IA**: preguntar "¿y por qué no Cxe5?" en cualquier posición. Stockfish calcula y Claude explica en español.
3. **Retos con amigos**: cuentas, retos sobre todo asíncronos, conversación anclada a cada jugada, competencia justa entre niveles distintos. Algún amigo podría empezar casi desde cero.

El orden lo decidió Sergio: primero aprender solo; contenido preparado antes que el tutor.

## 2. Metas, no-metas y anti-metas

**Metas (fase 1)**
- Una **sesión diaria de ~25 min** en el celular que mezcla repaso, un patrón nuevo, una apertura y una partida famosa.
- Contenido con cuatro tipos de material enlazados entre sí, como pidió Sergio: **patrones con nombre, combinaciones famosas, partidas famosas y aperturas**.
- Las aperturas se aprenden por su **idea, plan y trampas típicas**, con líneas cortas y repaso espaciado, y conectadas con las partidas donde aparecen.
- El progreso se mide por **capacidad real**: patrones dominados, aperturas que juegas de memoria, partidas recorridas y un rating estimado en problemas.
- Funciona **sin conexión** y a **costo cero**.

**No-metas (fase 1)**
- Cuentas, amigos, retos, comentarios (fase 3).
- Tutor en vivo, Stockfish en la app, llamadas a Claude desde la app (fase 2).
- Jugar partidas completas contra el motor. Para eso está Lichess.
- App nativa en tiendas.
- Repertorios profundos de aperturas: nada más allá de ~8–12 jugadas por línea.

**Anti-metas (fracaso aunque "funcione")**
- **Contenido con errores**: una partida famosa con jugadas mal copiadas, fechas o anécdotas inventadas, o una idea de apertura mal explicada. Para alguien que aprende, esto es peor que no tener contenido.
- Memorizar jugadas sin entender por qué se hacen.
- Rachas, puntos y medallas que premian abrir la app en vez de aprender.
- Sesiones que se alargan solas por encima de ~30 min, o una montaña de repasos vencidos.
- Explicaciones en inglés.
- Cualquier servicio que pueda generar un cobro sin que Sergio lo active.

## 3. Restricciones

- Interfaz y contenido en **español**, con notación algebraica en español (R, D, T, A, C; los peones sin letra). *(Decisión de Claude: es la notación de los libros en español. Se puede cambiar a la inglesa con un ajuste. Los datos internos van en notación estándar, SAN/UCI en inglés.)*
- **Celular primero** (como en DiarIA y mandarin-ia), y que también sirva en el computador.
- Solo planes gratuitos.
- Licencias de datos: problemas de Lichess (CC0, se dan créditos de todas formas). Las partidas históricas son de dominio público como datos; los textos que las acompañan los escribimos nosotros.
- Convenciones de Sergio (como en mandarin-ia): identificadores y comentarios en inglés, docs y commits en español, Conventional Commits, sin secretos en el repo.
- Repo **público** `serandmoncas/ajedrez` (decisión de Sergio) con el alias SSH `github-serandmoncas`. Hosting en Vercel, equipo `serandmoncas-6387s-projects`.
- Por ser público: nunca hay secretos ni datos personales en el repo. El progreso vive en el dispositivo y los respaldos exportados no se suben. *(Decisión de Claude sobre licencias: código GPL-3.0, que es compatible con chessground y Stockfish; textos propios CC BY-SA 4.0.)*

## 4. Enfoques considerados

| Enfoque | Resumen | Por qué sí / no |
|---|---|---|
| **A. PWA local primero** (elegido por Sergio) | Next.js como PWA; progreso en el dispositivo; contenido como archivos en el repo | Lo más rápido para validar si el contenido y la sesión funcionan; sin conexión y gratis. Las cuentas llegan en la fase 3 detrás de una interfaz. |
| B. PWA con cuentas desde el día 1 | A + Supabase (como mandarin-ia) | Infraestructura que un solo usuario no necesita todavía; el modo sin conexión se complica. |
| C. Contenido en estudios de Lichess | La app solo agenda repasos sobre estudios de Lichess | Dependencia externa; limita "adivina la jugada", la sesión y los enlaces entre materiales. |

## 5. Contenido

### 5.1 Tipos y cómo se enlazan

| Tipo | Qué contiene | Cómo se practica |
|---|---|---|
| **Patrón con nombre** (mate del pasillo, de Legal, de la coz, de Anastasia, sacrificio griego, horquilla, clavada, rayos X, desviación, atracción, jaque a la descubierta…) | Explicación corta, 1–3 posiciones de ejemplo comentadas, etiquetas de tema de Lichess que le corresponden | Problemas reales de Lichess de ese tema, con repaso espaciado |
| **Combinación famosa** | Posición de una partida conocida + la secuencia ganadora + contexto | Problema: "aquí X encontró algo, ¿qué?" |
| **Partida famosa** | PGN completo verificado; historia (quién, cuándo, por qué importa); comentarios en las jugadas clave | Adivina la jugada, en tramos repartidos entre sesiones |
| **Apertura** | Nombre, historia breve, idea y plan, 1–3 líneas cortas, trampas típicas | Jugar la línea de memoria con repaso espaciado; ver la idea en una partida |

**Quinto tipo, lección de técnica** *(decisión de Claude)*: cubre los Fundamentos y los finales elementales, que no encajan en los cuatro tipos anteriores.
- Trae una explicación con posiciones y líneas fijas, y posiciones de "encuentra la jugada" calificadas como problemas.
- Usa también problemas de Lichess con temas como `mateIn1`, `hangingPiece` o `pawnEndgame`.
- Jugar el final completo contra un defensor necesita motor, así que queda para la fase 2. Mientras tanto la lección enlaza a la práctica de Lichess (lichess.org/practice).

**Criterio para que algo sea "patrón"** *(decisión de Claude)*: necesita un tema de Lichess que le corresponda (por ejemplo `smotheredMate`, `fork`, `pin`, `xRayAttack`, `deflection`, `attraction`, `anastasiaMate`), o al menos 10 posiciones escritas a mano y verificadas con Stockfish. Los que no cumplen ninguna de las dos cosas, como el mate de Legal, entran como **combinación famosa**.

Cada pieza de contenido declara sus enlaces: a qué patrones corresponde, en qué apertura empieza y qué partidas la ilustran. La app los muestra ("esta partida empieza con la Italiana, que ya estudiaste") y los usa para elegir el material nuevo.

### 5.2 Ruta y volumen inicial *(decisión de Claude)*

La primera versión utilizable trae alrededor de **12 patrones, 8 aperturas, 10 partidas famosas y 10 combinaciones**, ordenados en una ruta:

1. **Fundamentos** (opcional, breve): notación algebraica, valor de las piezas, piezas colgadas. Sergio lo puede saltar; queda listo para los amigos de la fase 3.
2. **Mates y táctica básica**, junto con aperturas abiertas de ideas claras: Italiana, Española, Escocesa y gambito de rey como historia.
3. **Finales elementales** (mate con dama, mate con torre, rey y peón) y aperturas para negras: Siciliana como idea, Caro-Kann, Francesa.
4. **Partidas de la historia del ajedrez** en orden cronológico, de la Ópera de Morphy (1858) a la Inmortal, Steinitz, Capablanca, Réti, Fischer y Kasparov–Deep Blue.

La lista exacta se decide al escribir el contenido, y Sergio la aprueba antes.

**Las etapas son pistas paralelas** *(decisión de Claude)*. La ruta de arriba describe el orden de dificultad dentro de cada sección, no un bloqueo:
- Cada sección de la sesión (patrones y técnica, aperturas, partidas) avanza por su propia lista ordenada.
- Las partidas se ordenan para que, en lo posible, su apertura ya se haya visto. Si no se ha visto, la partida la presenta como dato ("esto es una Siciliana; la verás más adelante").
- Si una sección se queda sin material, su tiempo pasa al repaso.

### 5.3 Cómo se escribe y se verifica *(decisión de Claude)*

- Cada pieza es un archivo **Markdown con encabezado (frontmatter)**: metadatos, enlaces y PGN o FEN. El cuerpo lleva la explicación en español.
- **Claude escribe un borrador; Sergio lo revisa** antes de que entre a la ruta.
- **Verificación automática en el build** (si falla, no se publica):
  - todo PGN y FEN es legal según chess.js;
  - las secuencias ganadoras terminan donde dicen (mate, ganancia de material);
  - cada partida famosa coincide jugada por jugada con una fuente de referencia guardada en el repo (PGN descargado de una base pública), con la fuente citada;
  - los enlaces apuntan a contenido que existe.
- Los datos históricos (fechas, lugares, anécdotas) llevan su fuente en el archivo. Si no hay fuente, no van.
- **Corrección ajedrecística** (decisión de Sergio: Stockfish + fuentes):
  - Toda afirmación evaluativa en un comentario ("gana", "es un error", "es la mejor", "iguala") se marca en el archivo con la posición y la evaluación que afirma.
  - Un script local, en el computador de Sergio, la verifica con Stockfish a profundidad fija. Si no coincide, el contenido no pasa. El resultado (evaluación y profundidad) queda guardado junto al contenido, así el build no necesita Stockfish.
  - Las ideas y planes de apertura y estrategia citan al menos una fuente: un libro, Wikipedia, o el explorador o los estudios de Lichess.
  - Sin revisor humano externo en la fase 1.
- **Problemas:** un script descarga una vez la base de Lichess, filtra por los temas de los patrones y por un rango de rating (~600–1800) y guarda en el repo un subconjunto (~50–80 por patrón) como JSON. No se descarga en cada build.

## 6. La sesión diaria

```
1. Repaso       ~8 min   lo vencido: problemas, líneas de apertura, combinaciones
2. Patrón nuevo ~5 min   explicación + 3 problemas de ese tema
3. Apertura     ~5 min   idea + una línea nueva o repaso de una conocida
4. Partida      ~7 min   adivina la jugada en el siguiente tramo de la partida en curso
```

- **Tope de tiempo:** si hay muchos repasos vencidos, entra menos material nuevo, incluso nada; la sesión no pasa de ~30 min. Siempre se puede hacer una sesión extra, pero esa no agrega material nuevo sin preguntar (lección de mandarin-ia).
- **Calificación automática**, no autocalificación *(decisión de Claude: en ajedrez la respuesta es objetiva)*:
  - Problema resuelto al primer intento y rápido → *Fácil*; resuelto al primer intento → *Bien*; con pista o un error → *Difícil*; fallado → *Otra vez*.
  - Línea de apertura: se juega jugada por jugada contra la app; los errores bajan la nota de la misma manera.
- **Repaso espaciado:** FSRS con `ts-fsrs` *(decisión de Claude sobre qué es una tarjeta)*:
  - **Patrón:** una tarjeta por patrón, no por problema. Cada repaso trae un problema **distinto** de ese tema: primero los que nunca se han visto, luego los vistos hace más tiempo. Así se entrena reconocer el patrón y no memorizar posiciones.
  - **Problema fallado:** se vuelve su propia tarjeta. Es la parte Woodpecker: tus errores vuelven hasta que salgan solos.
  - **Línea de apertura y combinación famosa:** una tarjeta cada una.
  - **Partidas:** no son tarjetas. Se recorren una vez y sus momentos clave vuelven como combinaciones.
  - Con este diseño hay unas 30–60 tarjetas en la primera versión, no cientos.
- **Adivina la jugada:** el tablero muestra la posición desde el lado del ganador; tú propones una jugada.
  - **Puntos:** la del maestro da puntos completos. Las alternativas que el contenido marca como buenas dan puntos parciales con un comentario ("también gana, pero…"). Cualquier otra jugada muestra la del maestro y su explicación.
  - Las alternativas aceptables se preparan al escribir el contenido, con ayuda de Stockfish en el computador de Sergio. La app no lleva motor en la fase 1.
- **Pistas:** primero el tema ("busca una clavada"), luego la pieza que se mueve.

## 7. Progreso

Se ve en una pantalla de "capacidades", sin rachas ni puntos:
- patrones **dominados**: la tarjeta del patrón tiene estabilidad FSRS por encima de un umbral, y los últimos problemas nuevos de ese tema se resolvieron al primer intento;
- aperturas que juegas de memoria;
- partidas recorridas, con su % de acierto en adivina la jugada;
- **rating estimado en problemas**, actualizado tipo Glicko con el rating de Lichess de cada problema.

## 8. Arquitectura

| Pieza | Elección |
|---|---|
| App | Next.js (App Router) + TypeScript, PWA instalable, mobile-first (igual que mandarin-ia) |
| Tablero | `chessground`, el tablero de Lichess (GPL-3), con un envoltorio React propio *(decisión de Claude: el repo es público, así que la GPL no estorba. Es el tablero mejor probado en celular, con flechas, resaltados y arrastre táctil)* |
| Reglas | `chess.js` |
| Repaso | `ts-fsrs` |
| Progreso | IndexedDB detrás de una interfaz `ProgressStore`. En la fase 3 se implementa con Supabase sin tocar el resto. |
| Respaldo | Exportar/importar el progreso como archivo JSON desde Ajustes |
| Contenido | Markdown + frontmatter en `content/`, validado con zod y chess.js, compilado a JSON en el build |
| Sin conexión | El service worker guarda todo el contenido (pesa poco) |
| Hosting | Vercel Hobby |
| Pruebas | Vitest + Testing Library; la verificación de contenido corre como prueba |

## 9. Fases siguientes (para no cerrarles la puerta)

- **Fase 2, tutor:** un endpoint del servidor que recibe un FEN y una pregunta, calcula con Stockfish y explica con Claude. Pide los modelos vigentes de Claude y un tope de gasto.
- **Fase 3, amigos:** cuentas con Supabase, pasar `ProgressStore` a la nube, retos asíncronos (problema del día, adivina la jugada en grupo, correspondencia), conversación anclada a cada jugada, comparación por progreso propio y partidas en vivo usando enlaces de Lichess al principio.

## 10. Lo que se deja al constructor

- El diseño visual y la navegación entre pantallas.
- La estructura interna de carpetas y nombres de archivos.
- Los umbrales exactos: tiempo de "rápido", estabilidad de "dominado", parámetros del rating.
- Cómo se reparte el tiempo de la sesión cuando se ajusta.
