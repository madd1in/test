# Rift Lance

Original fast-paced horizontal arcade shooter for GitHub Pages.

## Run locally

```powershell
cd C:\Users\User\Documents\Playground\rift-lance
python -m http.server 4179
```

Open `http://localhost:4179`.

## Assets

- HD background, ship sheet, object/enemy sheet, projectile/FX sheet, explosion sheet, UI/startscreen sheet, Rift shard sheet, red/blue orb residue sheet, ring sheet, and bitmap font atlas are shipped as raster assets.
- The new background was exported as `assets/generated/rift-loop-bg-tile.png` for horizontal repeat.
- The ship and props sheets were chroma-key cleaned into alpha PNGs.
- The projectile sheet adds player pulse/spear/lance bolts, enemy shots, missiles, mine pellets, impact sparks, shield deflects, and gravity ripples.
- The explosion sheet adds separate impact, shield crack, medium blast, and reactor bloom frames.
- The UI sheet remains available for small chrome, while the launch screen now uses stable CSS panels to avoid stretched sprite artifacts.
- The Rift shard sheet adds score pickups, shard sprays, trail glints, and Rift Bloom wave visuals.
- The red/blue orb sheet adds post-explosion plasma balls and cracked orb residue particles.
- The ring sheet replaces procedural ship/object halo strokes with asset-backed player, enemy, boss, hazard, pickup, charge, drone, and black-hole rings.
- The title logo is a raster font asset rendered from local fonts with hand-styled glow, distress cuts, and chromatic scanlines.
- The GUI and in-game banner text now render from `rift-font-atlas.png` instead of clean browser text.
- BGM uses `Steel Punch Parade.mp3` copied from `C:\Users\User\Downloads`.

## Latest polish

- Player, drone, enemies, boss, and hazards are drawn slightly zoomed out for more dodging room.
- Chain kills now build toward Rift Bloom, a short screen-clear pulse that removes enemy bullets and softens the wave.
- Start screen and HUD were restyled so the game reads less like a sterile overlay.
- The start screen was stabilized into a cleaner combat launch panel, and ships/enemies now tilt, pulse, and throw animated thruster/shard effects.
- Player and enemies were scaled down again and now use asset-backed dark ring/backplate sprites so they separate from the moving background.

## Controls

- Move: WASD or arrow keys
- Fire: Space or J
- Charge Lance: Shift or K
- Toggle drone: L
