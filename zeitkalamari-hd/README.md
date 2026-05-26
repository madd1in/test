# Zeitkalamari HD

Ein eigenständiges, browserbasiertes Point-and-Click-Mini-Adventure im Geist klassischer Comic-Zeitreise-Abenteuer, aber ohne geschützte Figuren, Storylines oder Assets aus bestehenden Spielen.

## Spielen

Öffne `index.html` im Browser. Das Spiel ist statisch und benötigt keinen Build-Schritt.

## Prüfen

```powershell
node tools\smoke-test.js
python tools\verify-calibrated-assets.py
```

Imagen-Runtime-Assets neu bauen:

```powershell
python tools\prepare-imagen-assets.py
python tools\build-imagen-runtime-assets.py
python tools\build-calibrated-scene-assets.py
```

## Inhalt

- Drei spielbare Zeiträume: Gegenwart, 1876 und 2189
- Klassisches Verb-Interface: Schau, Nimm, Benutze, Rede
- Inventar mit Kombinationslogik und durchspielbarer Rätselkette
- Imagen-HD-Hintergrundmatten plus separate animierte Overlay-Layer
- Eigene SVG-Fallbacks und Item-Icons
- Persistenter Spielstand über `localStorage`

## Asset-Layer

Die aktuellen Imagen-Assets liegen unter `assets/imagen/`.

- `scenes/`: statische Background-Matten ohne bewegliche Elemente
- `layers/`: freigestellte NPCs und animierte Objekt-Layer
- `frames/`: Sprite-Sheets für alle beweglichen Layer
- `vfx/`: separate Glow-Texturen für Portal und Vacuum Tubes
- `ui/`: Imagen-GUI-Atlas und zugeschnittene GUI-Panels/Buttons
- `fonts/`: Bitmap-Font-Atlas und gerenderte feste GUI-Labels
- `sources/`: unbearbeitete Chroma-Key-Quellen der freigestellten Layer
- `calibrated/`: pixelkalibrierte Master-Composites und Sprite-Ausschnitte

Die Szene bleibt auf einer festen 16:9-Logikfläche. Die aktiven Spielräume verwenden `calibrated/masters/*-master-1920.png`; alle beweglichen Layer in `calibrated/frames/` sind direkte Ausschnitte aus demselben Masterbild. Der erste Frame jedes Sprite-Sheets ist pixelidentisch mit dem darunterliegenden Master-Ausschnitt. Es gibt kein `cover`-Cropping und keine 4:3-Sonderbühne auf Mobile.

## Rätselkette

Der Zeitmotor braucht Hefegel und eine geladene Resonanzgabel. Kaffee hilft der Vergangenheit, ein Coupon öffnet die Zukunft, ein Snack lenkt den Wächter ab und der Sicherungskasten lädt die Stimmgabel.
