# Rune Lift 3D

A static Three.js puzzle platformer with Assist and Normal difficulty, double jump assists, optional helper ledges, guide wisps, batched safety nets, a target compass, route rails, wind-boost zones, drift fields, gravity wells, paired rift portals, treasure chests, patrolling temple wardens, a stompable Rune Guardian, a three-step relay puzzle, a two-anchor Chrono gate, a three-mirror Observatory gate, a two-well Gravity Orrery gate, a three-glyph Sanctum lock, a three-chest Sky Key lock, a relay-vault side route, lightweight constellation graphics, an Aurora/Crown route, an Eclipse Forge route, a Chrono Archive route, a Mirror Observatory route, a Gravity Orrery route, a Rift Sanctum and Sky Keep finale with 22 runes, swipe touch controls plus a separate mobile jump button, locally generated materials, calm lazy-loaded BGM from `Downloads`, and instant synthetic SFX fallbacks. The renderer now defaults to Turbo mode with fewer point lights, lower texture cost, batched helper surfaces, capped pixel ratio, geometry reuse, and adaptive quality.

## Run locally

```powershell
cd rune-lift-3d
npm install
npm run serve
```

Open `http://localhost:4177`.

## Controls

- Keyboard: WASD or arrow keys to move, Space to jump or double jump in Assist, H to toggle Assist/Normal, R to reset, M to mute, F to toggle fullscreen. Use the `T` HUD button to stay in Turbo mode or reload into FX mode.
- Touch: drag to move, press the large `A` button to jump or double jump, swipe up as a backup jump, swipe down to reset.
