# Ridge Rider

A self-contained 2D mountain-bike browser game built for GitHub Pages.

## Play

- Jump: `W`, `ArrowUp`, or `Space`
- Lean: `A/D` or `ArrowLeft/ArrowRight`
- Boost: `Shift` or `X`
- Pause: `P` or `Escape`

Touch controls appear automatically on small or touch screens.

## Assets

- `assets/generated/trail-backdrop-imagen.webp`: compressed generated raster trail backdrop.
- `assets/sprites/rider-imagen.webp`: compressed generated rider sprite with local chroma-key background removal.
- `assets/foreground/front-tiles-imagen.webp`: compressed generated foreground trail tile strip.
- `assets/foreground/trail-props-imagen.webp`: compressed generated prop atlas for signs, ramps, bales, stumps, dust, berms, and ribbons.
- `assets/ui/*.svg`: project-local game pickups, hazards, and markers.
- `assets/audio/*.wav`: local disk BGM and SFX copied from the existing `moto-ridge-rush` asset set.

## Polish Pass

- Easier default tuning with fewer rocks, softer landing checks, smaller hit boxes, stronger flow recovery, and more generous pickups.
- Added a cyan flow guide line to suggest the safe route.
- Added generated front tiles, prop decorations, particle dust, pickup sparks, local SFX, and looping BGM.
- Next ideas: checkpoint streak rewards, alternate rider skins, weather variants, downhill time trials, and a trick-combo medal screen.
- Fast-load pass: only backdrop and rider block the first menu; foreground props, pickup art, hazards, flags, and audio lazy-load after the first screen.

## Local Run

Open `index.html` directly, or serve the folder with any static file server.
