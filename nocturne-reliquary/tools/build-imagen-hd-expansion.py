"""Crop the newer Imagen HD atlases into room backgrounds.

Sources:
  assets/source/imagen_nocturne_hd_legacy_atlas_20260508.png
  assets/source/imagen_nocturne_hd_expansion_atlas_20260508.png

Outputs are 1920x1080 PNGs used directly by game.js.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_LEGACY = ROOT / "assets" / "source" / "imagen_nocturne_hd_legacy_atlas_20260508.png"
SOURCE_EXPANSION = ROOT / "assets" / "source" / "imagen_nocturne_hd_expansion_atlas_20260508.png"
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
    final = ImageEnhance.Contrast(final).enhance(1.07)
    final = ImageEnhance.Color(final).enhance(1.03)
    final = final.filter(ImageFilter.UnsharpMask(radius=1.1, percent=70, threshold=3))
    return final


def write_panels(source: Path, panels: dict[str, tuple[int, int]]) -> None:
    if not source.exists():
        raise SystemExit(f"Missing source atlas: {source}")
    atlas = Image.open(source)
    panel_w = atlas.width // 2
    panel_h = atlas.height // 2
    for name, (col, row) in panels.items():
        box = (col * panel_w, row * panel_h, (col + 1) * panel_w, (row + 1) * panel_h)
        target = OUT / name
        crop_cover(atlas, box).save(target, optimize=True)
        print(f"Wrote {target}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write_panels(SOURCE_LEGACY, {
        "bg_imagen_gate_hd.png": (0, 0),
        "bg_imagen_clock_hd.png": (1, 0),
        "bg_imagen_crypt_hd.png": (0, 1),
        "bg_imagen_reliquary_hd.png": (1, 1),
    })
    write_panels(SOURCE_EXPANSION, {
        "bg_imagen_archive_hd.png": (0, 0),
        "bg_imagen_ossuary_hd.png": (1, 0),
        "bg_imagen_aqueduct_hd.png": (0, 1),
        "bg_imagen_loft_hd.png": (1, 1),
    })


if __name__ == "__main__":
    main()
