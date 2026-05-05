# Resonance Lab FPS

A compact browser FPS inspired by classic science-facility shooters. It uses
original names, Canvas raycasting, local SVG sprites/textures, and local audio
assets copied into the project.

Open `index.html` in a browser to play.

Controls:

- Move: WASD or arrow keys
- Look: mouse after clicking the canvas
- Fire: left mouse or Space
- Metal bar: V or right mouse
- Use: E or F
- Weapon slots: 1 and 2

Added content:

- Reproducible PNG asset generator in `tools/build-raster-assets.js`
- Raster sprite files for the pulse pistol, metal bar, and three enemy classes
- Raster wall, door, floor, and ceiling textures
- Local BGM plus SFX for shots, hits, pickups, doors, and damage
- A suit battery pickup and audio toggle
- A tighter amber suit-HUD and condensed system font stack
- A dry original Lab AI commentary channel with optional browser speech
- Performance mode: lower internal render resolution, PNG caches, wider ray step, and fixed depth buffer fill

Asset rebuild:

```bash
npm run assets
```

More ideas worth building next:

- A charged alt-fire that ricochets down corridors
- Explosive containment tanks that can damage groups of enemies
- A scientist NPC that opens a shortcut if rescued
- A tram intro room before the lab breach
- Sector-specific enemy waves after the relay is restored
- Environmental puzzles with lasers, moving test platforms, and coolant valves
- A final containment core boss that changes the maze while you fight
- Enemy weak spots that glow only while the suit flashlight is active
- More weapons: compact SMG, experimental beam tool, and throwable satchel charges
- Suit upgrade stations for sprint, armor capacity, and reload speed
- A post-run score screen with time, accuracy, damage taken, and AI insults

Local check:

```bash
npm run check
```
