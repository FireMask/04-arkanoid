# 02 — Level System

**State:** Implemented
**Dependencies:** [01-core-gameplay](01-core-gameplay.md)
**Date:** 2026-07-12

## Objective

Add a 5-level progression system where clearing all blocks advances immediately (after a brief "Level X" pause) to the next level, with each level's fixed block layout defined in a data file instead of hardcoded JS.

## Scope

**In scope:**
- 5 levels total, each with a fixed 8×7 block layout (same dimensions as the current level).
- Level 1's layout is the existing hardcoded pattern (one color per row, all 7 colors), extracted verbatim into the new data file.
- Levels 2–5 are randomly generated once (color per cell, no gaps) and baked into the data file as fixed layouts — not regenerated at runtime.
- Level data lives in `assets/levels.json` (source of truth) plus a thin `assets/levels.js` wrapper that embeds/exposes it as a JS constant (e.g. `LEVELS`), loaded via a `<script>` tag like `spritesheet.js` — keeps the game playable via `file://` with no fetch/CORS issues.
- Clearing all blocks in a level (after the last block's explosion animation finishes) triggers a ~750ms pause showing a centered "Level X" text overlay, then the next level's blocks load and play resumes.
- On level transition: ball and paddle reset to their starting positions, ball speed resets to `baseSpeed`. Score and `hitCount` (and thus future speed-up progress) carry over uninterrupted across levels.
- HUD is extended to show the current level number alongside score and high score.
- Clearing level 5 ends the run with the existing "You Win" overlay — same as current single-level behavior, just gated on the last level instead of the only level.

**Not in scope (deferred to future specs):**
- Level select/menu, or replaying a specific level directly.
- Per-level scoring bonuses or level-specific mechanics (e.g. different speeds, power-ups).
- Grid layouts other than 8×7 (variable dimensions per level).
- Persisting current level progress across page reloads (a run always starts at level 1).
- More than 5 levels, or infinite/looping level generation.
- Any tooling/UI to design or edit levels — layouts are static, hand-authored JSON.

## Data model

**`assets/levels.json`** — array of level definitions:

```json
{
  "levels": [
    {
      "rows": [
        ["gray", "gray", "gray", "gray", "gray", "gray", "gray", "gray"],
        ["red", "red", "red", "red", "red", "red", "red", "red"],
        ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow", "yellow", "yellow"],
        ["cyan", "cyan", "cyan", "cyan", "cyan", "cyan", "cyan", "cyan"],
        ["magenta", "magenta", "magenta", "magenta", "magenta", "magenta", "magenta", "magenta"],
        ["hotpink", "hotpink", "hotpink", "hotpink", "hotpink", "hotpink", "hotpink", "hotpink"],
        ["green", "green", "green", "green", "green", "green", "green", "green"]
      ]
    }
  ]
}
```

- `levels`: array of exactly 5 entries, index 0 = level 1.
- Each entry's `rows`: array of 7 arrays (rows), each containing 8 cells (columns).
- Each cell: one of the 7 sprite color names (`gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`) or `null` for an empty cell (no block). Levels 2–5 use only filled cells (no `null`) per the random-generation approach, but the format supports gaps for future hand-authored levels.

**`assets/levels.js`** — wrapper, no build step:
```js
const LEVELS = { levels: [ /* same content as levels.json, embedded */ ] };
```
Loaded via `<script src="assets/levels.js">` before `game.js` in `index.html`, exposing the global `LEVELS` constant. `levels.json` remains the readable/editable source; `levels.js` is kept in sync with it manually (both checked into the repo).

**In-memory state changes in `game.js`:**
- **`currentLevelIndex`**: number, 0-based, starts at `0`. Used to look up `LEVELS.levels[currentLevelIndex]` when (re)building the `blocks` array.
- **`gameState`**: enum extended with `"levelTransition"` — set when the level is cleared, blocks the update loop (except a transition timer) and draws the "Level X" overlay until the pause elapses.
- **`blocks`**: rebuilt from `LEVELS.levels[currentLevelIndex].rows` instead of the current hardcoded 8×7 loop; cells with `null` are skipped (no block, no collision).
- `score` and `hitCount` are unchanged in shape, just no longer reset between levels (only reset on a full game restart).

## Implementation plan

1. **Extract level 1 into `assets/levels.json` and `assets/levels.js`** — move the current hardcoded 8×7 row/color pattern into the new files; `game.js` still builds `blocks` the old (hardcoded) way. New files exist and are loaded but unused — no gameplay change yet.
2. **Generate levels 2–5** — write the 4 additional random (color-per-cell, no gaps) 8×7 layouts into `levels.json`/`levels.js`. Data file now has 5 complete levels; still unused by `game.js`.
3. **Switch block construction to read from `LEVELS`** — replace the hardcoded grid-building loop with one that reads `LEVELS.levels[currentLevelIndex].rows`, skipping `null` cells. Game still plays exactly as before (level 1 only, `currentLevelIndex` stuck at 0).
4. **Add level-clear detection and transition state** — when all blocks are destroyed (post-explosion) and `currentLevelIndex < 4`, set `gameState = "levelTransition"`, start a 750ms timer, and stop the win-condition check from firing early. Clearing level 1's board now pauses instead of immediately showing "You Win".
5. **Render "Level X" transition overlay** — draw centered text with the upcoming level number while `gameState === "levelTransition"`. Pause is visibly announced on screen.
6. **Advance to next level on timer expiry** — increment `currentLevelIndex`, rebuild `blocks` from the new level's data, reset ball position/speed to `baseSpeed` and paddle to its starting position, set `gameState` back to `"playing"`. After the pause, the next level's blocks appear and play resumes with score/hitCount intact.
7. **Gate the win condition on the last level** — clearing blocks only triggers `"win"` when `currentLevelIndex === 4` (level 5); otherwise it triggers the transition from step 4. Beating level 5 shows "You Win"; beating levels 1–4 advances instead.
8. **Add level number to the HUD** — display "Level N" (1-based) next to score/high score, updated on every transition. HUD reflects the current level at all times during play.
9. **Reset `currentLevelIndex` on restart** — ensure the existing restart control (Game Over / You Win) resets `currentLevelIndex` to `0` along with score/hitCount/ball/paddle. A fresh run always starts at level 1.

## Acceptance criteria

- [ ] `assets/levels.json` contains exactly 5 levels, each with 7 rows × 8 columns of cells (color name or `null`).
- [ ] `assets/levels.js` embeds the same 5 levels as a `LEVELS` constant, loaded via `<script>` before `game.js`, and the game runs correctly when `index.html` is opened directly via `file://`.
- [ ] Level 1's layout matches the original hardcoded pattern (one color per row, all 7 colors) exactly.
- [ ] Blocks for the active level are built from `LEVELS.levels[currentLevelIndex]`, with `null` cells rendering no block and having no collision.
- [ ] Destroying all blocks in levels 1–4 triggers a ~750ms "Level X" overlay (showing the upcoming level number), after which that level's blocks appear and play resumes.
- [ ] Score and hit count (and thus speed-up progress) are unaffected by a level transition — no reset.
- [ ] Ball and paddle return to their starting positions and the ball's speed resets to `baseSpeed` at the start of each new level.
- [ ] The HUD displays the current level number (1-indexed) at all times during play, updating immediately on transition.
- [ ] Destroying all blocks in level 5 shows the existing "You Win" overlay instead of a level transition.
- [ ] Restarting after Game Over or You Win resets `currentLevelIndex` to level 1 along with score, hit count, ball, and paddle.

## Decisions taken and discarded

- **JSON + JS wrapper (`levels.json` + `levels.js`)** over plain `fetch()` of the JSON — keeps the game playable via `file://` per `CLAUDE.md`, at the cost of manually keeping two files in sync; a build step to auto-generate `levels.js` from `levels.json` is deferred (not needed at this scale).
- **Levels 2–5 randomly generated once and baked into the data file** over hand-designed layouts or runtime randomization — satisfies "fixed per level" (every level 2 is always the same) while avoiding manual level design work now; hand-authored replacements are a drop-in JSON edit later.
- **Fixed 8×7 grid for every level** over variable per-level dimensions — keeps block-building, collision, and rendering logic unchanged from spec 01; only the color/gap pattern varies.
- **Color name or `null` per cell** over "always filled" — costs nothing now (levels 2–5 don't use `null`) but unlocks gap/pattern-based level design later without a data model change.
- **Score and hit count carry over across levels; ball speed resets to base** over full-state reset or full-state carryover — keeps overall run scoring continuous (feels like progress) while giving the player a breather in each new level rather than facing max ball speed immediately.
- **750ms "Level X" text pause** over an instant cut — gives the player a clear beat that the level changed, cheap to implement as a `gameState` variant reusing the existing overlay-drawing pattern.
- **`currentLevelIndex` resets to 0 only on Game Over/You Win restart** over persisting progress across page reloads — matches the existing high-score-only persistence model; mid-run level progress isn't meaningful to save since a run always starts fresh.

## Identified risks

- **`levels.json`/`levels.js` drift:** since both files must be kept in sync manually, an edit to one without the other could silently make the JSON source of truth diverge from what the game actually loads. Mitigation: treat `levels.js` as generated-by-hand-copy from `levels.json`, and change both in the same commit.
- **Transition timer racing gameplay state:** if the level-clear check fires while the last block's explosion animation is still playing, the transition could start a frame early/late. Mitigation: only evaluate "all blocks cleared" after explosion animations finish, consistent with the existing win-condition timing from spec 01.
