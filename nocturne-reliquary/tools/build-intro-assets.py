"""Process Imagegen HD intro assets into runtime game sheets.

Sources are generated bitmap assets kept under assets/source:
  imagen_title_screen_hd_20260508.png
  imagen_intro_forest_opening_20260508.png
  imagen_intro_castle_garden_20260508.png
  imagen_intro_parallax_atlas_20260508.png
  imagen_intro_tiles_props_atlas_20260508.png
  imagen_intro_item_icons_atlas_20260508.png
  imagen_intro_portcullis_20260508.png
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source"
OUT = ROOT / "assets" / "generated"
TARGET_BG = (1920, 1080)
TILE = 256
ICON = 128
PORTCULLIS_SIZE = (512, 768)

SRC_TITLE = SOURCE / "imagen_title_screen_hd_20260508.png"
SRC_FOREST = SOURCE / "imagen_intro_forest_opening_20260508.png"
SRC_GARDEN = SOURCE / "imagen_intro_castle_garden_20260508.png"
SRC_PARALLAX = SOURCE / "imagen_intro_parallax_atlas_20260508.png"
SRC_TILES = SOURCE / "imagen_intro_tiles_props_atlas_20260508.png"
SRC_ICONS = SOURCE / "imagen_intro_item_icons_atlas_20260508.png"
SRC_PORTCULLIS = SOURCE / "imagen_intro_portcullis_20260508.png"


def crop_cover(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    img = img.convert("RGB")
    src_w, src_h = img.size
    target_w, target_h = size
    scale = max(target_w / src_w, target_h / src_h)
    resized = img.resize((round(src_w * scale), round(src_h * scale)), Image.Resampling.LANCZOS)
    x = (resized.width - target_w) // 2
    y = (resized.height - target_h) // 2
    final = resized.crop((x, y, x + target_w, y + target_h))
    final = ImageEnhance.Contrast(final).enhance(1.06)
    final = ImageEnhance.Color(final).enhance(1.04)
    return final.filter(ImageFilter.UnsharpMask(radius=1.0, percent=70, threshold=3))


def crop_cell(atlas: Image.Image, col: int, row: int, cols: int, rows: int) -> Image.Image:
    w, h = atlas.size
    return atlas.crop((
        round(col * w / cols),
        round(row * h / rows),
        round((col + 1) * w / cols),
        round((row + 1) * h / rows),
    ))


def crop_contain(img: Image.Image, size: tuple[int, int], fill=(0, 0, 0, 0)) -> Image.Image:
    img = img.convert("RGBA")
    src_w, src_h = img.size
    target_w, target_h = size
    scale = min(target_w / src_w, target_h / src_h)
    resized = img.resize((max(1, round(src_w * scale)), max(1, round(src_h * scale))), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", size, fill)
    out.alpha_composite(resized, ((target_w - resized.width) // 2, (target_h - resized.height) // 2))
    return out


def border_key(img: Image.Image) -> tuple[int, int, int]:
    rgb = img.convert("RGB")
    points = [
        rgb.getpixel((0, 0)),
        rgb.getpixel((rgb.width - 1, 0)),
        rgb.getpixel((0, rgb.height - 1)),
        rgb.getpixel((rgb.width - 1, rgb.height - 1)),
    ]
    return tuple(round(sum(p[i] for p in points) / len(points)) for i in range(3))


def remove_key(img: Image.Image, key: tuple[int, int, int] | None = None, threshold=72, soft=34) -> Image.Image:
    rgb = img.convert("RGBA")
    key = key or border_key(rgb)
    px = rgb.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b, a = px[x, y]
            dist = ((r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2) ** 0.5
            if dist <= threshold:
                px[x, y] = (0, 0, 0, 0)
            elif dist <= threshold + soft:
                alpha = int(a * (dist - threshold) / max(1, soft))
                # Despill toward the strongest non-key channel.
                if key[1] > key[0] and key[1] > key[2]:
                    g = min(g, max(r, b) + 16)
                elif key[0] > key[1] and key[2] > key[1]:
                    r = min(r, g + 20)
                    b = min(b, g + 20)
                px[x, y] = (r, g, b, alpha)
            elif key[1] > key[0] and key[1] > key[2] and g > max(r, b) + 36:
                px[x, y] = (r, min(g, max(r, b) + 18), b, a)
            elif key[0] > key[1] and key[2] > key[1] and r > g + 36 and b > g + 36:
                px[x, y] = (min(r, g + 24), g, min(b, g + 24), a)
    return rgb


def trim_alpha(img: Image.Image, pad=10) -> Image.Image:
    img = img.convert("RGBA")
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    box = (
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(img.width, x1 + pad),
        min(img.height, y1 + pad),
    )
    return img.crop(box)


def write_backgrounds() -> None:
    targets = [
        (SRC_TITLE, "bg_imagen_title_screen_hd.png"),
        (SRC_FOREST, "bg_imagen_forest_opening_hd.png"),
        (SRC_GARDEN, "bg_imagen_castle_garden_hd.png"),
    ]
    for source, name in targets:
        if not source.exists():
            raise SystemExit(f"Missing Imagegen source: {source}")
        target = OUT / name
        crop_cover(Image.open(source), TARGET_BG).save(target, optimize=True)
        print(f"Wrote {target}")


def write_parallax() -> None:
    if not SRC_PARALLAX.exists():
        raise SystemExit(f"Missing Imagegen source: {SRC_PARALLAX}")
    atlas = Image.open(SRC_PARALLAX)
    panels = [
        ("para_imagen_forest_canopy_hd.png", crop_cell(atlas, 0, 0, 2, 1)),
        ("para_imagen_castle_statues_hd.png", crop_cell(atlas, 1, 0, 2, 1)),
    ]
    for name, panel in panels:
        keyed = remove_key(crop_cover(panel, TARGET_BG), threshold=78, soft=42)
        target = OUT / name
        keyed.save(target, optimize=True)
        print(f"Wrote {target}")


def write_tiles() -> None:
    if not SRC_TILES.exists():
        raise SystemExit(f"Missing Imagegen source: {SRC_TILES}")
    atlas = Image.open(SRC_TILES).convert("RGB")
    sheet = Image.new("RGB", (TILE * 4, TILE * 2), (7, 7, 10))
    for row in range(2):
        for col in range(4):
            cell = crop_cover(crop_cell(atlas, col, row, 4, 2), (TILE, TILE))
            sheet.paste(cell, (col * TILE, row * TILE))
    target = OUT / "tiles_imagen_intro_props.png"
    sheet.save(target, optimize=True)
    print(f"Wrote {target}")


def write_icons() -> None:
    if not SRC_ICONS.exists():
        raise SystemExit(f"Missing Imagegen source: {SRC_ICONS}")
    atlas = Image.open(SRC_ICONS)
    sheet = Image.new("RGBA", (ICON * 4, ICON * 3), (0, 0, 0, 0))
    for row in range(3):
        for col in range(4):
            raw = crop_cell(atlas, col, row, 4, 3)
            keyed = trim_alpha(remove_key(raw, threshold=86, soft=40), pad=12)
            cell = crop_contain(keyed, (ICON, ICON))
            sheet.alpha_composite(cell, (col * ICON, row * ICON))
    target = OUT / "items_imagen_hd.png"
    sheet.save(target, optimize=True)
    print(f"Wrote {target}")


def write_portcullis() -> None:
    if not SRC_PORTCULLIS.exists():
        raise SystemExit(f"Missing Imagegen source: {SRC_PORTCULLIS}")
    keyed = trim_alpha(remove_key(Image.open(SRC_PORTCULLIS), threshold=82, soft=42), pad=20)
    sprite = crop_contain(keyed, PORTCULLIS_SIZE)
    target = OUT / "sprite_imagen_portcullis.png"
    sprite.save(target, optimize=True)
    print(f"Wrote {target}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write_backgrounds()
    write_parallax()
    write_tiles()
    write_icons()
    write_portcullis()


if __name__ == "__main__":
    main()
