# Monkey Tide Survivors

Ein eigenstaendiges Vampire-Survivors-artiges Browsergame mit lokal wiederverwendeten Imagen-HD-Assets aus `coconut-corsair`.

## Inhalt

- Top-down-Survivors-Loop mit Auto-Waffen, XP, Level-ups, Bosswellen und Sieg-Timer.
- Neues Imagen-HD-Top-down-Strandfeld ohne sichtbare Kachelraster.
- Repeatable Strand-Map mit periodischen HD-Details fuer endlose Kamera-Bewegung ohne rechteckige Kachelkanten.
- Background-Kacheln werden mit Rand-Crop und grossem Overlap gezeichnet, damit an Map-Grenzen kein sichtbarer Trennstrich entsteht.
- Sauber normalisierte einzelne Imagen-HD-WebP-Props fuer Pfuetzen, Hecken, Schatzstellen, Muschelschreine, verlassene Strandhuetten und Bootswracks; Busch- und Palmenhecken-Assets sind neu freigestellt ohne angeschnittene Atlasreste.
- Pfuetzen und Spieler-/Waffen-Auren wurden mit neuen Imagen-HD-Raster-Assets ersetzt; die sichtbaren Canvas-Kreis-/Beam-Effekte sind raus.
- Neuer Imagen-HD-Spieler-Skin-Atlas mit Startscreen-Auswahl fuer Kaeptnin, Insel-Pirat, Fluchaffe, Dhampir-Jaeger, Rum-Korsar, Sternenfarmboy und Freelance-Duo.
- Ryu, Ken, Guile und Chun Li stehen jetzt direkt oben in der Charakterauswahl und nutzen Imagen-HD-8-Frame-Walkcycles, Auswahlportraits, Traits und eigene BGM-Profile.
- Fighter haben automatische Signature-Moves mit sichtbarem Loadout-Cooldown: Hadoken, Dragon Kick, Sonic Boom und Lightning Kicks.
- Normalisiertes Walkcycle-Sheet fuer saubere Bottom-Center-Anker bei Fluchaffe, Dhampir-Jaeger, Rum-Korsar und Sternenfarmboy; Sternenfarmboy/Skywalker hat mehr Headroom im Frameset.
- Eigene BGM-Profile pro spielbarem Charakter mit lokalen MP3s, individuellen Startpunkten/Tempo-Varianten und passenden Rush-Handoffs.
- Ryu, Ken, Guile und Chun Li nutzen jetzt ihre neuen Downloads-Signature-Tracks: `Dojo Crash Duel`, `Steel Punch Parade`, `Jet Fuel Glory` und `Bamboo Arcade`, plus `Gasket Thunder` als Street-Fighter-Rush-Layer.
- Eigene lokale SFX-Profile pro spielbarem Charakter fuer Slash, Dash, Treffer, Power-ups, Warnungen und Boss-Downs.
- Charakterauswahl nutzt einen normalisierten Auswahl-Atlas aus dem ersten statischen HD-Char-Sheet.
- Neues Imagen-HD-Walkcycle-Frameset mit 8 Frames fuer jeden alternativen Spieler-Skin.
- Erkundbare Huetten, Wracks, Schatzstellen und Muschelschreine droppen XP, Muenzen, kurze Rettungsfenster und kleine Notfall-Heilung.
- Massive Strandhindernisse aus Hecken, Huetten, Wracks und Schreinen blockieren Spieler und Bodengegner; Geister und fliegende Gegner koennen sie durchqueren.
- Runtime-Sprite-Sheets laufen ueber kompakte WebP-Varianten fuer schnelleren Mobile-Start.
- Neues Imagen-HD-WebP-Projektilsheet fuer Saebelbogen, Kokos-Bumerang, Flaschenbombe, Kompassblitz, Taukreis, Blutrosenburst, Geisterkugel und Affenfluch.
- Extra Imagen-HD-FX-Sheet fuer Tau-Aura, Kompass-Beam, Rum-Schockwelle, Curse-Burst, Cutlass-Afterglow und Schatz-Glints.
- Neues Imagen-HD-Weapon-Evolution-FX-Sheet mit Doppel-/Drei-/Vier-/Fuenffach-Saebeln, graduellen Aura-Ringen und Saebel-Tornado-Fusion.
- Neues Imagen-HD-Fusion-Relikt-Sheet mit je vier Animationsframes fuer Sturm-Muschel, Blutmond-Anker, Kraken-Kompass und Rumkometen-Laterne.
- Neue Item- und Flow-Schicht: Saebelfieber, Tide-Vakuum, Mond-Aegis, Fusionsfunke, Rubin-Ring, Mond-Siegel, Gothic-Axt und Blaues Elixier.
- Neue Fusion-Relikt-Upgrades verstaerken konkrete Build-Pfade: Sternenkokos, Saebelsturm, Mondnetz und Grog-Mahlstrom bekommen sichtbare Relikt-Boni.
- Mehr Fusionstypen fuer Achievement-Flow: Saebelsturm, Sternenkokos, Grog-Mahlstrom und Mondnetz schalten Meta-Relikte frei.
- Zwei neue Imagen-HD-Sheets fuer acht zusaetzliche Gegner und acht neue Relikt-/Item-Icons.
- Neue Gegner im Spawn-Mix: Reef Raider, Powder Imp, Tide Witch, Saltbone Fencer, Lantern Wraith, Barrel Maw, Storm Duelist und Coral Brute als Bosskandidat.
- Neue Relikt-Upgrades wie Flutperle, Schwarzpulverbeutel, Affenpfote, Kaeptninsiegel, Flutstiefel, Voodoo-Puppe, Obsidian-Kompass und Grog-Laterne.
- Neuer Imagen-HD-Pergament-UI-Atlas fuer Startmenue, HUD, Skin-Auswahl, Buttons und Upgrade-Karten.
- Extra Imagen-HD-Sprites fuer Krabben, Affenidol, Banane, Rum-Bombe, Wasserhand und Charms.
- Gothic-Vampire-Hunter-Crossover mit Fledermaus, Knochenkorsar, Mond-Gargoyle und Blutrosen-Relikt; die alten Kerzenprops spawnen nicht mehr.
- Imagen-HD-Frameset fuer einen LeChuck-artigen Fluchkapitaen als neuen Boss.
- Neues 12-Frame-Imagen-HD-Frameset fuer einen point-and-click-artigen Zeit-Tentakel; Riff-Squid und Kaktus-Stack bleiben im zusaetzlichen Gegner-Sheet.
- Neue freigestellte Palmenprops und kleinere offene Schatzkisten im Verhaeltnis zum Spieler.
- Lokale BGM- und SFX-Dateien ohne externe Runtime-Abhaengigkeiten.
- Spielstart wird erst freigegeben, wenn die lokalen BGM-Tracks wirklich vorgeladen und abspielbereit sind.
- BGM wird im Menue vorgeprimed und der Startklick haelt den stumm vorgearmten Track am Leben, damit der Run ohne spaete Musik-Luecke loslegt.
- Alle Runtime-SFX stammen aus den lokalen Downloads und sind leise unter die Musik gemischt.
- Treibenderer lokaler BGM-Mix aus `Crimson Galleon` als Main-Track und `Gargoyle Chapel Run` als frueher Rush-Layer; SFX bleiben leise darunter.
- BGM laeuft jetzt als ein eindeutiger aktiver Track mit Rush-Handoff statt zwei ueberlappender MP3-Spuren.
- Jede Karte nutzt ein eigenes leichtes HD-Background-Asset und ein eigenes lokales BGM-Profil.
- Strand-Backgrounds sind pfuetzenfrei; sichtbare Wasserstellen kommen als separate HD-Raster-Decals und Chunk-Props.
- Sam-und-Max/Freelance-Duo nutzt ein eigenes sauber gecropptes HD-Duo-Sprite statt der zu engen Walkcycle-Zelle.
- Sam-und-Max/Freelance-Duo hat wieder ein eigenes sauberes Imagen-HD-8-Frame-Walksheet ohne oben abgeschnittene Huete/Ohren.
- Welt laeuft jetzt als grosse repeatable Chunk-Map ohne spuerbare Strandkante; Props, Wracks, Hecken und Pfuetzen werden um den Spieler nachgeladen.
- Neue Welt-Props und Streak-Schaetze materialisieren nur ausserhalb des aktuellen Sichtfelds und blenden am Rand weich ein, damit keine Assets mitten im Bild aufploppen.
- Mobile rendert mit DPR 1, kleinerem Gegner-/FX-Cap, reduzierten Schatten und weiter herausgezogener Kamera; Start versucht auf Mobile direkt Hochkant/Vollbild.
- Mobile nutzt einen Fast-Boot: vor `Ready` laden nur Kernbilder, gewaehlte Figur/Karte und genau das aktuelle BGM-Paar; Boss-, Crossover-, Extra-Skin- und seltene FX-Assets kommen danach lazy.
- Mobile-Start erkennt die aktuelle Handyhaltung: quer gehalten wird Landscape-Fullscreen gelockt, sonst bleibt Portrait-Fullscreen der Default.
- Das Live-Spawn-Roster nutzt jetzt nur noch Kreaturen, Untote und Monster; menschliche NPC-Gegner sind aus normalen Wellen und Bosszyklen entfernt.
- Die ersten Gegner laufen jetzt ueber eine Anti-Repeat-Rotation mit Krabben, Fledermaeusen, Pulver-Imps und Riff-Squids, statt immer denselben Auftakt zu zeigen.
- Spaetere Runs trimmen entfernte Normalgegner und zeichnen nur noch ein priorisiertes Sprite-Budget, damit volle Screens nicht sofort laggy werden.
- BGM-Rotation nutzt jetzt treibendere lokale Download-Tracks wie Turbo Banana Cup, Tidebarrel Dockside, Treasure Tide Route, Voodoo Hut Shuffle und Black Chapel Gate.
- Fluchaffe hat jetzt ein eigenes aggressiveres Frenzy-BGM aus lokalen Downloads, fruehen Rush-Handoff und ein eigenes lokales SFX-Pack fuer Swipe, Dash, Curse-Hit, Pickup, Power-up, Warnung und Boss-Down.
- Alle live genutzten alten Single-Frame-Gegner (Krabbe, Seehand, Powder Imp, Lantern Wraith, Barrel Maw, Coral Brute, Monkey Idol) nutzen jetzt ein Imagen-HD-Multiframe-Sheet mit acht Frames pro Typ.
- Krabben- und Seehand-Frames nutzen eine nachgereinigte Alpha-/Green-Matte-Variante gegen gruene Randsaeume.
- Die Enemy- und Gothic-Animationssheets laufen durch einen Slice-Repair-Export mit Zell-Padding und Komponenten-Pruning, damit Frames nicht mehr mit Rand- oder Nachbarartefakten gecroppt werden.
- Knochenkorsar und Mond-Gargoyle nutzen ein neues Imagen-HD-Gothic-Animationssheet mit acht Frames statt statischer Einzelbilder.
- Gegner sind groesser lesbar, haben groessere Hitboxen, mehr Spawn-Druck und ab der dritten Flutwelle zwei Elite-Omen-Ziele.
- Bewegung reagiert direkter mit hoeherem Grundtempo, kuerzerem Dash-Cooldown, laengerem Boost-Fenster, schnellerer Kamera und sensiblerer Mobile-Stick-Kurve.
- Arcade-Movement-Pass: deutlich hoeheres Lauftempo, sehr kurzer Dash-Cooldown, schnellerer Dash-Burst, frueher voller Mobile-Stick und korrigierte Dash-Cooldown-Caps bei Traits/Upgrades.
- Desktop ist nochmals weiter herausgezoomt; Flutwellen markieren jetzt Elite-Omen-Gegner mit Extra-Beute, damit Wellen ein klares Zwischenziel haben.
- Dhampir/Alucard nutzt ein nachnormalisiertes Walksheet mit stabiler Frame-Hoehe und entfernten Fuss-/Slice-Artefakten.
- Rum-Korsar nutzt ein nachgereinigtes Walksheet ohne fremde abgeschnittene Zellreste unter den Lauf-Frames; das HUD benennt immer den wirklich gewaehlten Charakter.
- Fluchaffe nutzt jetzt einen bereinigten statischen Skin-Atlas und einen bereinigten Auswahl-Atlas ohne fremde Saebelreste; der Crop hat echtes Padding statt angeschnittener Atlasraender.
- Jeder Charakter hat nun ein kleines Gameplay-Trait, z.B. Fluchsog, Mondbiss, Rumspurt, Sternenkompass oder Doppelermittlung.
- Treffer-, Crit-, Streak- und Pickup-Texte werden als lesbare Screen-Schrift skaliert statt in der herausgezoomten Welt winzig zu werden.
- HD-Pfuetzen sind wieder sichtbar und geben beim Durchlaufen einen kleinen Gezeiten-Slip statt nur Deko zu sein.
- Erkunderte Buesche, Huetten und Wracks bleiben voll gemalt statt ausgegraut; Schatzfunde wechseln auf ein eigenes offenes Imagen-HD-Truhenasset.
- Dreikoepfiger Affe ist als eigener Imagen-HD-Boss im Boss-Zyklus und feuert eine dreifache Fluchsalve.
- Zeit-Tentakel ist jetzt auch Bosskandidat mit eigenem 12-Frame-HD-Sheet und dreifacher Fluchkugel-Salve.
- Blackbeard ist als eigener Imagen-HD-Boss im Boss-Zyklus und feuert eine dreifache Geisterkanonen-Breitseite.
- Dreikoepfiger Affe und Blackbeard nutzen eigene neue Imagen-HD-8-Frame-Animationssheets statt statischer Einzelbilder.
- Map-spezifische Busch-/Hecken-Hindernisse nutzen die HD-Prop-Assets und bleiben Teil der Kollisionslogik.
- Upgrade-Auswahl pausiert den Run nur noch in groesseren Abstaenden; Zwischenlevel geben nicht-blockierende Flow-Boni.
- Upgrade-Karten, Loadout-Pips und Tau-Aura bauen sich sichtbarer in Stufen auf, damit Item-Leveln laenger motiviert statt sofort gemaxed auszusehen.
- Vier Kartenvarianten mit Map-Auswahl, gespeicherten Achievements, freischaltbaren Karten und kleinen Startrelikten.
- Temporäre Power-up-Drops wie Grog-Tempo, Pulverfieber, Flutmagnet und Voodoo-Schutz sorgen fuer Zwischenziele im Run.
- Power-up-Pickups haben kleineren Text, weniger Magnet-Sog und deutlich leisere Sounds, damit der Run nicht staendig stolpert.
- Deutsche Browser-Sprachausgabe fuer Start, Level-ups, Bosswarnungen, niedrige HP und Endscreen.
- Ruhigere SFX, Tastatur, dynamischer Vollbild-Mobile-Joystick, Dash, Pause, Vollbild und Audio-Schalter.
- Upgrade-Karten lassen sich auf Desktop per Pfeilen/WASD, 1-3 und Enter/Space waehlen, ohne den Mausgriff im Spielfluss.
- Kill-Streaks geben XP-Sog und spawnen Streak-Schaetze, damit aggressive Routen mehr Belohnung und kleine Ziele bekommen.
- Kamera zoomt auf Desktop und Mobile nochmals weiter raus; Portrait- und Querformat-HUD bleiben minimal.
- Fluchaffe/Player-Sheets, Strandhuetten und Buesche behalten jetzt eine stabile Groesse; nur Positions-Bob/Animation bleibt erhalten.
- Fluchaffe nutzt ein nachnormalisiertes Walksheet ohne untere Slice-Artefakte und ohne Idle-Bob, damit er nicht mehr optisch pulsiert.
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
