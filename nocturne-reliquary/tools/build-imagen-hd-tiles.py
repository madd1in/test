"""Crop the Imagen HD platform-tile atlas into a runtime texture sheet.

Source:
  assets/source/imagen_nocturne_hd_tiles_atlas_20260508.png

Output:
  assets/generated/tiles_imagen_hd_platforms.png

The generated source is a 3x2 sheet:
  gold, stone, blue
  green, red, trim
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "imagen_nocturne_hd_tiles_atlas_20260508.png"
OUT = ROOT / "assets" / "generated" / "tiles_imagen_hd_platforms.png"
CELL = 256
GRID = (3, 2)


def crop_panel(atlas: Image.Image, col: int, row: int) -> Image.Image:
    panel_w = atlas.width / GRID[0]
    panel_h = atlas.height / GRID[1]
    inset = max(6, round(min(panel_w, panel_h) * 0.014))
    left = round(col * panel_w) + inset
    top = round(row * panel_h) + inset
    right = round((col + 1) * panel_w) - inset
    bottom = round((row + 1) * panel_h) - inset
    crop = atlas.crop((left, top, right, bottom)).convert("RGB")

    side = min(crop.width, crop.height)
    x = (crop.width - side) // 2
    y = (crop.height - side) // 2
    crop = crop.crop((x, y, x + side, y + side))
    crop = crop.resize((CELL, CELL), Image.Resampling.LANCZOS)
    crop = ImageEnhance.Contrast(crop).enhance(1.08)
    crop = ImageEnhance.Color(crop).enhance(1.04)
    crop = crop.filter(ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=3))
    return crop


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source atlas: {SOURCE}")

    atlas = Image.open(SOURCE)
    sheet = Image.new("RGB", (CELL * GRID[0], CELL * GRID[1]), (7, 7, 10))
    for row in range(GRID[1]):
        for col in range(GRID[0]):
            sheet.paste(crop_panel(atlas, col, row), (col * CELL, row * CELL))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
