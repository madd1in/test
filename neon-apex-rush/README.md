# Neon Apex Rush

Static browser arcade racing game with third-person chase cam, Mode-7-style pseudo-3D road rendering, local Imagen HD assets, parallax background layers, local synthwave BGM, and local SFX.

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
- `*-source.png` files are the chroma-key sources; matching `*-imagen.png` files are the locally cut-out gameplay assets.
- Gameplay ideas added: near-miss boost bonus, hovering drone hazards, textured Mode-7 road, parallax foreground, and bitmap-skinned HUD/menu panels.
- `assets/audio/*.wav` files are generated locally from `tools/generate-audio.js`.

## Checks

```powershell
node tools\generate-audio.js
node tools\smoke-test.js
```
