from __future__ import annotations

import math
from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "backgrounds" / "topdown_beach_repeatable_hd.png"
OUT_SIZE = (3072, 2048)
RNG = Random(1711)


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def mix_color(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t))


def periodic_noise(size: tuple[int, int]) -> Image.Image:
    w, h = size
    waves = [
        (RNG.randint(1, 7), RNG.randint(0, 5), RNG.random() * math.tau, RNG.uniform(0.22, 0.55))
        for _ in range(26)
    ]
    amp = sum(abs(wave[3]) for wave in waves)
    low = Image.new("RGB", size)
    pixels = low.load()

    dark = (184, 142, 72)
    mid = (214, 172, 88)
    light = (239, 203, 126)

    for y in range(h):
        for x in range(w):
            value = 0.0
            for kx, ky, phase, strength in waves:
                value += math.sin(math.tau * (kx * x / w + ky * y / h) + phase) * strength
            n = (value / amp + 1.0) * 0.5
            n = max(0.0, min(1.0, n))
            base = mix_color(dark, mid, min(1.0, n * 1.25))
            pixels[x, y] = mix_color(base, light, max(0.0, (n - 0.58) * 1.6))

    resample = getattr(Image, "Resampling", Image).BICUBIC
    return low.resize(OUT_SIZE, resample).filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=3))


def draw_wrapped(draw: ImageDraw.ImageDraw, size: tuple[int, int], bounds, callback) -> None:
    w, h = size
    x0, y0, x1, y1 = bounds
    pad = max(x1 - x0, y1 - y0, 20)
    for ox in (-w, 0, w):
        for oy in (-h, 0, h):
            moved = (x0 + ox, y0 + oy, x1 + ox, y1 + oy)
            if moved[2] >= -pad and moved[0] <= w + pad and moved[3] >= -pad and moved[1] <= h + pad:
                callback(draw, moved)


def add_sand_strokes(overlay: Image.Image) -> None:
    draw = ImageDraw.Draw(overlay)
    w, h = overlay.size
    for _ in range(980):
        x = RNG.randrange(w)
        y = RNG.randrange(h)
        length = RNG.randint(26, 96)
        angle = RNG.uniform(-0.42, 0.18)
        dx = math.cos(angle) * length
        dy = math.sin(angle) * length * 0.5
        width = RNG.choice([1, 1, 1, 2])
        color = RNG.choice([(255, 237, 170, 22), (126, 91, 44, 18), (240, 210, 130, 24)])

        def stroke(d, box):
            x0, y0, x1, y1 = box
            d.line((x0, y0, x1, y1), fill=color, width=width)

        draw_wrapped(draw, overlay.size, (x, y, x + dx, y + dy), stroke)


def add_tidepools(overlay: Image.Image) -> None:
    draw = ImageDraw.Draw(overlay)
    w, h = overlay.size
    for _ in range(22):
        x = RNG.randrange(w)
        y = RNG.randrange(h)
        rw = RNG.randint(70, 190)
        rh = RNG.randint(34, 90)
        tint = RNG.choice([(59, 164, 164, 70), (82, 190, 175, 58), (54, 139, 163, 55)])
        foam = [(RNG.uniform(-0.55, 0.55), RNG.uniform(-0.42, 0.42)) for _ in range(5)]

        def pool(d, box):
            x0, y0, x1, y1 = box
            d.ellipse(box, fill=tint)
            inner = (x0 + rw * 0.35, y0 + rh * 0.25, x1 - rw * 0.35, y1 - rh * 0.25)
            d.ellipse(inner, fill=(29, 118, 126, 42))
            for foam_x, foam_y in foam:
                off_x = foam_x * rw
                off_y = foam_y * rh
                arc = (
                    (x0 + x1) * 0.5 + off_x - rw * 0.38,
                    (y0 + y1) * 0.5 + off_y - rh * 0.28,
                    (x0 + x1) * 0.5 + off_x + rw * 0.38,
                    (y0 + y1) * 0.5 + off_y + rh * 0.28,
                )
                d.arc(arc, 195, 350, fill=(242, 255, 228, 92), width=2)

        draw_wrapped(draw, overlay.size, (x - rw, y - rh, x + rw, y + rh), pool)


def add_beach_litter(overlay: Image.Image) -> None:
    draw = ImageDraw.Draw(overlay)
    w, h = overlay.size

    for _ in range(850):
        x = RNG.randrange(w)
        y = RNG.randrange(h)
        r = RNG.randint(2, 8)
        color = RNG.choice(
            [
                (88, 79, 62, 82),
                (132, 116, 83, 76),
                (194, 174, 122, 70),
                (70, 102, 82, 62),
                (221, 207, 161, 60),
            ]
        )

        def pebble(d, box):
            d.ellipse((box[0] + 2, box[1] + 2, box[2] + 2, box[3] + 2), fill=(72, 54, 35, 24))
            d.ellipse(box, fill=color)

        draw_wrapped(draw, overlay.size, (x - r, y - r, x + r + RNG.randint(0, 5), y + r), pebble)

    for _ in range(86):
        x = RNG.randrange(w)
        y = RNG.randrange(h)
        s = RNG.randint(9, 19)
        color = RNG.choice([(241, 218, 167, 128), (221, 153, 103, 108), (252, 235, 190, 116)])

        def shell(d, box):
            x0, y0, x1, y1 = box
            mx = (x0 + x1) / 2
            by = y1
            d.arc(box, 198, 342, fill=color, width=2)
            for i in (-0.36, -0.12, 0.12, 0.36):
                d.line((mx, by, mx + i * (x1 - x0), y0 + 2), fill=color, width=1)

        draw_wrapped(draw, overlay.size, (x - s, y - s, x + s, y + s), shell)

    for _ in range(24):
        x = RNG.randrange(w)
        y = RNG.randrange(h)
        s = RNG.randint(15, 27)

        def starfish(d, box):
            x0, y0, x1, y1 = box
            cx = (x0 + x1) / 2
            cy = (y0 + y1) / 2
            for angle in (0, 72, 144, 216, 288):
                dx = math.cos(math.radians(angle)) * (x1 - x0) * 0.42
                dy = math.sin(math.radians(angle)) * (y1 - y0) * 0.42
                d.line((cx, cy, cx + dx, cy + dy), fill=(186, 99, 56, 112), width=4)
            d.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=(235, 169, 89, 115))

        draw_wrapped(draw, overlay.size, (x - s, y - s, x + s, y + s), starfish)


def main() -> None:
    tile = periodic_noise((384, 256)).convert("RGBA")
    overlay = Image.new("RGBA", OUT_SIZE, (0, 0, 0, 0))
    add_sand_strokes(overlay)
    add_tidepools(overlay)
    add_beach_litter(overlay)
    tile = Image.alpha_composite(tile, overlay).convert("RGB")
    tile.save(OUT, optimize=True)
    print(f"wrote {OUT} {tile.size[0]}x{tile.size[1]}")


if __name__ == "__main__":
    main()
