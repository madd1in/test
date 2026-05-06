# Super Tile Hopper

Ein komplett neues, eigenstaendiges Jump-and-run im klassischen Side-Scroller-Stil. Das Spiel nutzt keine fremden Marken-Sprites: Figuren, Tiles, Coins und Gegner werden als lokale Canvas- und Imagen-Atlanten gerendert.

## Start

Oeffne `index.html` direkt im Browser.

## Steuerung

- Links/Rechts oder A/D: laufen
- Shift oder K: sprinten; in der Luft antippen fuer Air-Dash
- Space, Pfeil hoch oder W: springen, in der Luft zweimal nachsetzen fuer Triple-Jump
- P oder Escape: Pause
- R: Neustart
- Vollbild-Button im HUD: Fullscreen umschalten

Auf Touch-Geraeten erscheinen On-Screen-Buttons fuer links/rechts, Dash/Sprint und Sprung. Zusaetzlich reagiert die linke Bildschirmhaelfte als Bewegungszone und die rechte Bildschirmhaelfte als Sprung-/Dash-Zone.

## Inhalt

- HD-Mascot-Atlas fuer Held, Items, Coins und Basisgegner
- Getrimmtes Gameplay-Atlasblatt `assets/imagen-hd/gfx/hd-clean-gameplay-atlas.png`
- Playfield-Tileset `assets/imagen-hd/gfx/hd-playfield-tileset-imagen.png`
- Neues Theme-/Hazard-Atlasblatt `assets/imagen-hd/gfx/hd-theme-hazard-atlas-imagen.png` fuer saubere Piranha-Frames, Blue-Beetle, Meadow-, Cloud-, Cave- und Palace-Tiles
- Wiederholbarer Imagen-Hintergrund `assets/imagen-hd/gfx/hd-repeatable-background-imagen.png` mit Parallax-Layern
- Drei Level mit klareren Themes: Meadow, Sky-Palace und Cave-Rush
- Pro-Level-BGM aus dem lokalen Downloads-Ordner
- Entschaerfte Abgruende, aufgeraeumtere Moving-Platform-Linien und naeherer Desktop-Zoom
- Piranha-Pipes als Timing-Gefahr; Star-Rush kann sie kurz betauben
- Sky-Level nutzt Blue-Beetles, Cave-Level nutzt Cave-Rock-Tiles, Meadow-Level nutzt Gras/Blumen-Tiles
- Triple-Jump, Air-Dash, Aero-Ringe, Sky-Shards, Relics, Star-Rush und Stomp-Combos
- Responsive Mobile-Steuerung mit Multi-Touch-Tracking, Dash-Buffer und Screen-Tap-Zonen

## Assets neu bauen

`node tools/build-assets.js`

Workspace-/Imagen-Imports neu kopieren:

`node tools/import-workspace-assets.js`

Komplett neue PNG-Maps neu generieren:

`node tools/build-original-png-assets.js`

## Importierte Assets

Die importierten Dateien liegen unter `assets/imported/`. Sie wurden aus lokalen Workspace-Projekten kopiert, damit dieses Spiel eigenstaendig laeuft.

Die aktive Basisgrafik nutzt `assets/imagen-hd/gfx/hd-mascot-platformer-atlas.png` mit frameweiser Freistellung. Kaefer kommen aus `assets/imagen-hd/gfx/hd-clean-gameplay-atlas.png`. Basis-Tiles kommen aus `assets/imagen-hd/gfx/hd-playfield-tileset-imagen.png`; die saubereren Piranhas, Theme-Tiles und Sky-Blue-Beetles kommen aus `assets/imagen-hd/gfx/hd-theme-hazard-atlas-imagen.png`.
