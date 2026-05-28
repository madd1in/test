from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "generated" / "tile-atlas-imagen-hd-v2-source.png"
OUT = ROOT / "assets" / "environment" / "tiles-imagen-hd.png"
TILE = 32
COLS = 8
ROWS = 4


SOURCE_TO_GAME_INDEX = {index: index for index in range(COLS * ROWS)}


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = hex_color.lstrip("#")
    return (
        int(value[0:2], 16),
        int(value[2:4], 16),
        int(value[4:6], 16),
        alpha,
    )


def crop_source_cell(source: Image.Image, index: int) -> Image.Image:
    src_w, src_h = source.size
    cell_w = src_w / COLS
    cell_h = src_h / ROWS
    x = index % COLS
    y = index // COLS
    margin_x = cell_w * 0.08
    margin_y = cell_h * 0.08
    box = (
        round(x * cell_w + margin_x),
        round(y * cell_h + margin_y),
        round((x + 1) * cell_w - margin_x),
        round((y + 1) * cell_h - margin_y),
    )
    tile = source.crop(box).convert("RGBA")
    tile = ImageOps.fit(tile, (TILE, TILE), method=Image.Resampling.LANCZOS)
    tile = ImageEnhance.Color(tile).enhance(1.12)
    tile = ImageEnhance.Contrast(tile).enhance(1.08)
    return tile.filter(ImageFilter.UnsharpMask(radius=0.6, percent=70, threshold=2))


def add_soft_vignette(tile: Image.Image, alpha: int = 42) -> None:
    overlay = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle((0, 0, TILE - 1, TILE - 1), outline=(0, 0, 0, alpha), width=2)
    tile.alpha_composite(overlay)


def line(draw: ImageDraw.ImageDraw, points: tuple[int, int, int, int], color: str, alpha: int, width: int = 1) -> None:
    draw.line(points, fill=rgba(color, alpha), width=width)


def polish_tile(tile: Image.Image, out_index: int) -> Image.Image:
    tile = tile.copy()
    soft_ground = {0, 1, 2, 3, 6, 16, 17, 23, 28, 31}
    if out_index in soft_ground:
        tile = tile.filter(ImageFilter.GaussianBlur(0.55))
        tile = ImageEnhance.Contrast(tile).enhance(0.78)
    add_soft_vignette(tile, 0 if out_index in soft_ground else 26)
    draw = ImageDraw.Draw(tile, "RGBA")

    if out_index in {0, 1, 3}:
        haze = Image.new("RGBA", (TILE, TILE), rgba("#668f34", 48 if out_index == 0 else 36))
        tile.alpha_composite(haze)
        draw = ImageDraw.Draw(tile, "RGBA")
        for x, y, color in ((6, 7, "#9adf72"), (18, 12, "#6fbb5b"), (26, 22, "#d7a85a"), (11, 25, "#456e35"), (23, 5, "#b7d879"), (4, 21, "#486b2f"), (28, 13, "#accb58")):
            draw.point((x, y), fill=rgba(color, 155))
            draw.point((x + 1, y), fill=rgba(color, 120))
    elif out_index == 4:
        for y in (8, 17, 25):
            draw.arc((3, y - 6, 30, y + 7), 12, 168, fill=rgba("#b9fff6", 110), width=1)
    elif out_index in {5, 26}:
        for y in range(5, 31, 8):
            line(draw, (1, y, 31, y + 1), "#2a1710", 140, 1)
        for x in (9, 20):
            line(draw, (x, 3, x - 2, 30), "#c8955a", 90, 1)
    elif out_index in {7, 20}:
        shade = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 130 if out_index == 7 else 90))
        tile.alpha_composite(shade)
        draw = ImageDraw.Draw(tile, "RGBA")
        draw.ellipse((5, 5, 27, 27), fill=rgba("#020707", 180), outline=rgba("#52615e", 80), width=1)
    elif out_index in {8, 21, 29}:
        draw.rectangle((2, 4, 29, 29), outline=rgba("#b4b9a7", 105), width=2)
        for x in (10, 21):
            line(draw, (x, 5, x - 3, 29), "#111818", 100, 1)
    elif out_index == 9:
        draw.ellipse((1, 0, 31, 25), fill=rgba("#17321e", 150))
        draw.ellipse((5, 2, 27, 22), outline=rgba("#88d071", 90), width=2)
        draw.rectangle((13, 18, 19, 31), fill=rgba("#66422c", 180))
    elif out_index in {10, 31}:
        for k in range(6):
            y = 5 + k * 4
            line(draw, (2, y, 30, y + 6), "#210b12", 185, 2)
            line(draw, (3, y, 30, y + 6), "#cf5a4d", 125, 1)
    elif out_index == 11:
        draw.rectangle((6, 4, 26, 31), fill=rgba("#311d18", 180))
        draw.rectangle((9, 7, 23, 31), fill=rgba("#87502e", 190))
        draw.ellipse((13, 13, 20, 20), outline=rgba("#ffce67", 210), width=2)
    elif out_index == 12:
        draw.arc((4, 2, 28, 38), 180, 360, fill=rgba("#bdc2b0", 200), width=3)
        draw.rectangle((5, 17, 9, 31), fill=rgba("#6e7871", 190))
        draw.rectangle((23, 17, 27, 31), fill=rgba("#6e7871", 190))
    elif out_index == 13:
        draw.rectangle((10, 5, 22, 29), fill=rgba("#7a827a", 185))
        draw.rectangle((7, 3, 25, 10), fill=rgba("#c6c8ad", 160))
        draw.rectangle((7, 25, 25, 30), fill=rgba("#4d5c56", 190))
    elif out_index in {14, 22}:
        for k in range(5):
            draw.arc((2 + k * 3, 4, 32 - k, 32 - k * 2), 115, 260, fill=rgba("#ff783e", 180), width=2)
        draw.ellipse((14, 13, 21, 20), fill=rgba("#ffd166", 190))
    elif out_index == 15:
        for step in range(6):
            y = 29 - step * 5
            draw.rectangle((3 + step * 2, y, 29 - step * 2, y + 2), fill=rgba("#d0cfb6", 160))
    elif out_index == 16:
        for x, y, color in ((8, 9, "#ffd36a"), (20, 12, "#f07a5b"), (14, 22, "#f3e38c"), (25, 24, "#ffd36a")):
            draw.ellipse((x - 2, y - 2, x + 2, y + 2), fill=rgba(color, 220))
    elif out_index == 17:
        for k in range(5):
            draw.arc((1 + k * 3, 7 + k, 35, 30), 170, 315, fill=rgba("#6f492f", 145), width=2)
    elif out_index == 18:
        for offset in (-10, 4, 18):
            line(draw, (offset, 31, offset + 24, 1), "#141a1b", 135, 1)
    elif out_index in {19, 27}:
        draw.ellipse((8, 8, 24, 24), outline=rgba("#ffd76a", 170), width=2)
        line(draw, (16, 7, 16, 25), "#6ff0d0", 120, 1)
        line(draw, (7, 16, 25, 16), "#6ff0d0", 120, 1)
    elif out_index == 24:
        for x in (7, 13, 19, 25):
            line(draw, (x, 27, x - 3, 11), "#96d98a", 140, 1)
            line(draw, (x, 27, x + 4, 14), "#6fd8cb", 110, 1)
    elif out_index == 25:
        for x, y in ((7, 12), (17, 8), (23, 21), (12, 25)):
            draw.ellipse((x - 2, y - 2, x + 2, y + 2), fill=rgba("#83ffe0", 150))
    elif out_index == 28:
        for x, y, angle in ((8, 10, 0), (20, 14, 25), (15, 23, -20), (25, 24, 45)):
            draw.ellipse((x - 4, y - 2, x + 4, y + 2), fill=rgba("#d79751", 150))
    elif out_index == 30:
        draw.polygon(((16, 4), (26, 15), (19, 28), (7, 20)), fill=rgba("#7d4130", 170))
        draw.line((16, 6, 18, 26), fill=rgba("#ffbd58", 205), width=2)
        draw.line((9, 19, 25, 15), fill=rgba("#ff713c", 130), width=1)

    return tile


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing Image Gen source: {SOURCE}")

    source = Image.open(SOURCE)
    out = Image.new("RGBA", (COLS * TILE, ROWS * TILE), (0, 0, 0, 0))
    for out_index in range(COLS * ROWS):
        source_index = SOURCE_TO_GAME_INDEX[out_index]
        tile = crop_source_cell(source, source_index)
        tile = polish_tile(tile, out_index)
        out.alpha_composite(tile, ((out_index % COLS) * TILE, (out_index // COLS) * TILE))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
