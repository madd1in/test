"""Crop the Imagen HD atlas into room backgrounds.

Source:
  assets/source/imagen_nocturne_hd_atlas_20260508.png

Outputs are 1920x1080 PNGs used directly by game.js. The atlas is a 2x2
sheet: belltower, library, cavern, garden.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "imagen_nocturne_hd_atlas_20260508.png"
OUT = ROOT / "assets" / "generated"
TARGET_SIZE = (1920, 1080)


def crop_cover(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    crop = img.crop(box).convert("RGB")
    src_w, src_h = crop.size
    target_w, target_h = TARGET_SIZE
    scale = max(target_w / src_w, target_h / src_h)
    resized = crop.resize((round(src_w * scale), round(src_h * scale)), Image.Resampling.LANCZOS)
    x = (resized.width - target_w) // 2
    y = (resized.height - target_h) // 2
    final = resized.crop((x, y, x + target_w, y + target_h))
    final = ImageEnhance.Contrast(final).enhance(1.06)
    final = ImageEnhance.Color(final).enhance(1.04)
    final = final.filter(ImageFilter.UnsharpMask(radius=1.1, percent=75, threshold=3))
    return final


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source atlas: {SOURCE}")

    OUT.mkdir(parents=True, exist_ok=True)
    atlas = Image.open(SOURCE)
    half_w = atlas.width // 2
    half_h = atlas.height // 2
    panels = {
        "bg_imagen_belltower_hd.png": (0, 0, half_w, half_h),
        "bg_imagen_library_hd.png": (half_w, 0, atlas.width, half_h),
        "bg_imagen_cavern_hd.png": (0, half_h, half_w, atlas.height),
        "bg_imagen_garden_hd.png": (half_w, half_h, atlas.width, atlas.height),
    }

    for name, box in panels.items():
        target = OUT / name
        crop_cover(atlas, box).save(target, optimize=True)
        print(f"Wrote {target}")


if __name__ == "__main__":
    main()
