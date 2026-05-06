# Super Tile Hopper

Ein komplett neues, eigenstaendiges Jump-and-run im klassischen Side-Scroller-Stil. Das Spiel nutzt keine fremden Marken-Sprites: Figuren, Tiles, Coins und Gegner werden als Pixel-Sprite-Atlanten im Canvas erzeugt und dann ueber eine Tilemap gerendert.

## Start

Oeffne `index.html` direkt im Browser.

## Steuerung

- Links/Rechts oder A/D: laufen
- Shift oder K: sprinten; in der Luft antippen fuer Air-Dash
- Space, Pfeil hoch oder W: springen, in der Luft zweimal nachsetzen fuer Triple-Jump
- P oder Escape: Pause
- R: Neustart

Auf Touch-Geraeten erscheinen eigene On-Screen-Buttons.

## Inhalt

- Sprite-Atlas fuer Held, Gegner, Coins und Dekor
- Lokale SVG-Grafikassets fuer Parallax-Layer, Aero-Ringe und Sky-Shards
- Lokale WAV-Assets fuer SFX und eine kleine geloopte BGM
- Asset-Map unter `assets/asset-map.json` fuer neue Original-Atlanten plus importierte Fallbacks
- Neues Imagen-HD-Atlasblatt unter `assets/imagen-hd/gfx/hd-imagen-atlas.png`
- Neue Original-PNG-Maps fuer Tileset, Sprite-Sheet und Background
- Importierte Imagen-Grafikmaps bleiben als Fallback im Projekt
- Importierte Workspace-Audioquellen fuer BGM, Pickup, Gate, Hit und Hurt
- Tile-Atlas fuer Gras, Erde, Bricks, Bonus-Blocks, Plattformen und Sprungfedern
- Handgebautes Tilemap-Level mit Luecken, Hoehenwechseln, Coins, Sky-Shards, Aero-Ringen, Gegnern, Checkpoint und Ziel
- Parallax-Hintergrund mit Sonne, Wolken, Bergen und Huegeln
- Platformer-Physik mit Coyote-Time, Jump-Buffer, variablem Sprung, Triple-Jump, Air-Dash, Gegner-Stomp, Respawn und lokalem Sound
- Relic-Pickups als riskantere Nebenroute; jedes Relic gibt einen kurzen Boost und ein Bonusleben
- Aero-Ringe, Sky-Shards und Stomps laden jetzt Air-Jumps und Dash wieder auf

## Assets neu bauen

`node tools/build-assets.js`

Workspace-/Imagen-Imports neu kopieren:

`node tools/import-workspace-assets.js`

Komplett neue PNG-Maps neu generieren:

`node tools/build-original-png-assets.js`

## Importierte Assets

Die importierten Dateien liegen unter `assets/imported/`. Sie wurden aus lokalen Workspace-Projekten kopiert, damit dieses Spiel eigenstaendig laeuft:

- `glimmerwald-quest/assets/...` fuer Imagen-Tiles, Charaktere, Gegner, Objekte und WAV-Sounds
- `pixel-plumber-platformer/assets/bg_cloud_bank.png` fuer einen zusaetzlichen Wolkenlayer

Die aktuell aktive Grafik liegt unter `assets/original/gfx/` und wird aus `tools/build-original-png-assets.js` erzeugt.
