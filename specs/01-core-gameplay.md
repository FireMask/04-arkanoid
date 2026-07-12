# 01 — Core Gameplay

**State:** Implemented
**Dependencies:** None (first spec in the project)
**Date:** 2026-07-11

## Objective

Deliver a single playable Arkanoid level — paddle, ball, blocks, collisions, and scoring — running in the browser with no build step.

## Scope

**In scope:**
- A paddle that follows the mouse X position (1:1, no lag), constrained to stay within canvas bounds.
- A ball that bounces off walls, the paddle, and blocks, with angle-varying bounce off the paddle based on hit position.
- A single hardcoded level: 8 columns × 7 rows of blocks, one color per row, using all 7 sprite colors (gray, red, yellow, cyan, magenta, hotpink, green).
- Block destruction on ball collision, playing the existing `EXPLOSION_FRAMES` animation before removal.
- Flat per-block scoring (every block worth the same points).
- Ball speed-up: +10% every 5 block hits, capped at 1.5x initial speed.
- Single-life play: missing the ball ends the game immediately (Game Over).
- Win condition: clearing all blocks ends the game (You Win).
- Centered overlay for Game Over / You Win, each with a restart button/control that resets the game without reloading the page.
- HUD showing current score and best (high) score.
- High score persisted as a single best-score number in `localStorage`, across reloads.
- Sound effects: `ball-bounce.mp3` on wall/paddle bounce, `break-sound.mp3` on block destroy.
- Fixed canvas size, 800×600, no scaling/responsive logic.
- New files: `index.html` and `game.js`, reusing `assets/spritesheet.js` for sprite loading/drawing.

**Not in scope (deferred to future specs):**
- Multiple levels / level progression.
- Power-ups.
- Multiple lives / lives HUD.
- Keyboard paddle controls (mouse only for this spec).
- Responsive/scaled canvas.
- Any menu, pause, or settings screens.
- Score history/leaderboards beyond a single best-score number.

## Data model

No external/persisted data structures beyond a single localStorage key. In-memory state lives in plain JS objects/variables in `game.js`:

- **`paddle`**: `{ x, y, width, height }` — `y` fixed near bottom of canvas, `x` driven by mouse position each frame, clamped to `[0, canvasWidth - width]`.
- **`ball`**: `{ x, y, radius, dx, dy, baseSpeed, speed }` — `speed` starts at `baseSpeed`, scaled up per the speed-up rule (capped at `1.5 * baseSpeed`); `dx`/`dy` derived from angle and current `speed`.
- **`blocks`**: array of `{ x, y, width, height, color, destroyed, explodeStartTime }` — one entry per cell in the 8×7 grid, `color` one of the 7 sprite color names, `explodeStartTime` set when hit (drives the `EXPLOSION_FRAMES` animation via `EXPLOSION_DURATION`), entry removed/skipped once its explosion finishes.
- **`gameState`**: string enum, one of `"playing"`, `"gameover"`, `"win"` — controls whether the update loop runs and which overlay (if any) is drawn.
- **`score`**: number — current run's score, incremented by a flat per-block value on each block destroyed.
- **`hitCount`**: number — total blocks hit this run, used to trigger the speed-up every 5 hits.
- **`highScore`**: number — loaded from `localStorage` key `arkanoid-high-score` at startup (default `0`), updated and saved when `score` exceeds it.

localStorage key:
- `arkanoid-high-score` → string-encoded integer, the best score ever achieved. No versioning needed (single scalar value).

## Implementation plan

1. **Scaffold `index.html`** — canvas element (800×600), script tags loading `assets/spritesheet.js` then `game.js`, basic page structure. Game is playable-empty (blank canvas) at this step.
2. **Boot loop and rendering skeleton** — `game.js` calls `loadSpritesheet`, sets up `requestAnimationFrame` loop, clears/redraws canvas each frame. Nothing moves yet, but the loop runs without errors.
3. **Paddle** — render paddle via `drawSprite`, track mouse `mousemove` to set paddle `x` (clamped to canvas bounds). Paddle visibly follows the mouse.
4. **Ball movement and wall collisions** — render ball via `drawSprite`, update position each frame, bounce off left/right/top walls. Ball moves and bounces off walls (falls off bottom, no paddle collision yet).
5. **Ball-paddle collision** — detect ball/paddle overlap, reflect `dy`, vary `dx` by hit position (edge = sharper angle, center = near-vertical). Ball now bounces indefinitely between paddle and walls.
6. **Block grid and rendering** — build the 8×7 `blocks` array with per-row colors, render non-destroyed blocks via `drawSprite`. Full grid visible, ball passes through blocks (no collision yet).
7. **Ball-block collision and destruction** — detect ball/block overlap, reflect ball direction, mark block as exploding, increment `score` and `hitCount`. Blocks disappear (instantly) when hit, score updates in memory (no HUD yet).
8. **Explosion animation** — on block hit, play `EXPLOSION_FRAMES` for that color over `EXPLOSION_DURATION` before removing the block from rendering/collision. Destroyed blocks show the explosion before vanishing.
9. **Ball speed-up** — apply +10% speed every 5 `hitCount` increments, capped at 1.5x base speed. Ball visibly speeds up as more blocks are destroyed.
10. **Miss detection and Game Over** — detect ball passing below paddle, set `gameState = "gameover"`, stop updates, show centered overlay with restart control. Missing the ball ends the run and shows Game Over with a working restart.
11. **Win detection** — when all blocks destroyed (post-explosion), set `gameState = "win"`, show centered overlay with restart control. Clearing the board shows You Win with a working restart.
12. **HUD and high score persistence** — render current score and high score on-screen; on run end, compare `score` to `highScore`, update and persist to `localStorage` if higher. Score/high score visible and correctly persisted across reloads.
13. **Sound effects** — play `ball-bounce.mp3` on wall/paddle bounce, `break-sound.mp3` on block hit. Audio plays at the right moments without blocking gameplay.

## Acceptance criteria

- [x] Opening `index.html` directly in a browser (or via a static server) loads and runs the game with no console errors.
- [x] The paddle's horizontal position follows the mouse 1:1 and never moves outside the canvas bounds.
- [x] The ball bounces correctly off the left, right, and top canvas walls.
- [x] The ball bounces off the paddle, with the exit angle varying based on where it hit the paddle (edges = sharper angle, center = near-vertical).
- [x] The level renders an 8×7 grid of blocks, one color per row, using all 7 sprite colors.
- [x] Hitting a block plays its `EXPLOSION_FRAMES` animation, then removes the block from both rendering and collision.
- [x] Each block destroyed increases `score` by the same flat amount.
- [x] Every 5 blocks hit, ball speed increases by 10%, up to a hard cap of 1.5x the initial speed (verified it does not exceed the cap).
- [x] Letting the ball fall past the paddle immediately ends the game, showing a centered "Game Over" overlay.
- [x] Destroying all blocks ends the game, showing a centered "You Win" overlay.
- [x] Both end-state overlays include a restart control that resets the game to its initial state without a page reload.
- [x] The HUD displays the current score and the high score at all times during play.
- [x] When a run's score exceeds the stored high score, the new high score is saved to `localStorage` and still shows correctly after a page reload.
- [x] `ball-bounce.mp3` plays on wall/paddle bounces; `break-sound.mp3` plays on block destruction.

## Decisions taken and discarded

- **Mouse-only paddle control** over keyboard or both — keeps input handling simple for the first playable slice; keyboard support deferred.
- **Hardcoded grid in JS** over a JSON/data file — no external format needed for a single level; revisit if/when multi-level support is added.
- **Single life, immediate Game Over** over a lives system — avoids lives/HUD complexity for this spec; a lives system is a natural candidate for a later spec.
- **Flat per-block scoring** over color-weighted scoring — simpler to implement and verify; color-weighted scoring can be introduced later without changing the data model much.
- **Ball speed-up (+10% every 5 hits, capped at 1.5x)** over a time-based ramp — ties difficulty to player progress rather than wall-clock time, easier to reason about and test.
- **Single best-score number in localStorage** over a score list/leaderboard — minimal persistence scope; leaderboard/history deferred.
- **Fixed 800×600 canvas** over responsive scaling — avoids scaling-math complexity; responsive support deferred.
- **Single `index.html` + `game.js`** over split modules — matches the project's "zero dependencies, plain files" style noted in `CLAUDE.md`; can be split later if `game.js` grows unwieldy.
- **Explosion animation reused from `assets/spritesheet.js`** (`EXPLOSION_FRAMES`/`EXPLOSION_DURATION`) rather than a new effect — per `CLAUDE.md` guidance to reuse existing sprite helpers.
- **Centered overlay + restart control** for Game Over/You Win over a bare overlay — avoids requiring a page reload to replay, at minimal extra scope.

## Identified risks

- **Collision tunneling at higher ball speeds:** as speed increases toward the 1.5x cap, fast-moving balls could pass through thin blocks/paddle in a single frame if collision detection is purely position-based. Mitigation: use swept/segment collision checks or clamp max speed low enough that per-frame movement stays smaller than block/paddle thickness.
- **Audio autoplay restrictions:** browsers may block `ball-bounce.mp3`/`break-sound.mp3` playback before a user gesture. Mitigation: only start audio playback after the first user interaction (e.g. mouse move over canvas).
- **Mouse coordinate mapping:** if the canvas is ever displayed at a CSS size different from its 800×600 pixel size, raw `mousemove` coordinates will misalign with paddle position. Mitigation: always map `event.clientX` through the canvas's bounding rect, even though this spec fixes canvas size.
