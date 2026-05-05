# Glimmerwald Quest

Ein eigenstaendiges, Zelda-inspiriertes Top-down-Browsergame mit lokalen Assets.

## Start

`index.html` im Browser oeffnen. Das Spiel nutzt keine externen CDNs, keine npm-Abhaengigkeiten und keine Nintendo-Assets.

## Steuerung

- `WASD` oder Pfeiltasten: bewegen
- `Leertaste` oder `J`: Klingenangriff
- `Shift` oder `K`: Dash
- `E`: interagieren
- `Q`: Trank verwenden
- `P` oder `Escape`: Pause
- Touch: D-Pad, Action-Buttons, Swipe/Drag im Spielfeld zum Laufen, schneller Swipe fuer Dash, Tap fuer Angriff
- Button `Fullscreen`: Vollbild umschalten

## Inhalt

- Offene Waldkarte mit drei Schreinen
- Lokale Sprite-/Tile-SVGs fuer Figuren, Umgebung, Items und UI
- Autotile-Atlas `assets/environment/tile-sprite-map-autotile-v5.png` mit 51 Frames, darunter Pfad-/Wasser-Uebergaenge, Varianten und Bruecken-Top/Mitte/Bottom
- Enemy-Atlas `assets/characters/enemy-sprite-map-animated-v2.png` mit 4 Frames je Gegner fuer Thornling, Brute, Wisp und Boss
- Objekt-/Item-Atlas `assets/items/object-sprite-map-imagen.png` fuer Truhen, Key, Potion, Gem, Siegel, Heart, Bush und Gate
- Player-Atlas `assets/characters/player-sprite-map-combat-v2.png` mit 24 Frames fuer Richtungen, Lauf-Step und integrierte Schwertphasen
- Slash-Atlas `assets/ui/slash-sprite-map.png` mit 4 Frames fuer die Schwertanimation
- Klassisch-fantasy HUD mit Serif-Font, Goldrahmen und Adventure-Panel-Stil
- Lokale WAV-SFX und geloopte BGM unter `assets/audio`
- Gegner-KI, Bosskampf, Kisten, Schluessel, Heilung, Minimap und Savegame
- Performance-Cache fuer statische Tile-Layer und wiederverwendete Sprite-Raster
