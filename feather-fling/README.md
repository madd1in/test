# Castle Fling: Nocturne

Ein lokales Gothic-Schleuder-Physics-Spiel mit ChatGPT-Image-Maps, eigener Spritemap, lokaler BGM und Touch-Swipe-Steuerung.

## Dateien

- `assets/ai/ai-background-map.png`: ChatGPT-Image-Hintergrundkarte fuer das Schloss-Level
- `assets/ai/ai-tile-map.png`: ChatGPT-Image-Tilemap fuer Boden und Gothic-Bauteile
- `assets/ai/ai-sprite-map.png`: ChatGPT-Image-Spritemap fuer Relikte, Gegner, Sling, Bloecke und Effekte
- `assets/ai/ai-bird-animation-map.png`: ChatGPT-Image-Animationssheet mit fuenf Bird-Projektilen und sechs Frames pro Bird
- `assets/sprite-map.png`: lokaler Fallback mit Relikten, Gothic-Bloecken, Skull-Fallback und Boden-Tiles
- `assets/gothic/`: lokale Fallback-Castle-Hintergruende, Floor-Tiles und Monster-Sprites
- `assets/audio/nocturne-hunter-loop.wav`: originaler lokaler Gothic-Action-Chiptune-Loop
- `tools/build_sprites.ps1`: lokaler Sprite-Builder
- `tools/build_gothic_bgm.py`: lokaler BGM-Synth-Builder
- `game.js`: Canvas-Spiel mit Matter.js-Physik

## Lokal starten

```powershell
npm.cmd install
npm.cmd run assets
Copy-Item node_modules\matter-js\build\matter.min.js vendor\matter.min.js -Force
npm.cmd run serve
```

Danach im Browser `http://127.0.0.1:8127/` oeffnen.
