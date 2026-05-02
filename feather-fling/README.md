# Castle Fling: Nocturne

Ein lokales Gothic-Schleuder-Physics-Spiel mit eigener Spritemap, wiederverwendeten Castle-Assets und Touch-Swipe-Steuerung.

## Dateien

- `assets/sprite-map.png`: generierte Spritemap mit Relikten, Gothic-Bloecken, Skull-Fallback und Boden-Tiles
- `assets/gothic/`: wiederverwendete lokale Castle-Hintergruende, Floor-Tiles und Monster-Sprites
- `assets/audio/moonlit-castle-ruins.mp3`: lokaler Gothic-BGM-Track
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
