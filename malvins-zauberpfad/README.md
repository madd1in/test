# Malvins Zauberpfad

Ein kleines, offline spielbares Point-and-Click-Adventure mit Original-Sorcerer-Sprites, einer Runtime-Sprite-Map und KI-generierten Adventure-Hintergruenden.

## Start

Oeffne `index.html` in einem Browser.

## Spielziel

Finde den Runenstein im Pilzhain, besorge das Mondabzeichen im Observatorium und aktiviere damit das Turmsiegel in der Bibliothek.

## Steuerung

- Klicke in die Szene, um zu laufen oder Objekte mit dem aktiven Verb zu benutzen.
- Waehle unten ein Verb: Gehen, Ansehen, Reden, Nehmen oder Benutzen.
- Klicke einen Inventargegenstand an, um ihn mit `Benutzen` auszuwaehlen.
- `1` bis `5` waehlen die Verben per Tastatur.
- `Hotspots` zeigt anklickbare Bereiche, Exit-Ziele und Objektmarker direkt in der Szene; `H` schaltet die Anzeige ebenfalls um.
- `Pfad` zeigt in der Waldlichtung, was begehbar ist. Gruen bedeutet erreichbar, rot bedeutet blockiert; `P` schaltet die Anzeige ebenfalls um.
- `Tagebuch` zeigt Fortschritt, naechstes Ziel und gefundene Sternsplitter; `J` schaltet es um.
- `Karte` erlaubt Schnellreise zu bereits besuchten Orten; `M` schaltet sie um.
- `Vollbild` streckt die Spielflaeche optimal auf den Bildschirm; `F` schaltet ebenfalls um.
- `Speichern` und `Laden` sichern den Spielstand im Browser. `Strg+S` speichert, `Strg+L` laedt.
- Auf Touch-Geraeten erscheinen Steuerkreis, Verbwechsel, Aktionstaste und ein eigener Vollbildknopf.
- Im Pilzhain ist der Mondteich gesperrte Wasserflaeche; Malvin laeuft nur am Ufer entlang.
- `Esc` schliesst Dialoge und wechselt zurueck zu Gehen.
- `Vorlesen` schaltet die browserbasierte Sprachausgabe fuer Dialoge ein oder aus.
- Malvin nutzt ein neues KI-generiertes Sprite-Set mit mehr Idle-, Lauf-, Zauber- und Emote-Frames.
- NPCs besitzen jetzt eigene Imagen-Sprite-Maps mit 10 Idle- und 10 Talk-Frames; beim Dialog wechseln sie sichtbar in die Sprech-Animation.
- `Musik` schaltet die szenenbasierte MP3-Hintergrundmusik ein oder aus.
- `SFX` schaltet kurze Effekt-Toene fuer Klicks, Items, Szenenwechsel, Fehler und Zauber ein oder aus.

Die Sprachausgabe nutzt die Web-Speech-API des Browsers. Dialoge werden satzweise mit kurzen Pausen gesprochen, Rollen bekommen eigene Sprechprofile und eigene Voice-Slots, sofern der Browser mehrere deutsche Stimmen anbietet.
Die Hintergrundmusik startet browserbedingt erst nach der ersten Nutzeraktion. Sie ist bewusst etwas staerker gemischt als Stimme und SFX; falls ein Browser MP3 nicht abspielen kann, nutzt das Spiel die alte prozedurale Web-Audio-Musik als Fallback.
Die Szenen nutzen jetzt mehrere Tracks aus `assets/audio`: `Clockwork Farewell`, `Clockwork Farewell II`, `Heraldic Teacups`, `Marzipan Compass` und `Marzipan Compass II`.
In der Waldlichtung skaliert Malvins Sprite mit der Tiefe. Vordergrundobjekte wie Baumstumpf und Wegweiser decken ihn ab, wenn er dahinter entlanggeht.
In jeder Szene ist ein optionaler Sternsplitter versteckt. Wer alle acht findet, bekommt einen kleinen Bonusabschluss im Tagebuch.

## Assets

- `assets/backgrounds`: acht KI-generierte Adventure-Hintergruende plus zwei Atlasbilder
- `assets/backgrounds/pixel-originals`: Sicherung der ersten prozeduralen Pixel-Hintergruende
- `assets/audio`: MP3-Musikbibliothek fuer die szenenbasierte Hintergrundmusik
- `assets/sprite-map.png`: veredelte Runtime-Sprite-Map fuer Charakter, Effekte, Items, Cursors, Hotspot-Marker, Portraits, NPC-Sprites, NPC-Portraits und Props
- `assets/sprite-map.js` und `assets/sprite-map.json`: Koordinaten zum Ausschneiden der Sprites
- `assets/sprites`: die urspruenglichen Einzelsheets und die neue generierte Malvin-Quelle bleiben als Arbeitsmaterial erhalten

NPC-Dialoge nutzen eigene Portraits und leicht unterschiedliche Web-Speech-Stimmprofile. Die Figur, NPCs und Hintergruende sind eigene Originalassets im klassischen Adventure-Stil, nicht offizielles Simon-the-Sorcerer-Material.
