# Star Spring 64

Originaler 3D-Platformer fuer den Browser mit lokal generierten Textur- und Audio-Assets.
Die aktuelle BGM nutzt `assets/audio/downloads-bgm.mp3`, kopiert aus `C:\Users\User\Downloads\Sky Garden Relay.mp3`.

## Gameplay

- Triple-Jump: Bodenjump plus zwei Air-Jumps, mit staerkerem dritten Sprung.
- Glide-Assist: Jump halten bremst den Fall und gibt mehr Kontrolle in der Luft.
- Sky Rings: geben Vorwaerts-Boost und frischen Air-Jumps auf.
- Dash-Pads: Bodenpfeile schleudern dich in neue Routen und geben Air-Jumps zurueck.
- Wind Lifts: tragen dich nach oben und retten schnelle Routen zwischen Inseln.
- Zielpfeil: ein schwebender In-World-Marker zeigt zum naechsten Stern oder zum offenen Tor.
- Checkpoint-Beacon: jede gelandete Insel speichert jetzt sauber den Ruecksetzpunkt, auch wenn die Route seitlich oder ueber Moving-Islands laeuft.
- Vollbild-Toggle: Button oben rechts oder Taste `F`.
- Neue Zonen: Pipe Garden, Lantern Walk, Crusher Causeway, Rocket Run, Aurora Crossing und Stargate Terrace erweitern den Kurs auf 41 Plattform-Inseln.
- Neue originale Gegner-Archetypen: Bouncer, Snap Flowers aus Roehren, Spark Spinners, Stone Crushers und Rocket Orbs mit verbesserten Augen, Glanzlichtern, Spots, Fins und Silhouetten.
- Mehr Variety: Sky-Ribbons, Laternen, Dash-Pad-Lines, Rescue-Cloud-Lanes, Catch-Clouds, extra Sternrouten und sichere Zwischeninseln machen den Kurs lesbarer.
- Der Held hat jetzt mehr Character-Details: Haare, Ohren, Nase, Smile, Stern-Badge, Cap-Gem, Cape, Handschuhe, Guertel, Schal, Glanzlichter und Glide-Fluegel.
- Assist ist standardmaessig an: Ziel sind 10 Sterne, Plattformen sind grosszuegiger, Muenzen ziehen staerker an, eine Muenze kann einen Treffer abfangen, und Abstuerze springen direkt zum letzten Checkpoint zurueck.

## Performance

Normaler Spielbetrieb nutzt reduzierte Renderkosten: stark gekappte Mobile-Pixelratio, keine teuren Capture-Buffer, Shadowmaps nur in `?quality=high`, reduzierte dynamische Lichter, weniger Partikel und adaptives `Smooth Mode`-Downscaling.
Der Browser-Smoke-Test startet mit `?capture=1`, damit Canvas-Pixel pruefbar bleiben.

## Start

```powershell
node tools\serve.cjs
```

Dann im Browser oeffnen:

```text
http://127.0.0.1:4194
```

## Assets neu generieren

```powershell
node tools\build-assets.cjs
```

Das erzeugt die SVG-Texturen in `assets/textures/` und die WAV-SFX/BGM in `assets/audio/`.
Die Download-BGM bleibt als separate MP3-Datei erhalten.

## Checks

```powershell
node tools\smoke-test.cjs
node tools\browser-smoke.cjs
```

Der Browser-Smoke-Test erstellt Desktop- und Mobile-Screenshots und prueft WebGL, Canvas-Pixel, Startflow und die Touch-Joysticks.
