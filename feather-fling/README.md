# Castle Fling: Nocturne

Ein lokales Gothic-Schleuder-Physics-Spiel mit ChatGPT-Image-Maps, eigener Spritemap, lokaler BGM und Touch-Swipe-Steuerung.
Die Spielflaeche wird per CSS auf die volle verfuegbare Displayflaeche gestreckt, waehrend die interne Physikwelt stabil bei 1024x576 bleibt.
Die Zielkurve nutzt denselben festen Matter.js-Zeitschritt wie der echte Flug, und Gegner werden beim Wegbrechen von Plattformen aktiv geweckt.
Der Vordergrund hat staerkere Rim-Lichter, Bodenschatten und eine Hintergrund-Wash fuer klarere Tiefentrennung.
Level 3 startet mit entkoppelten Gegnern und stabileren Kontaktpunkten, damit der Turm erst durch Treffer kollabiert.
Level 2 ist ebenfalls entkoppelt und der Renderer nutzt 2,5D-Seitenflaechen fuer Bloecke und Boden.
Das Spiel hat jetzt sechs Level-Ideen: Moon Gate, Glass Chapel, Clocktower Ruin, Gargoyle Belfry, Reliquary Bridge und Nocturne Keep.
Der neue ChatGPT-Image-Atlas liefert zusaetzliche Hintergrund-Panels, Tile-Akzente und Sprites fuer Gargoyle/Wisp/Raven-Gegner.

## Dateien

- `assets/ai/ai-background-map.png`: ChatGPT-Image-Hintergrundkarte fuer das Schloss-Level
- `assets/ai/ai-tile-map.png`: ChatGPT-Image-Tilemap fuer Boden und Gothic-Bauteile
- `assets/ai/ai-sprite-map.png`: ChatGPT-Image-Spritemap fuer Relikte, Gegner, Sling, Bloecke und Effekte
- `assets/ai/ai-bird-animation-map.png`: ChatGPT-Image-Animationssheet mit fuenf Bird-Projektilen und sechs Frames pro Bird
- `assets/ai/ai-expansion-atlas.png`: ChatGPT-Image-Erweiterungsatlas mit drei Backgrounds, neuen Tile-Zellen und Gegner-/Effekt-Sprites
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
