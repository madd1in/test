"""Crop the Imagen parallax atlas into transparent overlay layers."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "imagen_nocturne_hd_parallax_atlas_20260508.png"
OUT = ROOT / "assets" / "generated"
TARGET_SIZE = (1920, 1080)
KEY = (0, 255, 0)


def remove_green_key(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = px[x, y]
            green_score = g - max(r, b)
            if g > 170 and green_score > 62:
                px[x, y] = (0, 0, 0, 0)
            elif g > 120 and green_score > 38:
                alpha = int(a * max(0, min(1, 1 - (green_score - 38) / 70)))
                px[x, y] = (r, min(g, max(r, b) + 12), b, alpha)
            elif g > max(r, b) + 24:
                px[x, y] = (r, min(g, max(r, b) + 10), b, a)
    return rgba


def crop_cover_alpha(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    crop = img.crop(box).convert("RGB")
    src_w, src_h = crop.size
    target_w, target_h = TARGET_SIZE
    scale = max(target_w / src_w, target_h / src_h)
    resized = crop.resize((round(src_w * scale), round(src_h * scale)), Image.Resampling.LANCZOS)
    x = (resized.width - target_w) // 2
    y = (resized.height - target_h) // 2
    final = resized.crop((x, y, x + target_w, y + target_h))
    final = ImageEnhance.Contrast(final).enhance(1.05)
    final = final.filter(ImageFilter.UnsharpMask(radius=0.8, percent=60, threshold=3))
    return remove_green_key(final)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source atlas: {SOURCE}")
    OUT.mkdir(parents=True, exist_ok=True)
    atlas = Image.open(SOURCE)
    panel_w = atlas.width // 2
    panel_h = atlas.height // 2
    panels = {
        "para_imagen_arches_hd.png": (0, 0),
        "para_imagen_machinery_hd.png": (1, 0),
        "para_imagen_mist_roses_hd.png": (0, 1),
        "para_imagen_crystals_hd.png": (1, 1),
    }
    for name, (col, row) in panels.items():
        box = (col * panel_w, row * panel_h, (col + 1) * panel_w, (row + 1) * panel_h)
        target = OUT / name
        crop_cover_alpha(atlas, box).save(target, optimize=True)
        print(f"Wrote {target}")


if __name__ == "__main__":
    main()
