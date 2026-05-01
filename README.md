# Moonwalker Nocturne From Scratch

Eigenes Gothic-Action-Spiel in HTML/CSS/JS, fusioniert mit Moonwalker-artigen Dance- und Ausweich-Moves.

## Starten
1. `index.html` im Browser oeffnen.
2. `Enter` druecken (New Run) oder `C` (Continue, wenn Save vorhanden).

## Steuerung
- `Arrow Left/Right` oder `A/D`: Laufen
- `Space` oder `ArrowUp`: Springen
- Double Jump in der Luft (ein extra Sprung)
- Treppen: `ArrowUp/ArrowDown` zum Ein-/Absteigen
- `J`: Whip-Angriff (auch auf Treppen)
- `K`: Subweapon (auch auf Treppen, kostet Hearts)
- `L`: Dash (kurzer Burst, mit Cooldown)
- `Z`: Moonwalk (Rueckwaerts-Slide mit kurzem Ausweichfenster, baut Groove auf)
- `X`: Dance Burst (radialer Angriff, kostet Groove oder 2 Hearts)
- `U`: Chrono Burst (bei 100% Special-Charge)
- `M`: Naechster Stage-/Boss-Track
- `T`: Testmodus an/aus (unendlich HP + unendlich Hearts/Ammo)
- `Enter`: Start / Weiter nach Stage-Intermission
- `C`: Continue (Title/Game Over)

## Features
- V55 Solid Spatial Index: Player-, Projectile-, Pickup- und Draw-Kollisionen fragen nur noch nahe Solid-Buckets ab statt jede Plattform zu scannen.
- V54 Viewport-Culling: Boden-/Plattform-Tiles und Trim-Ziselierung zeichnen nur noch sichtbare Weltbereiche; Stage-BGM und Bild-Decoding werden frueher vorgewaermt.
- V53 Performance/Stability: Initial-Preload ist gestaffelt, Auto-Quality schaltet mit Hysterese, und lange Garten-Tilemaps rendern nur noch den sichtbaren Ausschnitt.
- V52 Bush/Fence Tilemap: Hecken, Rosenbuesche, Eisenzaun und Garten-Gitter nutzen jetzt transparente Imagegen-Tiles statt Canvas-Rechtecken.
- V51 Tile-Stabilitaet: Scrollende Boden-/Wall-/Super7-Tiles sind an Weltkoordinaten verankert, damit Kacheln beim Scrollen nicht mehr flackern.
- V50 Performance/Fog: Auto-Modus reduziert Super7-Bodenbaender, schaltet Canvas-Filter im Boost ab und rastet Nebel/Glints pixelstabil ein.
- 6 Stages (Stage 2-6 mit eigenen Bossen)
- Save/Continue + Best Score (LocalStorage)
- Verdreifachte Lebensleiste (48 HP Basis)
- Deutlich leichteres Balancing (weniger eingehender Schaden, langsamere Gegner/Projektile)
- Geschmeidigeres Movement (Acceleration/Deceleration, Coyote/Buffer)
- Subweapon-Swap via Candle-Drops: `Dagger`, `Axe`, `Holy Water`, `Cross`
- Neue Gegner: Medusa Heads und Bone Pillars
- Neue Gegnertypen: Knight, Phantom, Gargoyle und Reaper
- Elite-Varianten fuer Standardgegner (mehr HP/Tempo, extra Reward)
- Stage-4 Moon-Gate Mini-Boss-Encounter (Knight + Phantom Welle) vor Boss4
- Neues Relic-Idea: seltenes Candle-Relic als Screen-Nuke
- Combo-Chain mit Bonuspunkten bei schnellen Kills
- Dash-Impact: Dash kann Gegner direkt treffen
- Dash pariert jetzt auch feindliche Projektile
- Seltene Food-Drops aus Candles heilen HP
- Neues Guard-System (Shield-Ladungen absorbieren Treffer)
- Neues Ultimate-System: Chrono Burst (verlangsamt Kampfgeschehen)
- Auto-Regen ausserhalb von Treffern
- Stabilerer Treppen-Flow (weniger Sticky/Haengen beim Ein-/Aussteigen)
- Trefferfeedback mit Screen-Shake
- CRT-Look, Layered Background/Fog/Glow + Wettereffekte
- Mehr AtmosphÃ¤re: Fireflies/Embers + Pad-Layer in der BGM
- Erweiterte BGM mit Percussion + Combo-Energy
- Neue Stage-Zonen: Wind, Lava, Bless, Moon, Haste, Low-Gravity
- Stage 4-6 mit deutlich unterschiedlichen HintergrÃ¼nden und Wetter
- Eigene BGM-Themes pro Stage (inkl. Stage 5/6)
- Boss-BGM mit zusaetzlichen Leitmotiven und haerterem Rhythmus im Kampf
- Erweiterter CRT-Look mit staerkerem Retro-Filter
- Stage-Architektur erweitert: neue Blockstile (gothic, crypt, flesh) fuer mehr visuelle Abwechslung
- Mini-Map mit Spieler/Boss-Track + Stage-Preview pro Abschnitt
- Boss-Phasen: Phase 2 ab 50% Boss-HP mit aggressiveren Patterns
- Boss-Rework: jeder Boss hat jetzt eigene Archetypen, Attack-Patterns und Projektiltypen
- Boss- und Enemy-Design aufgewertet: mehr Formen, Effekte und klarere Silhouetten
- Moonwalker-Fusion: Moonwalk-Evasion, Groove-Meter, Dance Burst, Projektil-Clear und 100%-Groove-Finale
- Asset-Rework: Player, Gegner und Bosse verwenden eigene Figuren-Sprites statt der Item-Sheets
- Gothic-Tiles aus `tileset_gothic.png` wurden in `assets/generated/` zerlegt und fuer Plattformen, Vordergrund und Parallax-Props verbaut
- Stage-Musik bleibt jetzt Stage-Musik und wechselt erst in Boss-Naehe auf Boss-Theme
- Neue Stage-Panoramen (`bg_stage*_far/mid.png`) ersetzen den zusammengesetzten Tilesheet-Hintergrund
- Gegner und Bosse verwenden jetzt Sprite-Sheets (`enemy_sheet.png`, `boss_sheet.png`) mit animierten Frames
- Mehr MP3-Varianten pro Stage/Boss, inkl. manuellem Track-Wechsel mit `M`
- Stage 1 ist jetzt ein mehrstoeckiger Schlossfluegel mit Galerien, Treppenverbindungen und Boss-Anlauf ueber mehrere Ebenen
- Nahtlose SNES-artige Floor-/Stair-Tiles (`tile_floor_snes_*`, `tile_stair_snes_*`) ersetzen die blockigeren Plattform-Kacheln
- Background ist weiter entrümpelt: weniger Wetter/Props, weniger Midground-Dichte, stattdessen dezentes 16-bit Tilepattern
- Player rendert aus einer echten 16-bit Sprite-Sheet-Map (`player_sheet_16bit.png`) per Frame-Index
- Image-tool Tileset-Pass: `ai_tileset_16bit.png` wurde als 8x6-Tilemap erzeugt und in `ai_tile_00.png` ... `ai_tile_47.png` geschnitten

## V11 Optimierungen (neu)
- Performance: Gradient-Caching (Background, Floor, Halo, Vignette) statt Neuberechnung pro Frame
- Audio: Master-Gain + Lowpass-Filter, Audio-Duck bei Spielertreffern, Lowpass-Sweep bei Chrono Burst
- Visuell: Hit-Flash auf Gegnern, Dash-Speedlines, Lande-Staub, Low-HP Vignetten-Tint
- Combat: Whip-Parry deflektiert Projektile (+80 Score), Perfect-Dodge Combo-Bonus beim Dash durch Schuesse
- Assets: Echte BGM-Tracks pro Stage (mp3) + Boss-Theme, Hintergrund-Bilder fuer Stage 1 + 5

## Asset-Layout
- `assets/bgm/stage1_courtyard.mp3` ... `stage6_citadel.mp3` (Stage-BGM)
- `assets/bgm/boss_masquerade.mp3` (Boss-Theme, automatisch beim Boss-Encounter)
- `assets/art/bg_courtyard.png`, `bg_chapel.png` (Hintergrund-Layer)
- `assets/art/sprites_actors.png`, `sprites_enemies.png`, `sprites_items.png`, `tileset_gothic.png` (Original-Sheets)
- `assets/sprites2/sprites_actors/*.png` und `sprites2/sprites_enemies/*.png` (auto-geslicte Einzelframes, mit Alpha)
- `assets/slice.py` (PIL-Skript, das die Sheets zerschneidet)

## Sprite-Integration (V12)
- Player rendert mit echten Sprite-Frames: idle/walk1/walk2/jump/whip/hurt/stair, plus Spiegelung anhand `facing`
- Walk-Cycle: alternierend zwei Frames alle 140ms
- Dash hat jetzt zusaetzlich einen lighter-Tint-Glow ueber dem Sprite
- Enemy-Sprites fuer skeleton, bat, knight, imp (wolf), phantom/medusa/witch/gargoyle (medusa head), reaper - werden als Overlay ueber den prozeduralen Rechtecken gezeichnet, behalten Hit-Flash
- Bosse nutzen eigene Sprite-Sheet-Frames plus Phase-2-Indikator

## Sprite-Integration (V13)
- Gegner/Bosse rendern bevorzugt aus `assets/generated/enemy_sheet.png` und `boss_sheet.png`
- Die alten Einzelframes bleiben als Fallback erhalten, falls ein Sheet noch laedt
- Hintergrund besteht aus echten Stage-Panoramen mit langsamer Far- und Midground-Parallax
- Musiklisten rotieren pro Stage und Boss; `M` springt sofort zur naechsten Variante

## Castle-Layout (V14)
- Erste Metroidvania-Grundlage: Stage 1 hat Ground, Mid-Gallery und Upper-Gallery statt nur einer langen Bodenlinie
- Treppen sind als eigene Tile-Stufen gerendert und verbinden die Ebenen spielbar
- Plattformen verwenden jetzt nahtlose 96px-Kachelreihen plus Zierleisten, Schattenfugen und Arkaden-Details
- Der Stil bewegt sich staerker in Richtung SNES-Gothic-Action: dichter, feiner und weniger prozedural-rechteckig

## Sprite-/Tilemap-Pass (V15)
- Player-Animationen kommen aus `assets/generated/player_sheet_16bit.png` statt aus verstreuten Einzel-PNGs
- Background-Tiling nutzt `assets/generated/bg_tiles_16bit.png` fuer ruhigere Mauer-, Fenster- und Pfeilerreihen
- Hintergrund-Props und Regen wurden reduziert, damit die spielbaren Ebenen klarer lesbar sind

## Image Tileset Cut (V16)
- Neues generiertes 16-bit Gothic-Tileset: `assets/generated/ai_tileset_16bit.png`
- Automatisch ausgeschnittene Einzeltiles fuer Floor, Wand, Trim, Treppen, Fenster, Pfeiler und Varianten
- Engine nutzt die ausgeschnittenen Tiles jetzt fuer Boden, Plattformen, Treppen und Background-Tiling

## Stage Audio Pass (V17)
- Stage-Playlists sind jetzt thematisch strenger sortiert: Courtyard, Clocktower, Inferno, Moon, Chapel und Citadel rotieren nur noch passende Tracks
- Jeder Boss nutzt einen eigenen `boss1` bis `boss6` Musikpool, statt im Kampf auf den generischen Boss-Key zurueckzufallen
- `M` wechselt weiter manuell zur naechsten passenden Variante der aktuellen Stage oder des aktiven Bosses

## Gothic Pixel Density Pass (V18)
- Engine nutzt jetzt deutlich mehr geslicte Pixelassets aus `assets/sprites2`: Breakables, Pickups, Subweapon-Projektile, Stage-Props, Vordergrund-Fackeln und Schatz-/Relikt-Deko
- Boden, Wände, Boss-Plattformen und Treppen greifen stärker auf die 96px Tilefamilien (`tile_floor_*`, `tile_wall_*`, `tile_stair_snes_*`, `tile_trim_snes_*`) statt auf grobe Fallback-Formen zu
- Neue eigene Sheets `player_sheet_sotn.png`, `enemy_sheet_sotn.png` und `boss_sheet_sotn.png` bringen Player, Gegner und Bosse mehr in Richtung gothic-metroidvania Silhouette
- Jede Stage bekommt deterministisch gesetzte Back-/Mid-/Front-Props, damit die Räume dichter und kuratierter wirken, ohne die Kollisionslogik zu verändern

## Imagegen SotN Pixel Pass (V19)
- Neues Imagegen-Seed-Sheet `imagegen_sotn_seed.png` mit Player, Enemy-Familien, Endboss und Gothic-Tiles wurde chroma-gekeyt und automatisch in spielbare Sheets/Tiles geschnitten
- Player, Gegner und alle Bosse rendern jetzt bevorzugt aus `player_sheet_imagegen.png`, `enemy_sheet_imagegen.png` und `boss_sheet_imagegen.png`
- Boden-, Wand-, Treppen-, Boss- und Hintergrund-Tiles nutzen die neuen `ig_*`-Assetfamilien mit leichter Ueberlappung, damit keine sichtbaren Luecken zwischen Tile-Kanten bleiben
- Die Stage-Midgrounds wurden als `bg_stage*_mid_tiled.png` mit dezenter Tile-Struktur gebacken; dadurch bleibt Parallax erhalten, ohne pro Frame einen teuren Fullscreen-Layer zu zeichnen

## Sprite Cleanup Pass (V20)
- Player nutzt `player_sheet_anim.png` mit erweitertem 4-Frame-Walk-Cycle und laenger lesbarer Whip-Phase
- Enemy-Sheet wurde zu `enemy_sheet_clean.png` normalisiert, damit Bonepillar und andere Gegner keine weissen Rand-Artefakte mitschleppen
- Bosse nutzen `boss_sheet_anim.png` mit getinteten Rows, Frame-Varianz und Aura/Hit-Flash statt rechteckiger Hitbox-Overlays
- Projektile rendern bevorzugt aus `projectile_sheet.png` statt aus einfachen Canvas-Rechtecken
- Treppen-Collision-Blocks werden nicht mehr als graue Rechtecke gezeichnet; sichtbar sind nur noch transparente Stair-Tiles
- Fuzzy Background-Layer und Fog wurden reduziert, die neuen `bg_stage*_crisp.png` Tile-Backdrops stehen jetzt staerker im Vordergrund

## Readability Cleanup Pass (V21)
- Nicht-interaktive Foreground-Deko nutzt keine Kerzen, Fackeln, Laternen, Treasure-Chests, Keys, Hearts, Goblets oder Relikte mehr
- Deko-Props sind jetzt nur noch architektonisch lesbare Objekte wie Türen, Fenster, Statuen, Frames, Busts, Coffins und Felsen
- Foreground- und allgemeine Wanddeko zeichnen nur noch dezente Ketten bzw. neutrale Mauer-/Architekturtiles statt falscher Pickup-/Breakable-Signale
- Breakable-Candle-Pools verwenden nur noch Kerzen-, Fackel-, Laternen- und Candelabra-Silhouetten, keine Loot-Sprites wie Watch, Heart, Goblet, Amulet oder Vial
- Kerzen/Fackeln/Chests/Loot bleiben damit visuell fuer echte Breakables, Pickups und Gameplay-Objekte reserviert

## Mobile Touch Pass (V22)
- Canvas wird auf Handy-Displays mit 16:9-Contain statt Stretching gerendert; Portrait bekommt oben die Spielflaeche und unten Touch-Controls
- Touch-D-Pad fuer Links/Rechts/Hoch/Runter plus Action-Buttons fuer Jump, Whip, Subweapon, Dash, Moonwalk und Burst
- Kleine START/CONT/MUS-Leiste erlaubt Titelbildschirm, Continue und Track-Wechsel ohne Tastatur
- HUD und Overlay schrumpfen auf kleinen Screens und verstecken weniger wichtige Felder, damit die Spielflaeche frei bleibt

## Whip Render Fix (V23)
- Extended-Whip wird nur noch einmal pro Frame gezeichnet; der doppelte Render-Pass nach `drawPlayer()` wurde entfernt
- Der breite Rechteck-Balken wurde durch eine segmentierte Peitschenkurve mit kleinem Tip-Glow ersetzt
- Neuer gezielter Smoke `asset_tools/smoke_whip.js` screenshotet direkt waehrend des Angriffsframes

## Stage Continue Prompt (V24)
- Stage-Wechsel-Overlay zeigt jetzt klar `PUSH ANY KEY / TAP TO CONTINUE`
- Intermission reagiert auf jede Tastaturtaste, nicht nur Enter
- Touch/Mouse-Tap auf Canvas, Overlay oder einen Touch-Button setzt die naechste Stage fort

## Desktop Mode Touch Gate (V25)
- Touch-Controls werden nicht mehr allein ueber kleine CSS-Breakpoints eingeblendet
- `game.js` setzt `body.touch-layout` nur fuer kompakte Touch-Layouts; grosse Desktop-Site-Viewports verstecken die Touch-Buttons
- Mobile-Smoke prueft jetzt zusaetzlich, dass ein simulierter Touch-Desktop-Modus keine Touch-Controls anzeigt

## Visual / Audio Polish Pass (V26)
- Title-Screen nutzt jetzt ein eigenes generiertes Castle/Moon/Sky-Background-Asset statt CSS-Klotzformen
- Stage-Background-Fluchtlinien wurden entfernt, damit die Kulissen weniger konstruiert wirken
- Neue Tracks aus Downloads sind in `assets/bgm` eingebunden; Stage 1 und Boss 2 starten mit energetischeren Stuecken
- Player-Sheet nutzt 12 Frames inklusive 3 Whip-Posen, plus separates Whip-Strip-Asset
- Boss-Sheet wurde neu generiert, Boss 2 hat jetzt ein eigenes astrales Sprite-Set
- Projectile-Sheet wurde als 4-Frame-Strip fuer alle Projektiltypen erneuert

## Boss 2 Hitbox Fix (V27)
- Boss 2 hat jetzt eine eigene, groessere `enemyHurtBox`, die zum sichtbaren Astral-Sprite passt
- Whip- und Projektiltreffer pruefen gegen diese Hurtbox statt nur gegen die kleine interne Bewegungsbox
- Boss-2-Smoke trifft absichtlich ausserhalb der alten Box und bestaetigt, dass HP sinkt

## Candle Hitbox Fix (V28)
- Candles/Fackeln/Candelabra haben jetzt eine groessere `candleHurtBox`, passend zu den sichtbaren Pixel-Props
- Whip-Treffer gegen Candles haben etwas mehr Hoehe und Reichweite, ohne die Enemy-Hitboxen zu veraendern
- Candle-Smoke trifft absichtlich ausserhalb der alten Box und bestaetigt, dass die Candle bricht

## Boss Gate / Diversity Pass (V29)
- Boss 2 startet in Stage 2 jetzt hidden/asleep und erscheint erst am Ende der Stage kurz vor der Arena
- Boss-Musik/HUD/Arena-Pattern ignorieren schlafende Bosse, damit Stage-Musik bis zum echten Bosskontakt weiterlaeuft
- Boss 4 nutzt als erste Auswahl `boss_masquerade.mp3` fuer einen energischeren Endkampf
- Stage-4-Knights werden auf passende Plattform-Tops gesnapped und der erste Ritter steht nicht mehr in der Bodenluecke
- Stage 1 reduziert im Auto-Modus teure Background-/Weather-Layer fuer stabilere Performance
- `boss_sheet_anim.png` wurde neu aufgebaut: Boss 1/2/4/5/6 haben klarere Silhouetten und Boss 2 liest sich nicht mehr wie Boss 1

## SFX Asset Pass (V30)
- Aus `OGG Files.zip`, `RPG_Essentials_Free.zip` und `Knight & Monsters Sounds Pack.zip` wurden 31 kuratierte Samples nach `assets/sfx/` extrahiert
- Neuer Sample-Player mit Round-Robin-Varianten und Cooldowns verhindert Clipping bei Whip-, Hit- und Footstep-Spam
- Whip, Subweapon, Dash, Jump, Land, Steps, Stair-Steps, Candle-Break, Pickups, Heal, Guard, Parry, Enemy-Hit, Enemy-Death, Boss-Roar, Boss-Death und Gate-Open nutzen jetzt echte Audio-Assets
- Die alten Synth-Tones bleiben nur noch als leise Layer fuer Retro-Punch und Fallback erhalten

## Stage Travel / Mobile Pass (V31)
- Stage-Wechsel nutzen jetzt eine skippable Map- und Korridor-Sequenz statt nur statischem Text
- Die Route markiert bereits geschaffte Stages und hebt die naechste Stage auf der Schlosskarte hervor
- Intermission bleibt per Tastatur, Tap oder Touch-Button sofort ueberspringbar
- Smartphone-Touchleiste hat jetzt einen `FS`-Button fuer Fullscreen-Toggle
- Neue Tracks aus Downloads sind eingebunden: `Cathedral of Ash`, `Gargoyle Chapel Run` und `Crimson Cathedral`

## Imagen Transition Asset Pass (V32)
- Stage-Wechsel nutzen jetzt die generierten Bitmap-Assets `transition_map_imagegen.png` und `transition_corridor_imagegen.png`
- Die Map-Knoten wurden auf die echten Zielfunken der neuen Schlosskarte ausgerichtet
- Der Korridor scrollt als Pixel-Art-Hintergrund; Runner und Peitsche kommen aus den vorhandenen Player-/Whip-Sprite-Sheets
- Der Transition-Smoke prueft jetzt explizit, dass Map, Korridor, Player und Whip aus Sprite-/Imagen-Assets geladen werden

## SotN Castle Route Pass (V33)
- Jede Stage bekommt zusaetzliche Upper-Wings, Lower-Loops und Boss-Antechambers, damit die Routen weniger linear und mehr castle-artig wirken
- Neue Sigil-Zones oeffnen optionale Seal-Gates und geben Hearts/Groove als Shortcut-Belohnung
- Side-Rooms enthalten echte Pickups, Candles und Gegner statt verwirrender Deko-Objekte
- Die Minimap zeigt jetzt Raumzellen, Side-Wings, Loop-Routes, Bossposition und verschlossene/offene Gates statt nur eines Fortschrittsbalkens
- Neuer Smoke `asset_tools/smoke_sotn_castle_route.js` prueft Raumgraph, Sigil-Gate-Opening und Minimap-Rendering

## Audio Mix Rebalance (V34)
- MP3-BGM ist jetzt deutlich lauter gemischt: Stages ca. 86%, Bosse ca. 92%
- SFX laufen durch einen konservativen Master-Faktor und key-spezifische Gains/Cooldowns, damit Combat nicht wie ein Dauerfeuer klingt
- `monster_hurt.wav` wurde aus den haeufigen Hit-Sounds entfernt und bleibt nicht mehr als Standard-Trefferfarbe im Mix
- Fireball, Impact, Explosion, Boss-Roar, Dash und UI-Samples sind leiser, tiefer und seltener triggerbar
- Synth-/Noise-Layer sind gedimmt, damit sie den MP3-Score nicht ueberdecken

## Boss Imagegen / Gothic SFX Pass (V35)
- `boss_sheet_anim.png` wurde durch eine neue Imagegen-Boss-Animation-Map ersetzt: 6 Boss-Reihen, je 3 Frames, deutlich mehr 16-bit/Metroidvania-Look
- Das rohe Imagegen-Sheet liegt als `boss_sheet_imagegen_v2_raw.png`, die keyed Runtime-Version als `boss_sheet_imagegen_v2.png`
- Das alte Paint-nahe Sheet ist als `boss_sheet_anim_pre_v35.png` gesichert
- Eigene weichere Gothic-SFX wurden lokal als WAV synthetisiert: Boss-Hit, Boss-Roar, Spell-Impact, Fire-Whoosh, Explosion und Gate-Chime
- Neue SFX sind im Mix verdrahtet; OGG-Encoding ist vorbereitet, braucht aber lokal noch `ffmpeg`, `opusenc` oder `oggenc`

## Player Animation / Crouch Pass (V36)
- `player_sheet_anim.png` ist jetzt ein 24-Frame-Strip: Idle, 8 Walk-Frames, Jump, Stair, Hurt, 6 Whip-Koerperframes, Crouch, 4 Crouch-Walk-Frames und Crouch-Whip
- `whip_sheet.png` wurde als neuer 8-Frame-Imagegen-Strip neu aufgebaut und kleiner ins Spiel skaliert
- Down/Touch-DN aktiviert am Boden Crouch; links/rechts waehrenddessen ergibt langsameren Crouch-Walk
- Crouch nutzt eine niedrigere Hurtbox und eine tiefere Whip-Hitbox, damit Projektil-Ducken und niedrige Peitschenschlaege glaubwuerdiger sind
- Neuer Smoke `asset_tools/smoke_player_anim_v36.js` prueft Player-/Whip-Sheet-Dimensionen, Frame-Mapping, Crouch-Keys und Hurtboxen

## Platform Cleanup Pass (V37)
- Die optionalen Upper-Wing/Lower-Loop/Antechamber-Routen sind jetzt als klarere Plattform-Laeufe gebaut statt als gestapelte Mini-Segmente
- `cleanupPlatformLayout()` entfernt kurze Filler-Plattformen ohne Gameplay-Payload und zieht nahe, gleiche Plattformlaeufe zusammen
- Stage-Deko-Props werden sparsamer gesetzt, damit Laufwege und Treppen weniger zugestellt wirken
- Treppen-Rendering nutzt weniger, kleinere Tiles und keine lange diagonale Hilfslinie mehr
- Route-Smoke bestaetigt weiterhin Rooms, Wings, Loop, Sigil-Gates und Minimap-Rendering

## Stair Walk Cleanup (V38)
- Treppen werden jetzt ueber die echten `stair`-Step-Solids gezeichnet statt ueber eine separate diagonale Visual-Linie
- Player-Bewegung auf Treppen snappt auf diskrete Step-Hoehen; dadurch kein Zipline-Gleiten entlang einer unsichtbaren Diagonale mehr
- Up/Down beruecksichtigt jetzt, welche Seite der Treppe wirklich nach oben fuehrt, und dreht die Figur beim Runterlaufen korrekt um
- Stair-Animation nutzt mehrere Player-Frames statt nur eines statischen Stair-Frames
- Hintergrund-Tile-Reihen ueberlappen leicht und sind gedimmt, damit keine langen horizontalen Seam-Linien wie Fuehrungsseile entstehen
- Neuer Smoke `asset_tools/smoke_stair_v38.js` prueft Step-Snap, Facing, Framewechsel und dass `drawStairVisual` keine Linie mehr zeichnet

## Stair Track Overhaul (V39)
- Jede Treppe wird beim Stage-Build zu einem Track mit echter Step-Liste hydratisiert (`refreshStairTracks`)
- Attach sucht jetzt die naechste sinnvolle Stufe statt eine abstrakte Diagonale; `ArrowUp` ist nicht mehr gleichzeitig Jump
- Bewegung laeuft Step-to-Step mit kurzer Transition, inklusive Up/Down und links/rechts entlang der Treppe
- Stair-Solids blocken horizontal nicht mehr, bleiben aber als Landeflaechen/Step-Referenz erhalten
- Treppen werden als zusammenhaengende Stair-Runs gezeichnet, nicht mehr als einzelne Kollisionskloetze
- Stage-1-Lite-Hintergrund zeichnet nur noch eine Tile-Reihe, damit keine horizontale Naht wie eine Zipline durchs Bild laeuft

## Stage 2 BGM / Stair Clarity Pass (V40)
- Stage 2 startet jetzt mit `stage2_clocktower.mp3`; Stage 1 und 2 teilen sich nicht mehr denselben Starttrack
- `pickBgmTrack` startet jede Stage-/Boss-Gruppe sauber beim ersten Track und rotiert erst danach weiter
- Stair-Visuals sind jetzt zusammenhaengende, ueberlappende Trittstufen mit stark gedaempfter Textur statt loser Ornament-Kloetze
- Neuer Smoke `asset_tools/smoke_stage2_bgm_stairs_v40.js` prueft Stage-2-BGM, Treppen-Tracks und Screenshot-Render

## Tile Stability Pass (V41)
- Kamera und Parallax-Offsets werden beim Rendern auf ganze Pixel gesnappt, damit Pixel-Tiles beim Scrollen nicht mehr subpixelig flimmern
- Hintergrund-Tile-Layer und Tile-Fills zeichnen nur noch auf gerundeten Koordinaten
- Zufällige Fullscreen-Blitz-Overlays wurden entfernt; CRT-Scanlines und Chromatic-Tint sind deutlich gedimmt

## Classic Stair Stonework Pass (V42)
- Treppen werden jetzt als flache klassische Gothic-Action-Steintritte mit heller Vorderkante, grauer Front und kurzen Risern gezeichnet
- Die vorherigen breiten Kasten-/Planken-Stufen wurden entfernt; die Treppe bleibt schlank und klar lesbar
- Treppenmechanik bleibt auf den bestehenden Step-Tracks: Smoke prueft Attach, Step-Snap, Facing und horizontales Treppenlaufen

## Ouverture Gate Pass (V43)
- Stage 1 heisst jetzt `Ouverture Gate` und startet mit einem neuen spielbaren Waldvorhof vor der alten Courtyard-Route
- Der Vorhof enthaelt Gartenhecke, Eisenzaun, Baum-Silhouetten, Statuen, Torbogen/Gate, erste Plattformen, eine Dagger-Pickup-Route und leichten Gegnerdruck
- Die alte Stage-1-Geometrie wurde nach hinten verschoben; Stage-Zeit ist auf 480 Sekunden angehoben
- Neuer Smoke `asset_tools/smoke_overture_gate_v43.js` prueft Stage-Name, Setpieces, Intro-Gegner, Intro-Geometrie und Screenshot

## Ouverture Gate Expansion Pass (V44)
- Der Waldvorhof wurde um einen Gatehouse-/Mausoleum-Abschnitt mit weiterer Hoehenroute verlaengert
- Neue gezeichnete Pixel-Setpieces: `gateHouse`, `mausoleum`, `fountain` und `roseBush`
- Stage 1 hat jetzt mehr Auf-/Abstiege, einen zweiten kleinen Encounter-Block und zusaetzliche Guard-/Candle-Payloads vor der alten Courtyard-Route
- Hedge-/Fence-Setpieces rendern stabiler auf gerundeten Koordinaten, damit beim Scrollen weniger Tile-Flimmern entsteht
- Der Overture-Smoke prueft jetzt die neuen Setpieces, vier Intro-Gegner, sechs Intro-Solids und die verlaengerte Weltbreite

## Audio De-Chiptune Pass (V45)
- BGM-MP3s sind jetzt lauter gemischt und werden nach Audio-Unlock automatisch erneut gestartet, falls Chrome den ersten Play-Versuch blockiert
- Die Synth-Fallback-Musik und WebAudio-Bleep-SFX sind stummgeschaltet, damit kein C64-artiger Ersatztrack durchscheint
- Neue Sample-SFX aus Downloads wurden mit URL-sicheren Namen eingebunden: Whip-Slashes, Bone-Hits, Armor-Sounds, Knife-Slices und Thunder-Impacts
- Whip, Enemy-Hit, Boss-Hit, Boss-Die, Explosion, Pickup, Candle und Subweapon nutzen jetzt bevorzugt Sample-Dateien statt Oszillator-Bleeps
- Der Audio-Smoke prueft jetzt, dass BGM wirklich laeuft, Synth-Master 0 ist und Whip/Enemy-Hit Sample-Listen verwenden

## Mode7 Transparent Tile Pass (V46)
- Der Hintergrund rendert jetzt eine faux-Mode7 Tile-Ebene aus vorhandenen `ig_*` Asset-Tiles
- Tile-Baender werden nach Tiefe gezoomt, horizontal gestretcht, kameraabhaengig gescrollt und transparent/screen-gemischt
- Stage-Transitionen haben zusaetzlich eine gekippte transparente Tile-Runway mit animiertem Zoom-Scroll
- Der Effekt nutzt keine harten Fluchtlinien, sondern nur perspektivische Tile-Textur und sanfte Glas-/Nebel-Alpha
- Neuer Smoke `asset_tools/smoke_mode7_v46.js` prueft Ingame-Baender, Tile-Draws und das transformierte Transition-Runway-Element

## Super7 Dense Tile Pass (V47)
- Sichtbares Branding wurde auf `Nocturne Moonwalker` umgestellt; altes Reihen-Naming ist aus Titel/UI/Doku entfernt
- Die perspektivische Tile-Ebene nutzt jetzt zwei transparente Super7-Passes statt nur eines Bodenlayers
- Zusaetzlich zu `ig_*`-Tiles werden `ai_tile_*`, `tile_floor_*` und Wall-/Grate-Assets in die Zoom-Stretch-Ebene gemischt
- Stage-Transitionen haben eine zweite animierte Tile-Runway-Schicht mit eigener Transparenz und schnellerem Scroll
- Der Mode7-Smoke wurde auf dichtere Tile-Zahlen, mehrere Passes und brandingfreie Titelpruefung erweitert

## Mobile Fullscreen Toggle Pass (V48)
- Smartphone-Modus hat jetzt einen eigenen Fullscreen-Toggle rechts oben statt eines kleinen FS-Menuebuttons
- Der Button zeigt per `aria-pressed`, Active-Klasse und Icon-Zustand an, ob Fullscreen aktiv ist
- Fullscreen-Events (`fullscreenchange`, `webkitfullscreenchange`, `msfullscreenchange`) halten den Button synchron
- Wenn die Fullscreen-API am Handy nicht verfuegbar ist, greift ein `mobile-pseudo-fullscreen` Fallback
- Mobile-Smoke prueft Portrait/Landscape, Toggle an/aus und dass Touch-Controls im Desktop-Modus verborgen bleiben

## Tree / Arch Tilemap Pass (V49)
- Neue transparente Pixel-Tilemap `tree_arch_tilemap_imagegen_v49.png` mit 32px-Tiles fuer Baumkronen, Staemme, Wurzeln, Steinbogen, Pfeiler, Gitter und Ranken
- Metadaten liegen in `tree_arch_tilemap_imagegen_v49.json`, damit die Tiles spaeter leichter erweitert oder neu geschnitten werden koennen
- `forestTree`, `gardenGate` und `gardenArch` werden jetzt aus dem Tile-Atlas zusammengesetzt statt aus reinen Canvas-Rechtecken
- Alte Shape-Renderings bleiben als Fallback erhalten, falls der Atlas noch nicht geladen ist
- Neuer Smoke `asset_tools/smoke_tree_arch_tilemap_v49.js` prueft Atlas-Ladezustand, Tile-Draws fuer Baeume/Torbogen und Screenshot-Rendering

## Bush / Garden Grille Tilemap Pass (V52)
- Neue Imagegen-basierte 8x4-Tilemap `bush_fence_tilemap_imagegen_v52.png` fuer Hecken, Rosenbuesche, Schmiedeeisen-Zaun und Garten-Gitter
- Das Normalizer-Script schneidet die Imagegen-Quelle aus, entfernt die dunkle Matte per Flood-Fill und schreibt transparente 32px-Tiles plus JSON-Metadaten
- `hedge`, `roseBush`, `ironFence`, `gardenGate` und `gardenArch` nutzen jetzt das neue Sheet statt Canvas-Rechteck-Fallbacks, sobald der Atlas geladen ist
- Garten-Gates bekommen zusaetzliche transparente Gitter-Inlays aus der vierten Tile-Reihe
- Neuer Smoke `asset_tools/smoke_bush_fence_tilemap_v52.js` prueft Atlas-Ladezustand, Tile-Draws fuer Buesche/Zaun/Gitter und Screenshot-Rendering

## Performance / Flicker Stability Pass (V53)
- `preloadAllArt()` laedt jetzt zuerst nur Stage-1-kritische Bilder, Sheets und Tiles und streamt den Rest in kleinen Idle-Batches nach
- Auto-Quality startet im stabileren Medium-Budget und wechselt erst nach laengerer Erholung wieder hoch, damit Nebel/Super7-Layer nicht staendig ein- und ausblinken
- Enter/Start wartet nun kurz auf Stage-kritische Kernassets, damit der erste Run nicht mit halbgeladenen Sprites/Fallbacks losstottert
- Super7-Scroll, Parallax-Offsets und dekorative Wall-Tiles sind pixelgesnapped und nutzen stabile modulo-basierte Offsets
- Lange Garten-Hecken und Eisenzaeune werden auf den sichtbaren Viewport begrenzt; im Smoke sinken Bush/Fence-Draws von 108/39 auf maximal 72/25
- Der Canvas-CSS-Filter ist entfernt, CRT-Scanlines sind im Auto-Medium-Budget deaktiviert, und HUD-Text schreibt nur noch bei echten Wertwechseln in den DOM
- Neuer Smoke `asset_tools/smoke_perf_stability_v53.js` prueft Preload-Status, Quality-Hysterese, Auto-Budget und gekappte Garten-Tile-Draws

## Viewport Solid Culling Pass (V54)
- Breite Boden- und Plattform-Solids werden nicht mehr ueber ihre komplette Weltbreite getiled, sondern auf den sichtbaren Kamerabereich plus kleinen Rand begrenzt
- Die vertikale Tile-Fuellung zeichnet nur noch die wirklich angeschnittenen Tile-Reihen; im Smoke sinkt der Solid-Tile-Spitzenwert von 129 auf 43 Draws
- Trim-Tiles, Zisel-Linien und Plattform-Arches nutzen denselben sichtbaren Weltbereich, damit Stage-Scroll weniger CPU/GPU-Overdraw erzeugt
- Bild-Assets werden nach dem Anlegen per `decode()` vorgewaermt, wodurch spaete Decode-Ruckler beim ersten Auftauchen reduziert werden
- Stage- und Boss-BGM-Gruppen werden beim Start und Stagewechsel vorgeladen, damit Musikwechsel nicht erst beim Bosskontakt nachladen muessen
- Neuer Smoke `asset_tools/smoke_viewport_cull_v54.js` prueft Stage 1/3/6, Solid-Culling, BGM-Warmup, Garten-Tile-Caps und Screenshot-Rendering

## Solid Spatial Index Pass (V55)
- Solids werden nach dem Stage-Build in 512px-Welt-Buckets indiziert; breite Bodenplatten liegen in allen betroffenen Buckets
- Player-X/Y-Kollision, Pickup-Bodenberuehrung, Subweapon-/EnemyProjectile-Wandtreffer, Enemy-Ground-Snapping und `drawLevel()` nutzen jetzt `solidsNear()`
- Seals und Stage-4-Gates bauen den Index nach dem Oeffnen neu auf, damit entfernte Barrieren sofort aus Kollision und Rendering verschwinden
- Der Smoke zeigt fuer Stage 1 maximal 48 nahe Solid-Kandidaten statt 185 Gesamt-Solids, ohne sichtbare Solids zu verpassen
- Neuer Smoke `asset_tools/smoke_solid_index_v55.js` prueft Stage 1/4/6, Index-Coverage, Gate-Rebuild und Solid-Draw-Caps
