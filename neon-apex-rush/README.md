# Neon Apex Rush

Neues statisches Browser-Arcade-Racing-Game mit lokalen HD-Grafikassets, lokalem Synthwave-BGM und lokalen SFX.

## Start

```powershell
node tools\serve.js
```

Dann im Browser öffnen:

```text
http://127.0.0.1:4187/
```

## Controls

- Arrow keys or WASD steer, accelerate, brake
- Space boosts
- P or Escape pauses
- M toggles sound

## Assets

- `assets/images/key-art.png` wurde mit dem Bildgenerator erstellt und lokal ins Projekt kopiert.
- Die Fahrzeug-, Pickup-, Hazard- und Skyline-Grafiken liegen als lokale SVG-HD-Assets unter `assets/images/`.
- `assets/audio/*.wav` werden lokal aus `tools/generate-audio.js` erzeugt.

## Checks

```powershell
node tools\generate-audio.js
node tools\smoke-test.js
```
