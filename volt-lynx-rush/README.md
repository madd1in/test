# Volt Lynx Rush

Ein neues, eigenstaendiges Speed-Platformer-Browserspiel mit eigener Figur und eigener Asset-Map.

## Spielen

Oeffne `index.html` im Browser oder starte einen kleinen statischen Server im Ordner.

Controls:

- Links/Rechts oder A/D: laufen
- Space, W oder Pfeil hoch: springen
- Shift oder K: Boost
- Pfeil runter oder S: rollen
- M-Button oder Audio-Taste im HUD: Audio an/aus
- P: Pause
- R: Neustart

## Assets

- `assets/asset-map.svg`: exakt geschnittene Runtime-Asset-Map
- `assets/asset-map.json`: Frame-Koordinaten und Animationen
- `assets/sliced/`: 40 physische PNG-Slices, die die Runtime bevorzugt laedt
- `assets/imagen-asset-map-preview.png`: generierte visuelle Asset-Map-Vorlage
- `assets/imagen-hd/volt-lynx-hd-tile-sprite-map.png`: neue HD-Imagen-Sprite/Tileset-Map
- `assets/imagen-hd/sliced/`: 34 HD-Slices fuer Terrain, Backdrops, Wasser, Boostpads und Setpieces
- `assets/imported/`: neutrale lokale Parallax-Grafiken aus dem Downloads-Ordner
- `assets/audio/needle-meadow-sprint.mp3`: lokale BGM-Datei aus dem Downloads-Ordner

Die Terrain-Tiles werden als wiederholbare 64px-Frames gerendert. Zusaetzlich gibt es einen kleinen Mode-7-artigen Bodenpass, der eine repeatable Tile-Textur perspektivisch streckt, falls der sichtbare Boden groesser als die eigentliche Tile-Textur ist. Das Level ist jetzt knapp 9.8k Pixel breit und hat mehrere Routen, 4 Loop-Zonen, 5 Checkpoints und 150+ Hoops.

Der Runner ist bewusst als eigener "Volt Lynx" gestaltet. Es werden keine offiziellen Sonic-Sprites, Logos oder Figuren verwendet.

## Test

```powershell
node tools/browser-smoke.js
```

Der Smoke-Test startet einen lokalen Server, spielt kurz an, oeffnet die Asset-Map und speichert `smoke/browser-smoke.png`.

Asset-Slices neu bauen:

```powershell
node tools/slice-assets.js
node tools/slice-hd-imagen.js
```
