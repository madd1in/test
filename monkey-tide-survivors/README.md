# Monkey Tide Survivors

Ein eigenstaendiges Vampire-Survivors-artiges Browsergame mit lokal wiederverwendeten Imagen-HD-Assets aus `coconut-corsair`.

## Inhalt

- Top-down-Survivors-Loop mit Auto-Waffen, XP, Level-ups, Bosswellen und Sieg-Timer.
- Neues Imagen-HD-Top-down-Strandfeld ohne sichtbare Kachelraster.
- Repeatable Strand-Map mit periodischen HD-Details fuer endlose Kamera-Bewegung ohne rechteckige Kachelkanten.
- Sauber normalisierte einzelne Imagen-HD-WebP-Props fuer Pfuetzen, Hecken, Schatzstellen, Muschelschreine, verlassene Strandhuetten und Bootswracks.
- Neuer Imagen-HD-Spieler-Skin-Atlas mit Startscreen-Auswahl fuer Kaeptnin, Insel-Pirat, Fluchaffe, Dhampir-Jaeger, Rum-Korsar, Sternenfarmboy und Freelance-Duo.
- Charakterauswahl nutzt einen normalisierten Auswahl-Atlas aus dem ersten statischen HD-Char-Sheet.
- Neues Imagen-HD-Walkcycle-Frameset mit 8 Frames fuer jeden alternativen Spieler-Skin.
- Erkundbare Huetten, Wracks, Schatzstellen und Muschelschreine droppen XP, Muenzen, kurze Rettungsfenster und kleine Notfall-Heilung.
- Runtime-Sprite-Sheets laufen ueber kompakte WebP-Varianten fuer schnelleren Mobile-Start.
- Neues Imagen-HD-WebP-Projektilsheet fuer Saebelbogen, Kokos-Bumerang, Flaschenbombe, Kompassblitz, Taukreis, Blutrosenburst, Geisterkugel und Affenfluch.
- Neuer Imagen-HD-Pergament-UI-Atlas fuer Startmenue, HUD, Skin-Auswahl, Buttons und Upgrade-Karten.
- Extra Imagen-HD-Sprites fuer Krabben, Affenidol, Banane, Rum-Bombe, Wasserhand und Charms.
- Gothic-Vampire-Hunter-Crossover mit Fledermaus, Knochenkorsar, Mond-Gargoyle, Blutrosen-Relikt und Kerzenprops.
- Imagen-HD-Frameset fuer einen LeChuck-artigen Fluchkapitaen als neuen Boss.
- Lokale BGM- und SFX-Dateien ohne externe Runtime-Abhaengigkeiten.
- Alle Runtime-SFX stammen aus den lokalen Downloads und sind leise unter die Musik gemischt.
- Musiklastiger Mix mit lauterem BGM, frueherem Rush-Loop und zurueckgenommenen SFX.
- Deutsche Browser-Sprachausgabe fuer Start, Level-ups, Bosswarnungen, niedrige HP und Endscreen.
- Ruhigere SFX, Tastatur, dynamischer Vollbild-Mobile-Joystick, Dash, Pause, Vollbild und Audio-Schalter.
- Mobile Kamera zoomt weiter raus; Portrait- und Querformat-HUD bleiben minimal.
- Mobile Preload ist leichter, weil alte ungenutzte HD-Hintergruende nicht mehr vor Spielstart geladen werden.
- Exakterer Ladebalken, der wirklich abgeschlossene Bild-Assets zaehlt statt parallel geladene Indexwerte zu raten.
- Strafferer Balance-Pass mit frueheren Bossen, mehr Spawn-Druck, Gegner-Projektilen, Cutlass+Coconut-Start, schnellerem Dash, starker XP-Magnet-/Undertow-Logik, Level-Heilung und besserer Bedrohungskurve.
- Transparentere Adventure-Piraten-GUI mit groesserem Monkey-Island-Einschlag.

## Spielen

`index.html` kann direkt ueber einen lokalen Server oder GitHub Pages geoeffnet werden.

## Test

```bash
node tools/smoke-test.cjs
```
