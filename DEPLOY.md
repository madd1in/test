# Moonwalker Nocturne - Web Deployment

## Netlify
Live URL: `https://moonwalker-nocturne.netlify.app`

1. Den Ordner `castlevania_from_scratch` oder ein Zip davon hochladen.
2. Kein Build-Step noetig.
3. Publish directory: Projektwurzel mit `index.html`.
4. Danach die `*.netlify.app` URL testen.

## itch.io
1. Neues HTML-Projekt anlegen.
2. Vollstaendigen Spielordner als Zip hochladen.
3. "This file will be played in the browser" aktivieren.
4. Viewport etwa `1280 x 720`, Mobile friendly aktivieren.

## Hinweise
- Die volle Version enthaelt MP3-BGM und ist groesser als die Lite-Version.
- Wenn ein Host Dateigroessen begrenzt, koennen MP3s extern gehostet und die Pfade in `game.js` angepasst werden.
