# Monkey Tide Survivors

Ein eigenstaendiges Vampire-Survivors-artiges Browsergame mit lokal wiederverwendeten Imagen-HD-Assets aus `coconut-corsair`.

## Inhalt

- Top-down-Survivors-Loop mit Auto-Waffen, XP, Level-ups, Bosswellen und Sieg-Timer.
- Neues Imagen-HD-Top-down-Strandfeld ohne sichtbare Kachelraster.
- Repeatable Strand-Map mit periodischen HD-Details fuer endlose Kamera-Bewegung ohne rechteckige Kachelkanten.
- Sauber normalisierte einzelne Imagen-HD-WebP-Props fuer Pfuetzen, Hecken, Schatzstellen, Muschelschreine, verlassene Strandhuetten und Bootswracks.
- Pfuetzen und Spieler-/Waffen-Auren wurden mit neuen Imagen-HD-Raster-Assets ersetzt; die sichtbaren Canvas-Kreis-/Beam-Effekte sind raus.
- Neuer Imagen-HD-Spieler-Skin-Atlas mit Startscreen-Auswahl fuer Kaeptnin, Insel-Pirat, Fluchaffe, Dhampir-Jaeger, Rum-Korsar, Sternenfarmboy und Freelance-Duo.
- Charakterauswahl nutzt einen normalisierten Auswahl-Atlas aus dem ersten statischen HD-Char-Sheet.
- Neues Imagen-HD-Walkcycle-Frameset mit 8 Frames fuer jeden alternativen Spieler-Skin.
- Erkundbare Huetten, Wracks, Schatzstellen und Muschelschreine droppen XP, Muenzen, kurze Rettungsfenster und kleine Notfall-Heilung.
- Massive Strandhindernisse aus Hecken, Huetten, Wracks und Schreinen blockieren Spieler und Bodengegner; Geister und fliegende Gegner koennen sie durchqueren.
- Runtime-Sprite-Sheets laufen ueber kompakte WebP-Varianten fuer schnelleren Mobile-Start.
- Neues Imagen-HD-WebP-Projektilsheet fuer Saebelbogen, Kokos-Bumerang, Flaschenbombe, Kompassblitz, Taukreis, Blutrosenburst, Geisterkugel und Affenfluch.
- Extra Imagen-HD-FX-Sheet fuer Tau-Aura, Kompass-Beam, Rum-Schockwelle, Curse-Burst, Cutlass-Afterglow und Schatz-Glints.
- Zwei neue Imagen-HD-Sheets fuer acht zusaetzliche Gegner und acht neue Relikt-/Item-Icons.
- Neue Gegner im Spawn-Mix: Reef Raider, Powder Imp, Tide Witch, Saltbone Fencer, Lantern Wraith, Barrel Maw, Storm Duelist und Coral Brute als Bosskandidat.
- Neue Relikt-Upgrades wie Flutperle, Schwarzpulverbeutel, Affenpfote, Kaeptninsiegel, Flutstiefel, Voodoo-Puppe, Obsidian-Kompass und Grog-Laterne.
- Neuer Imagen-HD-Pergament-UI-Atlas fuer Startmenue, HUD, Skin-Auswahl, Buttons und Upgrade-Karten.
- Extra Imagen-HD-Sprites fuer Krabben, Affenidol, Banane, Rum-Bombe, Wasserhand und Charms.
- Gothic-Vampire-Hunter-Crossover mit Fledermaus, Knochenkorsar, Mond-Gargoyle, Blutrosen-Relikt und Kerzenprops.
- Imagen-HD-Frameset fuer einen LeChuck-artigen Fluchkapitaen als neuen Boss.
- Lokale BGM- und SFX-Dateien ohne externe Runtime-Abhaengigkeiten.
- Alle Runtime-SFX stammen aus den lokalen Downloads und sind leise unter die Musik gemischt.
- Treibenderer lokaler BGM-Mix aus `Crimson Galleon` als Main-Track und `Gargoyle Chapel Run` als frueher Rush-Layer; SFX bleiben leise darunter.
- BGM laeuft jetzt als ein eindeutiger aktiver Track mit Rush-Handoff statt zwei ueberlappender MP3-Spuren.
- Jede Karte nutzt ein eigenes leichtes HD-Background-Asset und ein eigenes lokales BGM-Profil.
- Strand-Backgrounds sind pfuetzenfrei; sichtbare Wasserstellen kommen als separate HD-Raster-Decals und Chunk-Props.
- Sam-und-Max/Freelance-Duo nutzt ein eigenes sauber gecropptes HD-Duo-Sprite statt der zu engen Walkcycle-Zelle.
- Welt laeuft jetzt als grosse repeatable Chunk-Map ohne spuerbare Strandkante; Props, Wracks, Hecken und Pfuetzen werden um den Spieler nachgeladen.
- Mobile rendert mit niedrigerem DPR, kleinerem Gegner-Cap und weiter herausgezogener Kamera; Start versucht auf Mobile direkt Querformat/Vollbild.
- HD-Pfuetzen sind wieder sichtbar und geben beim Durchlaufen einen kleinen Gezeiten-Slip statt nur Deko zu sein.
- Erkunderte Buesche, Huetten und Wracks bleiben voll gemalt statt ausgegraut; Schatzfunde wechseln auf ein eigenes offenes Imagen-HD-Truhenasset.
- Dreikoepfiger Affe ist als eigener Imagen-HD-Boss im Boss-Zyklus und feuert eine dreifache Fluchsalve.
- Map-spezifische Busch-/Hecken-Hindernisse nutzen die HD-Prop-Assets und bleiben Teil der Kollisionslogik.
- Upgrade-Auswahl pausiert den Run nur noch in groesseren Abstaenden; Zwischenlevel geben nicht-blockierende Flow-Boni.
- Vier Kartenvarianten mit Map-Auswahl, gespeicherten Achievements, freischaltbaren Karten und kleinen Startrelikten.
- Temporäre Power-up-Drops wie Grog-Tempo, Pulverfieber, Flutmagnet und Voodoo-Schutz sorgen fuer Zwischenziele im Run.
- Power-up-Pickups haben kleineren Text, weniger Magnet-Sog und deutlich leisere Sounds, damit der Run nicht staendig stolpert.
- Deutsche Browser-Sprachausgabe fuer Start, Level-ups, Bosswarnungen, niedrige HP und Endscreen.
- Ruhigere SFX, Tastatur, dynamischer Vollbild-Mobile-Joystick, Dash, Pause, Vollbild und Audio-Schalter.
- Upgrade-Karten lassen sich auf Desktop per Pfeilen/WASD, 1-3 und Enter/Space waehlen, ohne den Mausgriff im Spielfluss.
- Kill-Streaks geben XP-Sog und spawnen Streak-Schaetze, damit aggressive Routen mehr Belohnung und kleine Ziele bekommen.
- Kamera zoomt auf Desktop und Mobile weiter raus; Portrait- und Querformat-HUD bleiben minimal.
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
