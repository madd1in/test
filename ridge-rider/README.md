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
- `assets/imagen/coin-imagen.webp`: generated Imagen collectible coin pickup.
- `assets/imagen/flag-imagen.webp`: generated Imagen checkpoint flag marker.
- `assets/ui/rock.svg`: project-local rock hazard.
- `assets/audio/*.wav`: local disk BGM and SFX copied from the existing `moto-ridge-rush` asset set.

## Polish Pass

- Easier default tuning with fewer rocks, softer landing checks, smaller hit boxes, stronger flow recovery, and more generous pickups.
- Added a cyan flow guide line to suggest the safe route.
- Added generated front tiles, prop decorations, particle dust, pickup sparks, local SFX, and looping BGM.
- Next ideas: checkpoint streak rewards, alternate rider skins, weather variants, downhill time trials, and a trick-combo medal screen.
- Fast-load pass: only backdrop and rider block the first menu; foreground props, pickup art, hazards, flags, and audio lazy-load after the first screen.
- Control-feel pass: smoothed lean input, softer boost ramp, jump buffering, coyote-time forgiveness, gentler airtime spin, and cleaner landing recovery.
- Background loop pass: mirrored ping-pong backdrop tiling removes the visible hard seam from the generated non-seamless panorama.

## Local Run

Open `index.html` directly, or serve the folder with any static file server.
