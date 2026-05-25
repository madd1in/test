# Rift Lance

Original fast-paced horizontal arcade shooter for GitHub Pages.

## Run locally

```powershell
cd C:\Users\User\Documents\Playground\rift-lance
python -m http.server 4179
```

Open `http://localhost:4179`.

## Assets

- HD background, ship sheet, object/enemy sheet, projectile/FX sheet, explosion sheet, UI/startscreen sheet, Rift shard sheet, red/blue orb residue sheet, ring sheet, UI chrome sheet, and bitmap font atlas are shipped as raster assets.
- The new background was exported as `assets/generated/rift-loop-bg-tile.png` for horizontal repeat.
- The ship and props sheets were chroma-key cleaned into alpha PNGs.
- The projectile sheet adds player pulse/spear/lance bolts, enemy shots, missiles, mine pellets, impact sparks, shield deflects, and gravity ripples.
- The explosion sheet adds separate impact, shield crack, medium blast, and reactor bloom frames.
- The UI sheet remains available for small chrome, while the launch screen now uses stable CSS panels to avoid stretched sprite artifacts.
- The Rift shard sheet adds score pickups, shard sprays, trail glints, and Rift Bloom wave visuals.
- The red/blue orb sheet adds post-explosion plasma balls and cracked orb residue particles.
- The ring sheet replaces procedural ship/object halo strokes with asset-backed player, enemy, boss, hazard, pickup, charge, drone, and black-hole rings.
- The UI chrome sheet adds raster panel scratches, bracketed buttons, HUD cells, menu rails, divider marks, and radar overlays.
- The title logo is a raster font asset rendered from local fonts with hand-styled glow, distress cuts, and chromatic scanlines.
- The GUI and in-game banner text now render from `rift-font-atlas.png` instead of clean browser text.
- BGM uses `Steel Punch Parade.mp3` copied from `C:\Users\User\Downloads`.

## Latest polish

- Player, drone, enemies, boss, and hazards are drawn slightly zoomed out for more dodging room.
- Chain kills now build toward Rift Bloom, a short screen-clear pulse that removes enemy bullets and softens the wave.
- Start screen and HUD were restyled so the game reads less like a sterile overlay.
- The start screen was stabilized into a cleaner combat launch panel, and ships/enemies now tilt, pulse, and throw animated thruster/shard effects.
- Player and enemies were scaled down again and now use asset-backed dark ring/backplate sprites so they separate from the moving background.
- Aura rings were softened and ships now get a brighter gamma plus sprite-glow pass over a darker playfield.
- The current start screen/HUD uses raster chrome overlays so the frames and buttons feel less sterile.
- Performance pass removes per-sprite blur/filter work, moves the nebula background out of the canvas redraw loop, lowers render scale, delays heavy audio preload, and keeps the font atlas as a subtle texture behind readable live text.
- Color and variety pass boosts cyan/amber/rose/lime accents, hides HUD clutter on the launch screen, adds stronger HUD edge strips, and introduces director events such as Prism Trail, Flank Raid, Mine Veil, Relay Cache, Supply Thread, and Needle Storm.
- Directional projectile art is rotated from its native left-facing sheet orientation, so player lasers, drone bolts, and enemy shots all travel nose-first.
- Arsenal pass adds double/triple laser lanes, spread laser pickups, homing missile pods up to X3, companion orbs that fire in strike mode and shield in guard mode, plus a richer start-screen loadout rail and HUD arsenal readout.
- Focus pass simplifies the launch screen into a flatter console, darkens the nebula with a canvas tint layer, and adds Gate Run, Wraith Pair, Split Core, splitter enemies, wraith hunters, and timed Overdrive surges for more varied runs.
- Contrast/goal pass rebuilds the launch screen as a cleaner cockpit title scene, adds stronger enemy threat plates and marked health bars, and introduces Bounty Lock targets with Overdrive/arsenal rewards.
- Polish pass adds Graze near-miss rewards, pickup magnetism during Graze/Overdrive, Rift Harvest risk routes, Crossfire formations, and a little extra chrome motion on existing UI surfaces.

## Controls

- Move: WASD or arrow keys
- Fire: Space or J
- Charge Lance: Shift or K
- Toggle drone: L
