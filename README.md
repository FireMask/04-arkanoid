# Juego de Arkanoid

Un clon de Arkanoid hecho con HTML, CSS y JavaScript puro — sin dependencias ni build step. Se juega abriendo `index.html` directamente en el navegador (`file://`) o con un servidor estático simple.

## Estado actual

- **Gameplay principal** (paddle controlado con el mouse, pelota con rebotes, bloques destructibles, puntaje, high score persistido, sonidos) — implementado.
- **Sistema de 5 niveles** con transición automática, HUD de nivel, y layouts definidos en `assets/levels.json`/`assets/levels.js` — implementado.

Ver `specs/01-core-gameplay.md` y `specs/02-level-system.md` para el detalle de cada feature.

## Cómo jugar

Abrí `index.html` en el navegador. El paddle sigue al mouse; la pelota rebota en paredes, paddle y bloques. Al limpiar el tablero se pasa al siguiente nivel; al limpiar el nivel 5 se gana la partida.

## Estructura del proyecto

- `index.html` — canvas (800×600) y carga de scripts (`assets/spritesheet.js`, `assets/levels.js`, `game.js`).
- `game.js` — toda la lógica del juego: estado de paddle/pelota/bloques, loop de render, colisiones, puntaje, transición de niveles, HUD y persistencia del high score en `localStorage`.
- `assets/spritesheet.js` / `assets/spritesheet-breakout.png` — sprites y animaciones de explosión.
- `assets/levels.json` / `assets/levels.js` — datos de los 5 niveles (fuente de verdad y wrapper embebido para carga sin fetch).
- `assets/sounds/` — efectos de sonido (`ball-bounce.mp3`, `break-sound.mp3`).
- `specs/` — specs de features en formato numerado, siguiendo el flujo descrito en `CLAUDE.md`.

## Desarrollo

No hay build system, package.json ni test suite. Es un sitio estático; cualquier cambio se prueba abriendo `index.html` directamente.
