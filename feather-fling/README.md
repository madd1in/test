# Castle Fling: Nocturne

Ein lokales Gothic-Schleuder-Physics-Spiel mit ChatGPT-Image-Maps, eigener Spritemap, lokaler BGM und Touch-Swipe-Steuerung.

## Dateien

- `assets/ai/ai-background-map.png`: ChatGPT-Image-Hintergrundkarte fuer das Schloss-Level
- `assets/ai/ai-tile-map.png`: ChatGPT-Image-Tilemap fuer Boden und Gothic-Bauteile
- `assets/ai/ai-sprite-map.png`: ChatGPT-Image-Spritemap fuer Relikte, Gegner, Sling, Bloecke und Effekte
- `assets/sprite-map.png`: lokaler Fallback mit Relikten, Gothic-Bloecken, Skull-Fallback und Boden-Tiles
- `assets/gothic/`: lokale Fallback-Castle-Hintergruende, Floor-Tiles und Monster-Sprites
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
