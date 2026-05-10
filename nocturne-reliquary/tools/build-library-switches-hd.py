from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "generated" / "props_imagen_hd_library_switches.png"
FRAME = 256
COLS = 3
ROWS = 3
SCALE = 3
RNG = random.Random(5102027)
GLYPHS = ["I", "II", "III"]
COLORS = [(244, 211, 139), (139, 215, 255), (191, 160, 255)]


def sc(value: float) -> int:
    return round(value * SCALE)


def rgba(c, a=255):
    return (c[0], c[1], c[2], a)


def line(draw: ImageDraw.ImageDraw, pts, fill, width=1) -> None:
    draw.line([(sc(x), sc(y)) for x, y in pts], fill=fill, width=sc(width))


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill=None, outline=None, width=1) -> None:
    draw.rounded_rectangle(
        tuple(sc(v) for v in box),
        radius=sc(radius),
        fill=fill,
        outline=outline,
        width=sc(width),
    )


def ellipse(draw: ImageDraw.ImageDraw, box, fill=None, outline=None, width=1) -> None:
    draw.ellipse(tuple(sc(v) for v in box), fill=fill, outline=outline, width=sc(width))


def polygon(draw: ImageDraw.ImageDraw, pts, fill=None, outline=None) -> None:
    draw.polygon([(sc(x), sc(y)) for x, y in pts], fill=fill, outline=outline)


def draw_roman(draw: ImageDraw.ImageDraw, glyph: str, cx: float, cy: float, color, active: bool) -> None:
    count = len(glyph)
    spacing = 18 if count == 3 else 21
    start = cx - (count - 1) * spacing / 2
    glow = 210 if active else 130
    for i in range(count):
        x = start + i * spacing
        line(draw, [(x, cy - 31), (x, cy + 34)], rgba(color, glow), 6)
        line(draw, [(x, cy - 31), (x, cy + 34)], (255, 245, 202, 200 if active else 130), 2)
        line(draw, [(x - 9, cy - 31), (x + 9, cy - 31)], rgba(color, glow), 3)
        line(draw, [(x - 9, cy + 34), (x + 9, cy + 34)], rgba(color, glow), 3)


def draw_switch(col: int, row: int) -> Image.Image:
    glyph = GLYPHS[col]
    accent = COLORS[col]
    active = row == 1
    expected = row == 2

    img = Image.new("RGBA", (FRAME * SCALE, FRAME * SCALE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if active or expected:
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        for radius, alpha in [(104, 34 if active else 48), (72, 52 if active else 72), (42, 65 if active else 95)]:
            ellipse(gd, (128 - radius, 118 - radius, 128 + radius, 118 + radius), fill=rgba(accent, alpha))
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(sc(9))))

    # Wall shadow and back plate.
    ellipse(d, (43, 50, 213, 224), fill=(0, 0, 0, 86))
    polygon(d, [(128, 18), (205, 82), (190, 202), (128, 238), (66, 202), (51, 82)], fill=(18, 12, 13, 246), outline=(180, 126, 61, 230))
    polygon(d, [(128, 31), (191, 86), (178, 193), (128, 223), (78, 193), (65, 86)], fill=(43, 28, 19, 242), outline=(227, 171, 80, 230))
    polygon(d, [(128, 45), (175, 91), (166, 181), (128, 207), (90, 181), (81, 91)], fill=(8, 8, 12, 246), outline=(98, 68, 42, 245))

    # Library folio / metal hinge detail.
    rounded(d, (92, 70, 164, 188), 10, fill=(18, 15, 13, 232), outline=(124, 85, 45, 225), width=3)
    line(d, [(128, 72), (128, 186)], (88, 60, 36, 200), 2)
    for yy in [88, 111, 134, 157]:
        line(d, [(103, yy), (121, yy + RNG.randint(-2, 2))], (84, 64, 47, 135), 1)
        line(d, [(135, yy), (153, yy + RNG.randint(-2, 2))], (84, 64, 47, 135), 1)

    # Central crystal button.
    crystal = [
        (128, 76),
        (158, 112),
        (146, 166),
        (128, 190),
        (110, 166),
        (98, 112),
    ]
    fill = rgba(accent, 218 if active or expected else 116)
    polygon(d, crystal, fill=fill, outline=(245, 223, 166, 226 if active or expected else 150))
    line(d, [(128, 80), (128, 187)], (255, 247, 212, 96 if active or expected else 42), 2)
    line(d, [(101, 113), (155, 113)], (255, 247, 212, 72 if active or expected else 35), 1)

    draw_roman(d, glyph, 128, 133, accent, active or expected)

    # Bottom pull tongue replaces the old thin vertical rectangle.
    rounded(d, (111, 189, 145, 228), 7, fill=(36, 24, 16, 245), outline=(185, 130, 62, 210), width=3)
    ellipse(d, (119, 198, 137, 216), fill=(15, 12, 12, 230), outline=(224, 170, 81, 195), width=2)

    if expected:
        for i in range(8):
            a = i * math.tau / 8
            x1 = 128 + math.cos(a) * 74
            y1 = 125 + math.sin(a) * 74
            x2 = 128 + math.cos(a) * 91
            y2 = 125 + math.sin(a) * 91
            line(d, [(x1, y1), (x2, y2)], rgba(accent, 150), 2)

    # Tiny patina and chipped edge noise.
    px = img.load()
    for _ in range(850):
        x = RNG.randrange(sc(56), sc(201))
        y = RNG.randrange(sc(34), sc(229))
        r, g, b, a = px[x, y]
        if a <= 0:
            continue
        j = RNG.randint(-18, 20)
        px[x, y] = (max(0, min(255, r + j)), max(0, min(255, g + j)), max(0, min(255, b + j)), a)

    img = img.filter(ImageFilter.UnsharpMask(radius=SCALE * 0.8, percent=75, threshold=3))
    return img.resize((FRAME, FRAME), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (FRAME * COLS, FRAME * ROWS), (0, 0, 0, 0))
    for row in range(ROWS):
        for col in range(COLS):
            sheet.alpha_composite(draw_switch(col, row), (col * FRAME, row * FRAME))
    sheet.save(OUT, optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
