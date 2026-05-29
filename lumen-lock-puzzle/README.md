# Lumen Lock

A standalone browser puzzle game about rotating prism tiles until every crystal receives the right beam. The current build has eight hand-authored chambers, generated image assets, local BGM/SFX, persistent best scores, and responsive canvas/DOM UI.

## Run

Open `index.html` in a browser. The game uses static files only.

## Files

- `index.html` - game shell and HUD
- `style.css` - responsive visual design
- `game.js` - simulation, beam tracing, input, rendering
- `assets/lumen-lock-background.png` - generated background art
- `assets/lumen-lock-wordmark-imagen-v2.png` - generated title/font wordmark art
- `assets/lumen-lock-gui-imagen-v2.png` - generated GUI skin atlas used by panels and buttons
- `assets/lumen-lock-board-imagen-v2.png` - generated playfield skin used under the canvas grid
- `assets/lumen-lock-elements-imagen-v2.png` - generated element atlas used by tiles, sources, targets, and wall surfaces
- `assets/lumen-lock-wordmark.png` - previous generated title wordmark art
- `assets/lumen-lock-ui-skin.png` - previous generated GUI skin atlas
- `assets/lumen-lock-glyphs.png` - generated tile and crystal glyph atlas
- `assets/audio/` - local BGM and SFX copied from existing disk assets
- `tools/build_assets.ps1` - rebuilds local PNG glyph assets
- `tools/logic-smoke.js` - verifies all chambers can be solved
- `tools/visual-smoke.js` - captures desktop and mobile render smoke screenshots

## Content Notes

- New late-game chambers introduce green beams, locked conduit tiles, cross-junctions, and multi-target crown routing.
- Completed chambers show a small marker in the chamber selector; par clears get a warmer marker.
- Chamber notes are intentionally short so the playfield stays clear.
