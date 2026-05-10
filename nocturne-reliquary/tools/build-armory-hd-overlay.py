from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "generated" / "props_imagen_hd_armory_moon_cases.png"
W = 1920
H = 1080
SCALE = 2
RNG = random.Random(5102026)


def sc(value: float) -> int:
    return round(value * SCALE)


def color(c: tuple[int, int, int, int] | tuple[int, int, int]) -> tuple[int, int, int, int]:
    if len(c) == 4:
        return c
    return (c[0], c[1], c[2], 255)


def line(draw: ImageDraw.ImageDraw, pts, fill, width=1) -> None:
    draw.line([(sc(x), sc(y)) for x, y in pts], fill=color(fill), width=sc(width))


def ellipse(draw: ImageDraw.ImageDraw, box, fill=None, outline=None, width=1) -> None:
    draw.ellipse(tuple(sc(v) for v in box), fill=color(fill) if fill else None, outline=color(outline) if outline else None, width=sc(width))


def rect(draw: ImageDraw.ImageDraw, box, fill=None, outline=None, width=1) -> None:
    draw.rectangle(tuple(sc(v) for v in box), fill=color(fill) if fill else None, outline=color(outline) if outline else None, width=sc(width))


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill=None, outline=None, width=1) -> None:
    draw.rounded_rectangle(
        tuple(sc(v) for v in box),
        radius=sc(radius),
        fill=color(fill) if fill else None,
        outline=color(outline) if outline else None,
        width=sc(width),
    )


def polygon(draw: ImageDraw.ImageDraw, pts, fill=None, outline=None) -> None:
    draw.polygon([(sc(x), sc(y)) for x, y in pts], fill=color(fill) if fill else None, outline=color(outline) if outline else None)


def radial_glow(layer: Image.Image, cx: int, cy: int, r: int, inner, outer) -> None:
    pix = layer.load()
    for y in range(max(0, cy - r), min(layer.height, cy + r)):
        for x in range(max(0, cx - r), min(layer.width, cx + r)):
            dx = x - cx
            dy = y - cy
            d = math.sqrt(dx * dx + dy * dy) / max(1, r)
            if d > 1:
                continue
            t = d * d
            col = tuple(round(inner[i] + (outer[i] - inner[i]) * t) for i in range(4))
            dst = pix[x, y]
            a = col[3] / 255
            pix[x, y] = tuple(round(col[i] * a + dst[i] * (1 - a)) for i in range(3)) + (min(255, dst[3] + col[3]),)


def add_noise_texture(img: Image.Image, mask: Image.Image, strength: int = 18) -> None:
    base = img.load()
    m = mask.load()
    for y in range(img.height):
        for x in range(img.width):
            if m[x, y] == 0:
                continue
            r, g, b, a = base[x, y]
            jitter = RNG.randint(-strength, strength)
            base[x, y] = (
                max(0, min(255, r + jitter)),
                max(0, min(255, g + jitter)),
                max(0, min(255, b + jitter)),
                a,
            )


def draw_lunar_astrolabe(draw: ImageDraw.ImageDraw, layer: Image.Image) -> None:
    cx, cy, r = 960, 216, 250

    glow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    radial_glow(glow, sc(cx), sc(cy), sc(r + 80), (238, 176, 74, 70), (12, 8, 10, 0))
    layer.alpha_composite(glow)

    ellipse(draw, (cx - r - 34, cy - r - 34, cx + r + 34, cy + r + 34), fill=(5, 5, 8, 245))
    ellipse(draw, (cx - r - 16, cy - r - 16, cx + r + 16, cy + r + 16), fill=(45, 31, 20, 255), outline=(230, 171, 77, 240), width=7)
    ellipse(draw, (cx - r + 10, cy - r + 10, cx + r - 10, cy + r - 10), fill=(13, 10, 14, 252), outline=(115, 80, 42, 255), width=6)

    for i in range(96):
        a = i * math.tau / 96
        tick = 18 if i % 8 == 0 else 8
        x1 = cx + math.cos(a) * (r - 18)
        y1 = cy + math.sin(a) * (r - 18)
        x2 = cx + math.cos(a) * (r - 18 - tick)
        y2 = cy + math.sin(a) * (r - 18 - tick)
        line(draw, [(x1, y1), (x2, y2)], (192, 132, 59, 190), 2 if i % 8 == 0 else 1)

    for rr, alpha in [(205, 150), (166, 125), (124, 95), (82, 70)]:
        ellipse(draw, (cx - rr, cy - rr, cx + rr, cy + rr), outline=(188, 129, 56, alpha), width=2)

    # A readable crescent moon, but textured and seated inside an astrolabe rather than a flat disk.
    moon_cx, moon_cy, moon_r = cx - 18, cy + 10, 118
    ellipse(draw, (moon_cx - moon_r, moon_cy - moon_r, moon_cx + moon_r, moon_cy + moon_r), fill=(220, 177, 92, 242))
    ellipse(draw, (moon_cx - 16, moon_cy - moon_r - 3, moon_cx + moon_r + 54, moon_cy + moon_r + 3), fill=(16, 11, 15, 246))
    for i in range(42):
        a = RNG.random() * math.tau
        rr = math.sqrt(RNG.random()) * moon_r * 0.86
        x = moon_cx + math.cos(a) * rr
        y = moon_cy + math.sin(a) * rr
        d = 2 + RNG.random() * 7
        ellipse(draw, (x - d, y - d * 0.7, x + d, y + d * 0.7), fill=(145, 99, 45, 46))

    for i in range(16):
        a = i * math.tau / 16 + 0.08
        x = cx + math.cos(a) * 188
        y = cy + math.sin(a) * 188
        ellipse(draw, (x - 5, y - 5, x + 5, y + 5), fill=(239, 189, 92, 210))
        line(draw, [(cx, cy), (x, y)], (121, 82, 42, 84), 1)

    # Top and bottom metal lips hide the old half-disk edge and read like a suspended clock.
    rounded(draw, (cx - 208, cy - 280, cx + 208, cy - 246), 13, fill=(31, 22, 17, 248), outline=(189, 129, 56, 220), width=3)
    rounded(draw, (cx - 180, cy + 244, cx + 180, cy + 276), 13, fill=(31, 22, 17, 248), outline=(189, 129, 56, 220), width=3)


def draw_weapon_case(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, flip: bool = False) -> None:
    rounded(draw, (x - 8, y - 12, x + w + 8, y + h + 12), 8, fill=(22, 13, 8, 252), outline=(162, 112, 56, 245), width=5)
    rounded(draw, (x + 7, y + 11, x + w - 7, y + h - 11), 5, fill=(5, 5, 7, 236), outline=(87, 61, 38, 255), width=3)
    rect(draw, (x + 17, y + 20, x + w - 17, y + h - 20), fill=(12, 15, 16, 210))
    for i in range(6):
        yy = y + 45 + i * (h - 90) / 5
        line(draw, [(x + 17, yy), (x + w - 17, yy + 8)], (88, 67, 45, 110), 1)

    sx = x + (w * 0.35 if not flip else w * 0.65)
    sy = y + 60
    ex = x + (w * 0.74 if not flip else w * 0.26)
    ey = y + h - 86
    line(draw, [(sx, sy), (ex, ey)], (237, 211, 141, 235), 5)
    line(draw, [(sx, sy), (ex, ey)], (255, 244, 188, 210), 2)
    guard_x = sx + (ex - sx) * 0.24
    guard_y = sy + (ey - sy) * 0.24
    line(draw, [(guard_x - 26, guard_y + 22), (guard_x + 26, guard_y - 22)], (174, 117, 55, 230), 4)
    ellipse(draw, (sx - 9, sy - 9, sx + 9, sy + 9), fill=(216, 163, 70, 220))

    # Glass reflections replacing the old flat diagonal marks with real case shine.
    line(draw, [(x + 22, y + 78), (x + w - 25, y + 155)], (239, 218, 158, 92), 3)
    line(draw, [(x + 26, y + h * 0.48), (x + w - 30, y + h * 0.62)], (239, 218, 158, 64), 3)
    line(draw, [(x + w - 20, y + 22), (x + w - 20, y + h - 22)], (255, 218, 137, 44), 2)


def draw_shield_plaque(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, motif: int) -> None:
    rounded(draw, (x, y, x + w, y + h), 10, fill=(32, 18, 10, 250), outline=(205, 147, 66, 235), width=5)
    rounded(draw, (x + 12, y + 16, x + w - 12, y + h - 16), 8, fill=(14, 11, 12, 235), outline=(112, 72, 39, 255), width=3)
    cx = x + w / 2
    cy = y + h * 0.43
    ellipse(draw, (cx - 33, cy - 64, cx + 33, cy + 64), outline=(229, 181, 92, 225), width=5)
    ellipse(draw, (cx - 22, cy - 48, cx + 22, cy + 48), fill=(45, 29, 19, 220), outline=(96, 70, 44, 220), width=2)
    if motif == 0:
        polygon(draw, [(cx, cy - 38), (cx + 22, cy - 3), (cx + 10, cy + 42), (cx - 10, cy + 42), (cx - 22, cy - 3)], fill=(126, 26, 33, 215), outline=(232, 178, 84, 220))
    elif motif == 1:
        line(draw, [(cx - 25, cy + 38), (cx + 25, cy - 42)], (228, 202, 138, 230), 5)
        line(draw, [(cx - 22, cy - 14), (cx + 20, cy + 12)], (172, 115, 55, 230), 4)
    else:
        ellipse(draw, (cx - 24, cy - 24, cx + 24, cy + 24), fill=(73, 82, 119, 210), outline=(229, 181, 92, 225), width=3)
        for i in range(8):
            a = i * math.tau / 8
            line(draw, [(cx, cy), (cx + math.cos(a) * 36, cy + math.sin(a) * 36)], (198, 146, 74, 120), 2)
    rect(draw, (x + 18, y + h - 48, x + w - 18, y + h - 22), fill=(66, 42, 24, 220), outline=(161, 111, 58, 180), width=2)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    layer = Image.new("RGBA", (W * SCALE, H * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    draw_lunar_astrolabe(draw, layer)
    for i, (x, y, w, h, flip) in enumerate([
        (195, 184, 104, 670, False),
        (435, 184, 104, 670, False),
        (1416, 184, 104, 670, True),
        (1670, 184, 104, 670, True),
    ]):
        draw_weapon_case(draw, x, y, w, h, flip)

    for motif, x in enumerate([720, 912, 1116]):
        draw_shield_plaque(draw, x, 330, 112, 305, motif)

    # Slight local shadow shelf to bind the replacement props into the painted room.
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for box in [
        (170, 820, 327, 868),
        (410, 820, 567, 868),
        (1392, 820, 1547, 868),
        (1646, 820, 1804, 868),
        (698, 608, 1250, 666),
    ]:
        rounded(sd, box, 14, fill=(0, 0, 0, 88))
    shadow = shadow.filter(ImageFilter.GaussianBlur(sc(8)))
    layer.alpha_composite(shadow)

    # Repaint key areas are intentionally opaque; the rest stays transparent.
    final = layer.filter(ImageFilter.UnsharpMask(radius=1.0 * SCALE, percent=75, threshold=3))
    final = final.resize((W, H), Image.Resampling.LANCZOS)
    final.save(OUT, optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
