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
- Vollbild-Button im HUD: Fullscreen umschalten

Auf Touch-Geraeten erscheinen groessere On-Screen-Buttons fuer links/rechts, Dash/Sprint und Sprung. Zusaetzlich reagiert die linke Bildschirmhaelfte als Bewegungszone und die rechte Bildschirmhaelfte als Sprung-/Dash-Zone.

## Inhalt

- Sprite-Atlas fuer Held, Gegner, Coins und Dekor
- Lokale SVG-Grafikassets fuer Parallax-Layer, Aero-Ringe und Sky-Shards
- Lokale WAV-Assets fuer SFX und eine kleine geloopte BGM
- Asset-Map unter `assets/asset-map.json` fuer neue Original-Atlanten plus importierte Fallbacks
- Neues Imagen-HD-Atlasblatt unter `assets/imagen-hd/gfx/hd-imagen-atlas.png`
- Neues sauberer gerastertes Mascot-Platformer-Imagen-Atlasblatt unter `assets/imagen-hd/gfx/hd-mascot-platformer-atlas.png`
- Neues transparent getrimmtes Gameplay-Imagen-Atlasblatt unter `assets/imagen-hd/gfx/hd-clean-gameplay-atlas.png` fuer Kaefer, Wolken-Tile, Checkpoint-Fahne und Zielfahne
- Neues Imagen-Tileset unter `assets/imagen-hd/gfx/hd-playfield-tileset-imagen.png` fuer Gras, Dirt, Bricks, Bonus-Blocks, Pipes, Piranhas, Cloud-Tiles und animierte Fahnen
- Neuer horizontal wiederholbarer Imagen-Hintergrund unter `assets/imagen-hd/gfx/hd-repeatable-background-imagen.png`
- Vier Parallax-Layer aus demselben Imagen-Background: Sky/Clouds, Far Hills, Near Hills und Foreground Foliage
- Neue Original-PNG-Maps fuer Tileset, Sprite-Sheet und Background
- Importierte Imagen-Grafikmaps bleiben als Fallback im Projekt
- Importierte Workspace-Audioquellen fuer BGM, Pickup, Gate, Hit und Hurt
- BGM aus dem lokalen Downloads-Ordner unter `assets/downloads/audio/sky-garden-relay.mp3`
- Tile-Atlas fuer Gras, Erde, Bricks, Bonus-Blocks, Plattformen und Sprungfedern
- Drei handgebaute Tilemap-Level mit entschärften Abgruenden, Hoehenwechseln, Wolken-Tiles, Pipes, Piranha-Hazards, Coins, Sky-Shards, Aero-Ringen, Gegnern, Checkpoints und Zielfahnen
- Parallax-Hintergrund mit Sonne, Wolken, Bergen und Huegeln
- Platformer-Physik mit Coyote-Time, Jump-Buffer, variablem Sprung, Triple-Jump, Air-Dash, Gegner-Stomp, Respawn und lokalem Sound
- Relic-Pickups als riskantere Nebenroute; jedes Relic gibt einen kurzen Boost und ein Bonusleben
- Aero-Ringe, Sky-Shards und Stomps laden jetzt Air-Jumps und Dash wieder auf
- Star-Rush-Pickups geben kurzzeitig mehr Tempo und Schutz gegen Gegnerkontakt
- Bewegliche Lift-Plattformen oeffnen neue Timing-Routen ueber groessere Luecken
- Piranha-Pipes ergaenzen stationaere Timing-Gefahren; Star-Rush kann sie kurz betauben
- Animierte Zielfahnen und Checkpoint-Fahnen nutzen zwei Imagen-Frames
- Stomp-Combo-Boni belohnen mehrere Gegner-Treffer kurz hintereinander mit Bonus-Coins
- Responsivere Mobile-Steuerung mit Multi-Touch-Tracking, Dash-Buffer, groesseren Buttons und Screen-Tap-Zonen

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

Die aktuell aktive Basisgrafik nutzt `assets/imagen-hd/gfx/hd-mascot-platformer-atlas.png` mit frameweiser Freistellung. Kaefer kommen aus dem extra getrimmten `assets/imagen-hd/gfx/hd-clean-gameplay-atlas.png`, damit die Gegner nicht mehr grob ausgeschnitten wirken. Aktive Tiles, Pipes, Piranhas, Cloud-Tiles und Flaggen-Animationen kommen aus `assets/imagen-hd/gfx/hd-playfield-tileset-imagen.png`. Der Hintergrund nutzt `assets/imagen-hd/gfx/hd-repeatable-background-imagen.png` mit Mirror-X-Repeat und vier unterschiedlich schnellen Parallax-Slices, damit der Loop ohne harte Naht laeuft. Die Original-PNG-Maps unter `assets/original/gfx/` bleiben als robuste Fallbacks erhalten.
