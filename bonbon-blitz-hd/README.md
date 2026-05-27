# Bonbon Blitz HD

Ein eigenstaendiges Match-3-Browsergame mit neu erstellten HD-SVG-Assets.

## Features

- 8x8 Match-3-Board mit legalen Swaps, Kaskaden und automatischem Refill
- Levelziele, begrenzte Zuege, Highscore im Browser
- Spezial-Bonbons fuer Reihen, Spalten, Bomben und Prisma-Ketten
- Zuckerhammer- und Shuffle-Booster
- Responsive Canvas-Spielfeld mit DOM-HUD
- Offline lauffaehig: `index.html` direkt im Browser oeffnen

## Starten

Direkt oeffnen:

```text
C:\Users\User\Documents\Playground\bonbon-blitz-hd\index.html
```

Oder lokal serven:

```bash
node tools/static-server.js
```

Dann im Browser `http://127.0.0.1:4173` oeffnen.

## Dateien

- `index.html` - Spieloberflaeche
- `style.css` - responsive UI und Candy-Garden-Theme
- `game.js` - Simulation, Rendering, Input und Levelsystem
- `assets/` - neu gezeichnete HD-Vektorassets und generierte PNG-Asset-Sheet
- `tools/static-server.js` - kleiner lokaler Server ohne externe Pakete
