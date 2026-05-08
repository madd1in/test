# Nocturne Reliquary

Original gothic action-platformer built as a static browser game with local assets from this workspace.

## Run

Open `index.html` in a browser, or serve this folder with any static server.

## Controls

- Move: Left/Right arrows or A/D
- Climb doors: W/S or touch up/down
- Jump: ArrowUp, Space, or Z
- Double jump: jump again in the air
- Attack (whip): J or X
- Spell: K or C
- Dash (forward): L or Shift after the Mist Dash relic is found
- Backdash (with i-frames): V or Backslash — always available
- Sub-Weapon throw: B or N (consumes hearts)
- Sub-Weapon switch: hold Down + tap B/N to cycle owned weapons
- Item Crash: hold Up + tap B/N (20 hearts, only on the ground) — unique ultimate per weapon
- Pause / open menu: Escape (also Tab/I)
- Interact (rest at shrines): E or Enter
- Hint / What to do next: H or /
- Map: Tab or I
- Audio: M
- Mobile: use the on-screen buttons (including Down for crouch/doors) or swipe on the canvas
- Fullscreen: FS button

## Game Shape

- Room-based castle map with persistent visited rooms
- Relic-gated progression: Grave Boots, Mist Dash, Moon Sigil
- Grave Boots upgrade double jump into Triple Moonstep
- Moon Sigil turns the spell into a three-way moon arc
- W and ArrowUp can trigger up-door control; Space/Z remain clean jump-only options
- Jump buffering and short-hop release make platforming sharper
- Wider whip hitboxes line up better with the visible whip arc
- Down-whip in the air bounces off enemies as a Moon pogo
- Softer enemy damage, slower pressure, and longer invulnerability after hits
- Horizontal camera rooms are about one and a half screens wide for better flow
- Vertical camera rooms are taller than one screen
- Sprite sheets use the stable pre-reference-slice versions
- Imagegen HD animated title scene with parallax overlays, fireflies, and Mode7-style foreground stretch
- Imagen HD 1920x1080 backgrounds across the main castle, branches, and new expansion rooms
- New Imagegen HD intro approach: Moonwood Verge into Castle Garden before Gate Hall
- Castle Garden includes statue/rose HD assets and an animated portcullis that drops and rises after passage
- Backgrounds use slower parallax scrolling, alpha overlay layers, and a lightweight Mode7-style floor fill
- Imagen HD 256px platform tiles replace the old 64px sheet and stay mapped to the collision-sized 48px grid
- Imagegen HD item icons replace the simple orb pickup placeholders
- Four new optional rooms: Moonlit Archives, Saint's Ossuary, Astral Aqueduct, and Star Bell Loft
- Lord Veyr uses a new Imagen-derived 16-frame HD boss strip
- Safer room exits use expanded trigger zones, spawn settling, transition cooldowns, and last-safe-ground recovery
- Mobile buttons use non-selectable icon glyphs to avoid Chrome copy overlays
- Aerial whip stalls descent briefly for safer mid-air attacks
- Moon chain combo rewards quick kills with extra MP
- Local sprite-sheet animation for player, enemies, boss, projectiles, and whip
- Reproducible slicing for the raw player and whip PNGs in `tools/slice-local-assets.py`
- Reproducible high-resolution backdrop generation in `tools/build-gothic-backgrounds.py`
- Reproducible Imagen atlas cropping in `tools/build-imagen-hd-backgrounds.py`
- Reproducible Imagen platform-tile cropping in `tools/build-imagen-hd-tiles.py`
- Reproducible Imagen expansion, parallax, intro, and boss processing in `tools/build-imagen-hd-expansion.py`, `tools/build-imagen-hd-parallax.py`, `tools/build-intro-assets.py`, and `tools/build-imagen-hd-boss.py`
- Local BGM and SFX
- Save/continue through `localStorage`
- Boss finale in the Crimson Reliquary
- Backdash with i-frames for SOTN-style movement
- Breakable candles in every room drop hearts, MP, HP, and rare sub-weapons
- Hearts are the currency for sub-weapons (Silver Dagger, War Axe, Holy Water)
- Holy Water lands on platforms and creates a flame puddle that ticks damage
- Save shrines in Gate Hall, Clockwork Rise, and Drowned Rose Garden fully restore HP/MP/Hearts on Interact (E/Enter)
- XP from kills levels you up to Lv 50, raising Max HP/MP/Hearts and base damage
- Sub-weapons and level persist with the rest of the save
- Item Crash ultimates: Silver Storm (dagger fan), Crescent Slam (axe shockwave), Sacred Rain (vials drop across the room)
- Death sends you back to the last save shrine instead of the title screen — progress, level and kills are kept
- Pause/menu shows live hunter stats: HP/MP/Hearts, Level, XP, Strength, Kills, Time
- Boss encounter opens with a fading "Lord Veyr / Crimson Rite" banner
- Game pauses while the menu is open — no more dying while reading stats
- Floating damage numbers on every hit (gold for enemies, orange for boss, red for self)
- Nightwing Bat familiar in Ashen Chapel — autonomous companion that dives at the nearest threat
- Mini-boss "Bone Wraith" patrols the Bone Bell Catacomb, gating the Grave Boots with a banner intro and 4× XP reward
- Equipment: **Ring of Ardor** (Gate Hall, +22 Luck, crit chance), **Bat Cloak** (Catacomb, +18% jump height), **Wraith Armor** (Clockwork Rise, +4 Defense)
- Critical hits proc on luck-roll: 1.7× damage, oversized golden popup, screen-shake

The game intentionally uses an original name, story, and characters while chasing the gothic exploration feel requested.
