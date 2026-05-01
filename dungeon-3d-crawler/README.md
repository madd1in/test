# Kryptenlaeufer 3D

Ein statischer Three.js Dungeon Crawler fuer GitHub Pages mit drei Ebenen, Runen,
skalierenden Gegnern, Bosskaempfen, NPC-Orakeln, Relikten, Altaren,
Geheimwaenden, Fokuszauber, Zielpfeil und finalem Endportal.

## Spielen

- `WASD` oder Pfeiltasten bewegen.
- `Q/E` oder Pfeiltasten links/rechts drehen.
- `Leertaste` oder `Enter` greift das Feld vor dir an.
- `Z` oder `Shift` loest einen Fokuszauber gegen nahe sichtbare Gegner aus.
- `F` interagiert mit Runen, Truhen, Tor und Ausgang.
- Rissige Waende koennen mit Angriffen aufgebrochen werden.
- Truhen enthalten Heilung, Angriffskraft, Fokus und manchmal Relikte.
- Altare geben pro Ebene einmalige Boons.
- Das Orakel und der gruene Zielpfeil zeigen immer den naechsten Pflichtschritt.
- Pro Ebene oeffnen drei Runen das Siegel vor dem Boss.
- Nach dem Portal steigt der Held tiefer hinab, heilt etwas und wird staerker.
- Nach Ebene 3 endet der Run mit dem Ur-Glockenfuerst.

Jede Ebene besitzt ein eigenes Licht-/Nebel-Theme, animierte Partikel,
leuchtende Runen, Portaleffekte, Dungeon-Props, Wand-Decals, neue
SVG-Gegner/NPC-Sprites und haengende Reliktlichter.

## Verwendete Download-Assets

- Gothic-Props und Gegner aus `castlevania_from_scratch`
- Boss-Sprite-Sheet aus den generierten Castlevania-Assets
- Neue lokale SVG-Assets: Orakel-NPC, Blutakolyth, Runensentinel,
  Laternenrufer, Wandrune und Knochenwand-Decal
- Musik: `Moonveil Keep.mp3`, `Catacomb Bell Vault.mp3`
- SFX: Whip Slash, Bones, Armor, Thunderstorm

Die Stein- und Bodentexturen werden zur Laufzeit als Canvas-Texturen erzeugt, damit die 3D-Waende nahtlos bleiben.
