# Star Spring 64

Originaler 3D-Platformer fuer den Browser mit lokal generierten Textur- und Audio-Assets.
Die aktuelle BGM nutzt `assets/audio/downloads-bgm.mp3`, kopiert aus `C:\Users\User\Downloads\Sky Garden Relay.mp3`.

## Gameplay

- Triple-Jump: Bodenjump plus zwei Air-Jumps, mit staerkerem dritten Sprung.
- Sky Rings: geben Vorwaerts-Boost und frischen Air-Jumps auf.
- Wind Lifts: tragen dich nach oben und retten schnelle Routen zwischen Inseln.

## Performance

Normaler Spielbetrieb nutzt reduzierte Renderkosten: gekappte Pixelratio, keine teuren Capture-Buffer und reduzierte dynamische Lichter auf Mobile.
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
