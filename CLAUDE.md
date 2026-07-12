# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid clone built with plain HTML, CSS, and JavaScript — zero dependencies. Per README.md, the game itself is not yet implemented; only art assets exist so far.

There is no build system, package.json, bundler, or test suite. This is a static site: once game code exists, it should be playable by opening an HTML file directly in a browser (or via a simple static file server).

## Assets

- `assets/spritesheet-breakout.png` — the sprite sheet image.
- `assets/spritesheet.js` — defines sprite/frame coordinates into the sheet and loader/draw helpers:
  - `SPRITES` — static sprite rects for `paddle`, `ball`, and `blocks.<color>` (gray, red, yellow, cyan, magenta, hotpink, green).
  - `EXPLOSION_FRAMES` — 4-frame explosion animations per block color, `EXPLOSION_DURATION` = 150ms per full cycle.
  - `loadSpritesheet(cb)` — loads the PNG onto an offscreen canvas once; callback-based, safe to call multiple times before load completes.
  - `drawFrame(ctx, frame, x, y, w, h)` — draws an arbitrary `{sx, sy, sw, sh}` frame.
  - `drawSprite(ctx, name, x, y, w, h)` — draws by sprite name; block sprites are addressed as `block_<color>` (e.g. `block_red`).
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.

When adding game logic, reuse `loadSpritesheet`/`drawSprite`/`drawFrame` from `assets/spritesheet.js` rather than re-implementing sprite lookup.
