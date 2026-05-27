# Overcrest Rally 3D

Ein neues 3D-Rally-Time-Trial fuer den Browser: drei offene Stages, Chase-Camera, Drift/Handbrake-Physik, Sprungkuppen mit Air-Time, Surface-Zonen, Pace Notes, Split-Gates, Schaden, Wettereffekte, Minimap, Touch-Steuerung, lokale BGM/SFX und Imagen-Bitmap-Assets.

## Start

```powershell
npm.cmd run serve
```

Dann `http://127.0.0.1:4193` oeffnen.

## Steuerung

- Gas: `W` oder `ArrowUp`
- Bremse/Rueckwaerts: `S` oder `ArrowDown`
- Lenken: `A` / `D` oder Pfeiltasten
- Handbremse: `Space` oder `Shift`
- Pause: `P` oder `Escape`
- Restart: `R`

Touch-Controls erscheinen auf kleinen Viewports.

## Audio

Die BGM- und SFX-Dateien liegen lokal unter `assets/audio` und werden ohne Netzwerk-CDN geladen.

## Asset-Polish

`assets/imagen/overcrest-rally-imagen-atlas.png` ist ein generiertes Bitmap-Atlas-Sheet fuer Title-Art, Car-Decals, Chevrons, Surface-Decals und Trackside-Boards.

## Checks

```powershell
npm.cmd run check
```
