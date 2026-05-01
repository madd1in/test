# Kryptenlaeufer 3D

Ein statischer Three.js Dungeon Crawler fuer GitHub Pages mit drei Ebenen, Runen,
skalierenden Gegnern, Bosskaempfen und finalem Endportal.

## Spielen

- `WASD` oder Pfeiltasten bewegen.
- `Q/E` oder Pfeiltasten links/rechts drehen.
- `Leertaste` oder `Enter` greift das Feld vor dir an.
- `F` interagiert mit Runen, Truhen, Tor und Ausgang.
- Pro Ebene oeffnen drei Runen das Siegel vor dem Boss.
- Nach dem Portal steigt der Held tiefer hinab, heilt etwas und wird staerker.
- Nach Ebene 3 endet der Run mit dem Ur-Glockenfuerst.

## Verwendete Download-Assets

- Gothic-Props und Gegner aus `castlevania_from_scratch`
- Boss-Sprite-Sheet aus den generierten Castlevania-Assets
- Musik: `Moonveil Keep.mp3`, `Catacomb Bell Vault.mp3`
- SFX: Whip Slash, Bones, Armor, Thunderstorm

Die Stein- und Bodentexturen werden zur Laufzeit als Canvas-Texturen erzeugt, damit die 3D-Waende nahtlos bleiben.
