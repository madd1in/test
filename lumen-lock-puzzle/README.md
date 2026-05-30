# Lumen Lock

A standalone browser puzzle game about rotating prism tiles until every crystal receives the right beam. The current build has twenty hand-authored chambers, generated image assets, local BGM/SFX, persistent best scores, and responsive canvas/DOM UI.

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
- `assets/lumen-lock-beam-flares-imagen-v1.png` - generated additive beam flare atlas used by sources and lit targets
- `assets/lumen-lock-relics-imagen-v1.png` - generated chamber relic atlas used by level buttons
- `assets/lumen-lock-tier-medallions-imagen-v1.png` - generated tier medallion atlas used by the mastery strip
- `assets/lumen-lock-reward-plaque-imagen-v1.png` - generated no-text solved banner artwork
- `assets/lumen-lock-archive-panel-imagen-v1.png` - generated archive panel skin used behind notes and mastery
- `assets/lumen-lock-wordmark.png` - previous generated title wordmark art
- `assets/lumen-lock-ui-skin.png` - previous generated GUI skin atlas
- `assets/lumen-lock-glyphs.png` - generated tile and crystal glyph atlas
- `assets/audio/` - local BGM and SFX copied from existing disk assets
- `tools/build_assets.ps1` - rebuilds local PNG glyph assets
- `tools/logic-smoke.js` - verifies all chambers can be solved
- `tools/visual-smoke.js` - captures desktop and mobile render smoke screenshots

## Content Notes

- Late-game chambers introduce green beams, locked conduit tiles, cross-junctions, multi-source engines, four-color crown routing, color filter lenses, and 9x9 final chambers.
- Completed chambers show relic art and a small marker in the chamber selector; par clears get a warmer marker.
- Chamber notes are intentionally short so the playfield stays clear.
- Tier medallions and board biomes now shift every four chambers.

## Expansion Ideas

- Echo mirrors that reflect only the incoming color.
- One-shot prisms that lock after the first successful beam.
- Optional master chambers with hidden par relics.
- A daily chamber seed using the same beam tracer.
- Color-gated doors that open when another target is lit.
- A no-undo challenge track with separate relic art.
- Ghost beams that preview one rotation ahead.
- Boss locks made from chained mini-boards.
- A vault codex that unlocks puzzle-making sketches after each tier.
- Color inversion lenses that swap cyan/amber or green/violet.
- A level editor that exports compact chamber JSON.
- Animated par relics for perfect clears.
