# Moto Ridge Rush

An original side-scrolling motocross arcade game inspired by classic dirt-bike rhythm, built as a static GitHub Pages game. It uses separate generated raster assets for the rider, terrain tiles, parallax background tiles, track objects, UI icons, and effects.

## Play

- Throttle: `D` or `ArrowRight`
- Brake: `A` or `ArrowLeft`
- Lean: `W/S` or `ArrowUp/ArrowDown`
- Hop: `Space`
- Turbo: `Shift`
- Restart: `R`

## Project Notes

- `assets/source/` contains the three AI-generated source boards used as visual direction.
- `tools/build-assets.cjs` produces normalized game-ready PNG sheets and map JSON.
- The shipped game does not need a build step on GitHub Pages because all runtime files are static.

## Local

```powershell
npm run build:assets
npm run serve
npm run smoke
```
