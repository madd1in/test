# Glimmerwald Quest

Ein eigenstaendiges, Zelda-inspiriertes Top-down-Browsergame mit lokalen Assets.

Weitere Deploys:

- [Resonance Lab FPS](./resonance-lab-fps/)

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
- Lokale WAV-SFX und geloopte BGM unter `assets/audio`
- Gegner-KI, Bosskampf, Kisten, Schluessel, Heilung, Minimap und Savegame
- Performance-Cache fuer statische Tile-Layer und wiederverwendete Sprite-Raster
