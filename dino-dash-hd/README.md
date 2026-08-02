# Dino Dash HD

Ein schneller, direkt im Browser spielbarer Urzeit-Endless-Runner. Diese HD-Fassung ergänzt das ursprüngliche Canvas-Spiel um animierte Sprite-Atlanten, biomeabhängige Terrain-Tilemaps, adaptive Smooth-Grafik und eine dynamische MP3-Playlist für die einzelnen Zonen.

## Spielen

Öffne `index.html` über einen lokalen Webserver oder GitHub Pages.

- `Leertaste` / `↑`: springen und Doppelsprung
- `↓`: ducken; am höchsten Punkt einen Salto auslösen
- `P`: Pause
- `C`: tägliche Challenge
- Touch: große Tasten am unteren Bildschirmrand

Das Spiel speichert Highscore, Skins und Erfolge lokal im Browser.

## Assets

- `assets/images/dino-sprites.png`: transparenter 4×4-Animationsatlas
- `assets/images/biome-tiles.png`: 4×4-Terrain-Atlas für vier Biome
- `assets/images/biome-decor.png`: transparenter 4×4-Dekor-Atlas mit 16 Biome-Objekten
- `assets/images/obstacle-sprites.png`: transparenter 4×4-Atlas für Kakteen, Feuerbälle, Pterosaurier und T-Rex
- `assets/images/biome-hills.png`: vier vorgerenderte, biomeigene Hügelketten für die Parallax-Ebene
- `assets/images/biome-skies.png`: vier vollständige obere Himmelspanoramen
- `assets/images/alpha-bird-sprites.png`: transparenter 4×4-Animationsatlas für den Alpha-Pterosaurier
- `assets/images/aura-ring-tiles.png`: transparenter 4×4-Effektatlas für Schild, Fever und Portal
- `assets/images/gui-title-atlas.png`: transparenter GUI-Sprite-Atlas für Titelrahmen, Panels, Buttons und Status-Badges
- `assets/images/boss-vfx-atlas.png`: transparenter 4×4-VFX-Atlas für Blitze, Alpha-Flugkorridor, Federwind und Einschläge
- `assets/audio/cliffline-run.mp3`: Smaragdtal-Musik
- `assets/audio/dust-run-riot.mp3`: Wüsten-Musik
- `assets/audio/black-ice-apex.mp3`: Schneefeld-Musik
- `assets/audio/lanterns-in-the-cave.mp3`: Höhlen- und Aether-Musik

Die Bild-Assets wurden für dieses Projekt mit OpenAI ImageGen erzeugt.

## Test

`node tools/smoke-vm.js` prüft Boot, 240 Simulationsframes, alle zehn Sprite-/Tile-Caches, Biome-Musik, synchrones Boden-Scrolling, VFX-Rendering und den Safe-Mode-Schutz der Kernassets.
