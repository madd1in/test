# Lumen Lock

A standalone browser puzzle game about rotating prism tiles until every crystal receives the right beam. The current build has twelve hand-authored chambers, generated image assets, local BGM/SFX, persistent best scores, and responsive canvas/DOM UI.

## Run

Open `index.html` in a browser. The game uses static files only.

## Files

- `index.html` - game shell and HUD
- `style.css` - responsive visual design
- `game.js` - simulation, beam tracing, input, rendering
- `assets/lumen-lock-background.png` - generated background art
- `assets/lumen-lock-background-imagen-v3.png` - generated late-game observatory background
- `assets/lumen-lock-wordmark-imagen-v2.png` - generated title/font wordmark art
- `assets/lumen-lock-gui-imagen-v2.png` - generated GUI skin atlas used by panels and buttons
- `assets/lumen-lock-board-imagen-v2.png` - generated playfield skin used under the canvas grid
- `assets/lumen-lock-board-biomes-imagen-v3.png` - generated 2x2 board-biome atlas for level tiers
- `assets/lumen-lock-elements-imagen-v2.png` - generated element atlas used by tiles, sources, targets, and wall surfaces
- `assets/lumen-lock-relics-imagen-v1.png` - generated chamber relic atlas used by level buttons
- `assets/lumen-lock-reward-plaque-imagen-v1.png` - generated no-text solved banner artwork
- `assets/lumen-lock-wordmark.png` - previous generated title wordmark art
- `assets/lumen-lock-ui-skin.png` - previous generated GUI skin atlas
- `assets/lumen-lock-glyphs.png` - generated tile and crystal glyph atlas
- `assets/audio/` - local BGM and SFX copied from existing disk assets
- `tools/build_assets.ps1` - rebuilds local PNG glyph assets
- `tools/logic-smoke.js` - verifies all chambers can be solved
- `tools/visual-smoke.js` - captures desktop and mobile render smoke screenshots

## Content Notes

- Late-game chambers introduce green beams, locked conduit tiles, cross-junctions, multi-source engines, and four-color crown routing.
- Completed chambers show relic art and a small marker in the chamber selector; par clears get a warmer marker.
- Chamber notes are intentionally short so the playfield stays clear.

## Expansion Ideas

- Echo mirrors that reflect only the incoming color.
- One-shot prisms that lock after the first successful beam.
- Optional master chambers with hidden par relics.
- A daily chamber seed using the same beam tracer.
- Color-gated doors that open when another target is lit.
