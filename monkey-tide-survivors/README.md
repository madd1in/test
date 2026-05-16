# Monkey Tide Survivors

Ein eigenstaendiges Vampire-Survivors-artiges Browsergame mit lokal wiederverwendeten Imagen-HD-Assets aus `coconut-corsair`.

## Inhalt

- Top-down-Survivors-Loop mit Auto-Waffen, XP, Level-ups, Bosswellen und Sieg-Timer.
- Neues Imagen-HD-Top-down-Strandfeld ohne sichtbare Kachelraster.
- Repeatable Strand-Map mit periodischen HD-Details fuer endlose Kamera-Bewegung ohne rechteckige Kachelkanten.
- Neue kompakte Imagen-HD-WebP-Props fuer Pfuetzen, Hecken, Schatztruhen, verlassene Strandhuetten und Bootswracks.
- Erkundbare Huetten, Wracks und Schatztruhen droppen XP, Muenzen und kleine Notfall-Heilung.
- Runtime-Sprite-Sheets laufen ueber kompakte WebP-Varianten fuer schnelleren Mobile-Start.
- Extra Imagen-HD-Sprites fuer Krabben, Affenidol, Banane, Rum-Bombe, Wasserhand und Charms.
- Gothic-Vampire-Hunter-Crossover mit Fledermaus, Knochenkorsar, Mond-Gargoyle, Blutrosen-Relikt und Kerzenprops.
- Imagen-HD-Frameset fuer einen LeChuck-artigen Fluchkapitaen als neuen Boss.
- Lokale BGM- und SFX-Dateien ohne externe Runtime-Abhaengigkeiten.
- Neuere Download-SFX fuer Dash, Pickup-Akzent, Upgrade, Heavy-Hit und Boss-Momente, leise unter die Musik gemischt.
- Musiklastiger Mix mit lauterem BGM, frueherem Rush-Loop und zurueckgenommenen SFX.
- Deutsche Browser-Sprachausgabe fuer Start, Level-ups, Bosswarnungen, niedrige HP und Endscreen.
- Ruhigere SFX, Tastatur, dynamischer Vollbild-Mobile-Joystick, Dash, Pause, Vollbild und Audio-Schalter.
- Mobile Kamera zoomt weiter raus; Portrait- und Querformat-HUD bleiben minimal.
- Mobile Preload ist leichter, weil alte ungenutzte HD-Hintergruende nicht mehr vor Spielstart geladen werden.
- Flowigerer Balance-Pass mit Cutlass+Coconut-Start, schnellerem Dash, starker XP-Magnet-/Undertow-Logik, frueheren Level-ups, Level-Heilung und weicheren Boss-/Spawn-Kurven.
- Transparentere Adventure-Piraten-GUI mit groesserem Monkey-Island-Einschlag.

## Spielen

`index.html` kann direkt ueber einen lokalen Server oder GitHub Pages geoeffnet werden.

## Test

```bash
node tools/smoke-test.cjs
```
