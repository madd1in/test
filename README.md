# Nocturne Reliquary

Original gothic action-platformer built as a static browser game with local assets from this workspace.

## Run

Open `index.html` in a browser, or serve this folder with any static server.

## Controls

- Move: Left/Right arrows or A/D
- Climb doors: W/S or touch up/down
- Jump: ArrowUp, Space, or Z
- Double jump: jump again in the air
- Attack: J or X
- Spell: K or C
- Dash: L or Shift after the relic is found
- Map: Tab or I
- Audio: M
- Mobile: use the on-screen buttons or swipe on the canvas
- Fullscreen: FS button

## Game Shape

- Room-based castle map with persistent visited rooms
- Relic-gated progression: Grave Boots, Mist Dash, Moon Sigil
- Grave Boots upgrade double jump into Triple Moonstep
- Moon Sigil turns the spell into a three-way moon arc
- ArrowUp is dedicated to jump, while W keeps up-door control clean
- Jump buffering and short-hop release make platforming sharper
- Wider whip hitboxes line up better with the visible whip arc
- Down-whip in the air bounces off enemies as a Moon pogo
- Softer enemy damage, slower pressure, and longer invulnerability after hits
- Horizontal camera rooms are about one and a half screens wide for better flow
- Aerial whip stalls descent briefly for safer mid-air attacks
- Moon chain combo rewards quick kills with extra MP
- Local sprite-sheet animation for player, enemies, boss, projectiles, and whip
- Reproducible slicing for the raw player and whip PNGs in `tools/slice-local-assets.py`
- Local BGM and SFX
- Save/continue through `localStorage`
- Boss finale in the Crimson Reliquary

The game intentionally uses an original name, story, and characters while chasing the gothic exploration feel requested.
