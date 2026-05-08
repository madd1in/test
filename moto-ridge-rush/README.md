# Moto Ridge Rush

An original pseudo-3D motocross arcade game inspired by classic dirt-bike rhythm, built as a static GitHub Pages game. It uses separate generated raster assets for the rider, terrain tiles, HD Mode7-style tile maps, panoramic backgrounds, track objects, UI icons, effects, and local audio.

## Play

- Throttle: `D` or `ArrowRight`
- Brake: `A` or `ArrowLeft`
- Lean: `W/S` or `ArrowUp/ArrowDown`
- Hop: `Space`
- Turbo: `Shift`
- Restart: `R`

Clean jumps award stunt points. Pickups add score, turbo heats the bike, draft strips pull you forward, and each longer track has gold, silver, and bronze target times saved locally in the browser. Hazards now act as flow-preserving bumps instead of frequent reset blockers.

## Project Notes

- `assets/source/` contains the AI-generated source boards used as visual direction, including HD tile and background sheets.
- `assets/audio/` contains the local BGM and SFX used by the runtime audio layer.
- `tools/build-assets.cjs` produces normalized game-ready PNG sheets, sliced Mode7 tiles, HD background strips, and map JSON.
- The shipped game does not need a build step on GitHub Pages because all runtime files are static.

## Local

```powershell
npm run build:assets
npm run serve
npm run smoke
```
