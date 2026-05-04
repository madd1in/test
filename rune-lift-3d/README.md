# Rune Lift 3D

A static Three.js puzzle platformer with Assist and Normal difficulty, double jump assists, optional helper ledges, guide wisps, batched safety nets, a target compass, route rails, wind-boost zones, a three-step relay puzzle, a relay-vault side route, lightweight constellation graphics, a new Aurora/Crown finale, swipe touch controls, locally generated materials, calm lazy-loaded BGM from `Downloads`, and instant synthetic SFX fallbacks. The renderer now defaults to Turbo mode with fewer point lights, lower texture cost, batched helper surfaces, capped pixel ratio, geometry reuse, and adaptive quality.

## Run locally

```powershell
cd rune-lift-3d
npm install
npm run serve
```

Open `http://localhost:4177`.

## Controls

- Keyboard: WASD or arrow keys to move, Space to jump or double jump in Assist, H to toggle Assist/Normal, R to reset, M to mute. Use the `T` HUD button to stay in Turbo mode or reload into FX mode.
- Touch: drag to move, swipe up to jump or double jump, swipe down to reset.
