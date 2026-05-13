# Coconut Corsair

An original HD point-and-click pirate adventure built as a static browser game.

## Run

Open `index.html` directly, or serve the folder locally:

```powershell
cd coconut-corsair
python -m http.server 4179
```

## Assets

- `assets/source/background_atlas_imagen_hd.png` was generated with the built-in Imagegen workflow.
- `assets/source/player_anim_atlas_imagen_key.png` and `assets/source/npc_anim_atlas_imagen_key.png` are Imagen HD animation atlases normalized into the runtime character sheet.
- `assets/source/item_atlas_imagen_hd.png` and `assets/source/parallax_atlas_imagen_key.png` were generated with the built-in Imagegen workflow.
- `tools/build_assets.ps1` slices the room atlas, normalizes the HD character and item atlases, removes chroma keys, and creates sprite sheets.
- Voice output uses the browser SpeechSynthesis API and can be enabled from the top bar.
- BGM uses the newer downloaded MP3 loops copied into `assets/audio/bgm`.

## Verify

```powershell
node tools/smoke-test.js
```
