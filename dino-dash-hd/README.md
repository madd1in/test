# Dino Dash HD

Ein schneller, direkt im Browser spielbarer Urzeit-Endless-Runner. Diese HD-Fassung ergänzt das ursprüngliche Canvas-Spiel um einen animierten Dino-Sprite-Atlas, biomeabhängige Terrain-Tilemaps, adaptive Smooth-Grafik und den MP3-Soundtrack `Cliffline Run`.

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
- `assets/audio/cliffline-run.mp3`: Loop-Hintergrundmusik aus dem bereitgestellten Downloads-Ordner

Die Bild-Assets wurden für dieses Projekt mit OpenAI ImageGen erzeugt.

## Test

`node tools/smoke-vm.js` prüft Boot, 240 Simulationsframes, alle Sprite-/Tile-Caches, Biome-Rendering und die Safe-Mode-Wiederherstellung.
