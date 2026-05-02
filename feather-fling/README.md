# Feather Fling

Ein lokales Schleuder-Physics-Spiel mit eigener Spritemap, lokalem BGM und Touch-Swipe-Steuerung.

## Dateien

- `assets/sprite-map.png`: generierte Spritemap mit Projektilen, Bloecken, Ziel und Boden-Tiles
- `assets/sprite-map.json`: Atlas-Koordinaten fuer die einzelnen Sprites
- `assets/audio/pixel-quest-parade.mp3`: lokal uebernommener BGM-Track
- `tools/build_sprites.ps1`: lokaler Sprite-Builder
- `game.js`: Canvas-Spiel mit Matter.js-Physik

## Lokal starten

```powershell
npm.cmd install
npm.cmd run assets
Copy-Item node_modules\matter-js\build\matter.min.js vendor\matter.min.js -Force
npm.cmd run serve
```

Danach im Browser `http://127.0.0.1:8127/` oeffnen.
