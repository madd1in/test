# Neon Apex Rush

Static browser arcade racing game with third-person chase cam, faster Mode-7-style pseudo-3D road rendering, local Imagen HD assets, animated car frame sheets, morphing item pickups, polished HUD panels, upbeat Downloads BGM, and local SFX.

## Start

```powershell
node tools\serve.js
```

Open:

```text
http://127.0.0.1:4187/
```

## Controls

- Arrow keys or WASD steer, accelerate, brake
- Space boosts
- P or Escape pauses
- M toggles sound

## Assets And Features

- `key-art.png`, `horizon-3d-imagen.png`, `parallax-foreground-imagen.png`, and `road-texture-imagen.png` were generated with Imagen and copied locally.
- Player car, rival car, boost cell, boost pad, drone, and UI panel are local transparent Imagen HD PNG assets.
- Player and rival cars also have Imagen HD animation frame sheets for steering, boost, and impact shimmer.
- Mystery pickups use an 8-frame morphing item sheet inspired by kart-racer item roulette behavior, with original generic item designs.
- Speed gates use a new 4-frame Imagen HD boost-portal sheet, with perfect-line timing for extra speed.
- Arcade status flashes use the generated `status-badge-sheet.png` for lap/rival/perfect/turbo moments.
- `*-source.png` files are the chroma-key sources; matching `*-imagen.png` files are the locally cut-out gameplay assets.
- Gameplay ideas added: near-miss boost bonus, shield break, EMP drone clear, repair item, overdrive, magnet pickup pull, time warp, rival waves, speed gates, textured Mode-7 road, calmer background, parallax foreground, and bitmap-skinned HUD/menu panels.
- Performance pass: DPR is capped/adaptive, gradients are cached, particle count is capped, and road texture sampling is cheaper.
- `assets/audio/downloads/*.mp3` files were selected from `C:\Users\User\Downloads`, including `Jet Fuel Glory (1).mp3` as the upbeat BGM. `assets/audio/*.wav` files are generated locally from `tools/generate-audio.js`; `assets/audio/local/*.wav` files were imported from local workspace racing assets.

## Checks

```powershell
node tools\generate-audio.js
node tools\smoke-test.js
```
