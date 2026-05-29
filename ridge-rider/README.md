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
- `assets/sprites/rider-imagen.webp`: compressed generated rider seed sprite with local chroma-key background removal.
- `assets/sprites/rider-ride-strip-imagen.webp`: six-frame animated rider strip derived from the approved rider sprite.
- `assets/foreground/front-tiles-imagen.webp`: compressed generated foreground trail tile strip.
- `assets/foreground/trail-props-imagen.webp`: compressed generated prop atlas for signs, ramps, bales, stumps, dust, berms, and ribbons.
- `assets/imagen/coin-imagen.webp`: generated Imagen collectible coin pickup.
- `assets/imagen/flag-imagen.webp`: generated Imagen checkpoint flag marker.
- `assets/imagen/rock-imagen.webp`: generated Imagen rock hazard with local chroma-key background removal.
- `assets/audio/trail-boss-rush-local.mp3`: local disk BGM copied from the existing `pixel-plumber-platformer` music set.
- `assets/audio/*.wav`: local disk SFX copied from the existing `moto-ridge-rush` asset set.

## Polish Pass

- Flow-first tuning with rocks demoted to small rotated trail dressing, softer landing checks, stronger flow recovery, and more generous pickups.
- Added a cyan flow guide line to suggest the safe route.
- Added generated front tiles, prop decorations, particle dust, pickup sparks, local SFX, and looping BGM.
- Next ideas: checkpoint streak rewards, alternate rider skins, weather variants, downhill time trials, and a trick-combo medal screen.
- Fast-load pass: only backdrop and rider block the first menu; foreground props, pickup art, hazards, flags, and audio lazy-load after the first screen.
- Control-feel pass: smoothed lean input, softer boost ramp, jump buffering, coyote-time forgiveness, gentler airtime spin, and cleaner landing recovery.
- Background loop pass: mirrored ping-pong backdrop tiling removes the visible hard seam from the generated non-seamless panorama.
- Asset animation pass: SVG rock replaced with an Imagen WebP hazard and the rider now cycles an animated ride strip with wheel motion and suspension bob.
- Gameplay loop pass: ramps now launch the rider, lean controls pump/manual/flip behavior, coins bank permanent progression, combo chains grant boost surges, and checkpoint milestones add long-term rewards.

## Local Run

Open `index.html` directly, or serve the folder with any static file server.
