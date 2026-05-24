# Rift Lance

Original fast-paced horizontal arcade shooter for GitHub Pages.

## Run locally

```powershell
cd C:\Users\User\Documents\Playground\rift-lance
python -m http.server 4179
```

Open `http://localhost:4179`.

## Assets

- HD background, ship sheet, object/enemy sheet, and projectile/FX sheet were generated with the built-in image generation tool.
- The new background was exported as `assets/generated/rift-loop-bg-tile.png` for horizontal repeat.
- The ship and props sheets were chroma-key cleaned into alpha PNGs.
- The projectile sheet adds player pulse/spear/lance bolts, enemy shots, missiles, mine pellets, impact sparks, shield deflects, and gravity ripples.
- BGM uses `Steel Punch Parade.mp3` copied from `C:\Users\User\Downloads`.

## Controls

- Move: WASD or arrow keys
- Fire: Space or J
- Charge Lance: Shift or K
- Toggle drone: L
