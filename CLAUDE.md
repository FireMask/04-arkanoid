# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid clone built with plain HTML, CSS, and JavaScript — zero dependencies. Core gameplay and a 5-level progression system are implemented (see `specs/`).

There is no build system, package.json, bundler, or test suite. This is a static site: `index.html` is playable by opening it directly in a browser (`file://`) or via a simple static file server. Keep it that way — no fetch/CORS-dependent loading, no build step.

## Files

- `index.html` — canvas (800×600) and script tags loading `assets/spritesheet.js`, `assets/levels.js`, then `game.js`.
- `game.js` — all game logic: paddle/ball/block state, the render loop, collisions, scoring, level transitions, HUD, and localStorage high-score persistence.

## Assets

- `assets/spritesheet-breakout.png` — the sprite sheet image.
- `assets/spritesheet.js` — defines sprite/frame coordinates into the sheet and loader/draw helpers:
  - `SPRITES` — static sprite rects for `paddle`, `ball`, and `blocks.<color>` (gray, red, yellow, cyan, magenta, hotpink, green).
  - `EXPLOSION_FRAMES` — 4-frame explosion animations per block color, `EXPLOSION_DURATION` = 150ms per full cycle.
  - `loadSpritesheet(cb)` — loads the PNG onto an offscreen canvas once; callback-based, safe to call multiple times before load completes.
  - `drawFrame(ctx, frame, x, y, w, h)` — draws an arbitrary `{sx, sy, sw, sh}` frame.
  - `drawSprite(ctx, name, x, y, w, h)` — draws by sprite name; block sprites are addressed as `block_<color>` (e.g. `block_red`).
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.
- `assets/levels.json` — source-of-truth data for all 5 levels: `{ levels: [{ rows: [[color|null, ...] x8] x7 }, ...] }`.
- `assets/levels.js` — thin wrapper embedding the same content as a global `LEVELS` constant, loaded via `<script>` so levels work under `file://` with no fetch. Keep both files in sync manually, in the same commit, whenever levels change.

When adding game logic, reuse `loadSpritesheet`/`drawSprite`/`drawFrame` from `assets/spritesheet.js` rather than re-implementing sprite lookup.

## Spec-driven workflow

Features are designed and tracked as numbered specs in `specs/`, e.g. `specs/01-core-gameplay.md`, `specs/02-level-system.md`. Each spec is a single markdown file with this structure:

- **Header:** title, `State` (`Proposed` → `Approved` → `Implemented`), `Dependencies` (prior specs this builds on, or `None`), `Date`.
- **Objective:** one paragraph on what the spec delivers.
- **Scope:** explicit "In scope" / "Not in scope (deferred to future specs)" lists — deferred items are candidates for later specs.
- **Data model:** concrete shapes of any new/changed in-memory state or persisted data (localStorage keys, JSON files), described precisely enough to implement from.
- **Implementation plan:** numbered steps, each landing at a working/playable checkpoint (no step should leave the game broken or non-runnable).
- **Acceptance criteria:** checkbox list, verifiable by playing the game; checked off as implemented.
- **Decisions taken and discarded:** each notable choice with the alternative(s) considered and why they were rejected.
- **Identified risks:** concrete failure modes with a mitigation for each.

When asked to add or change a feature:
1. Check `specs/` for an existing spec covering it (and its `State`) before writing code.
2. For new, non-trivial features, propose a new spec file (next sequential number, `State: Proposed`) following the structure above before implementing, and update its `State` as it's approved/implemented.
3. Small fixes or tweaks to already-`Implemented` specs don't need a new spec file — use judgment on what counts as "non-trivial."
