# Aethergate III: Shards of Veyra

An original HD browser grid RPG inspired by classic first-person party dungeon crawlers. It does not use Might and Magic names, story, characters, or assets.

This version uses a true Three.js WebGL dungeon: 3D walls, floors, props, camera movement, dynamic lights, fog, animated flame sprites, grounded enemy rigs, and HD enemy frame animations.

## Play

Open `index.html` in a browser.

Keyboard:

- `W` or `ArrowUp`: move forward
- `S` or `ArrowDown`: step back
- `A` or `ArrowLeft`: turn left
- `D` or `ArrowRight`: turn right
- `Space`: strike in combat or search while exploring
- `R`: rest

## Features

- True 3D first-person grid exploration
- Four-character party with HP, MP, roles, and portraits
- Turn-based encounters with original HD enemy frame sets and grounded shadows
- Chests, fountains, shrines, a Prism Key objective, and a boss gate
- Local MP3 BGM plus local SFX assets copied from disk
- LocalStorage save/load
- Minimap, chronicle log, inventory, and compact no-scroll desktop HUD

## Generated HD Assets

The image assets were generated specifically for this project and copied into `assets/imagen/`:

- `scene-atlas.png`: four exploration scene quadrants
- `enemy-atlas.png`: four enemy portrait quadrants
- `party-atlas.png`: four party portrait quadrants
- `surface-atlas.png`: four HD 3D material quadrants for dungeon walls, floors, and ceilings
- `prop-atlas.png`: four HD prop quadrants for chest, fountain, prism key, and gate billboards
- `enemy-frames.png`: chroma-keyed 4x4 HD enemy animation frame atlas
- `tile-detail-atlas.png`: 4x4 HD dungeon floor, wall, trim, and prop tile set

Final prompt family: original high-fantasy HD game concept art, no text, no logos, no watermarks, no copyrighted franchise references.

## Local Audio Assets

- `assets/audio/bgm/aether-bgm-loop.mp3`
- `assets/audio/sfx/impact.mp3`
- `assets/audio/sfx/gem-pickup.mp3`
- `assets/audio/sfx/relic-ping.mp3`
- `assets/audio/sfx/surge-burst.mp3`
- `assets/audio/sfx/arcane-start.mp3`
- `assets/audio/sfx/checkpoint.mp3`
- `assets/audio/sfx/slash.wav`
- `assets/audio/sfx/hit.wav`
- `assets/audio/sfx/hurt.wav`
- `assets/audio/sfx/pickup.wav`
- `assets/audio/sfx/gate.wav`
