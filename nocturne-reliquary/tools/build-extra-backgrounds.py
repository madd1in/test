"""Procedural backgrounds for the three new rooms.

Generates:
  bg_gothic_library.png   - Forgotten Library (towering bookshelves)
  bg_gothic_cavern.png    - Crystal Cavern (jagged blue crystals)
  bg_gothic_belltower.png - Sunken Belltower (huge bell + chains)

Each is 1440x720, matching the existing background scale used by
drawCover() in game.js.
"""

from __future__ import annotations

import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "assets" / "generated"
W = 1440
H = 720
RNG = random.Random(2026_05_08)


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def base_gradient(top, bottom, noise=5):
    img = Image.new("RGB", (W, H), top)
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        col = mix(top, bottom, t)
        for x in range(W):
            n = RNG.randint(-noise, noise)
            px[x, y] = tuple(max(0, min(255, c + n)) for c in col)
    return img.filter(ImageFilter.GaussianBlur(radius=0.4))


def brick_wall(d, y0, y1, palette, brick_w=54, brick_h=24):
    for row, y in enumerate(range(y0, y1, brick_h)):
        offset = 0 if row % 2 == 0 else brick_w // 2
        for x in range(-offset, W, brick_w):
            shade = palette[(row + x // brick_w) % len(palette)]
            jitter = RNG.randint(-9, 9)
            col = tuple(max(0, min(255, c + jitter)) for c in shade)
            d.rectangle((x, y, x + brick_w - 2, y + brick_h - 2), fill=col)
            d.line((x, y + brick_h - 2, x + brick_w - 2, y + brick_h - 2), fill=(9, 8, 11))


def floor_panel(d, y, color):
    d.rectangle((0, y, W, H), fill=(15, 14, 18))
    for yy in range(y, H, 34):
        d.line((0, yy, W, yy), fill=(49, 45, 50))
    for x in range(0, W, 96):
        d.line((x, y, x - 32, H), fill=(32, 30, 34))
        d.rectangle((x + 8, y + 8, x + 82, y + 22), fill=color)


def column(d, x, y0, y1, tint):
    d.rectangle((x - 28, y0, x + 28, y1), fill=(23, 22, 28))
    for dx, light in [(-24, 0.55), (-12, 0.78), (12, 0.48), (24, 0.3)]:
        col = mix((8, 8, 11), tint, light)
        d.rectangle((x + dx - 4, y0, x + dx + 4, y1), fill=col)
    for y in range(y0 + 30, y1, 66):
        d.rectangle((x - 34, y, x + 34, y + 8), fill=(70, 61, 64))
    d.rectangle((x - 46, y0 - 18, x + 46, y0), fill=(71, 61, 64))


# ===================== Forgotten Library =====================

def bookshelf(d, x0, y0, x1, y1, palette):
    d.rectangle((x0, y0, x1, y1), fill=(30, 22, 16))
    # vertical sides
    d.rectangle((x0, y0, x0 + 8, y1), fill=(58, 38, 22))
    d.rectangle((x1 - 8, y0, x1, y1), fill=(58, 38, 22))
    # shelves
    rows = 5
    rh = (y1 - y0) // rows
    for r in range(rows):
        sy = y0 + r * rh
        d.rectangle((x0 + 8, sy + rh - 8, x1 - 8, sy + rh - 2), fill=(82, 56, 32))
        d.line((x0 + 8, sy + rh - 8, x1 - 8, sy + rh - 8), fill=(132, 92, 56))
        # books on this shelf
        bx = x0 + 12
        while bx < x1 - 14:
            book_w = RNG.randint(8, 18)
            book_h = rh - 14
            color = palette[RNG.randint(0, len(palette) - 1)]
            jitter = RNG.randint(-12, 12)
            col = tuple(max(0, min(255, c + jitter)) for c in color)
            top_pad = RNG.randint(0, 4)
            d.rectangle((bx, sy + 4 + top_pad, bx + book_w - 1, sy + 4 + book_h), fill=col)
            d.rectangle((bx, sy + 4 + top_pad, bx + book_w - 1, sy + 4 + top_pad + 3), fill=(20, 16, 12))
            # gold band
            if RNG.random() < 0.35:
                d.line((bx + 1, sy + 12 + top_pad, bx + book_w - 2, sy + 12 + top_pad), fill=(178, 138, 64))
            bx += book_w + RNG.randint(0, 2)


def library():
    img = base_gradient((22, 16, 10), (8, 6, 8))
    d = ImageDraw.Draw(img)
    brick_wall(d, 0, 100, [(28, 22, 18), (38, 30, 22), (22, 16, 12)])
    book_palette = [
        (122, 36, 38), (38, 56, 110), (54, 92, 60), (138, 92, 38),
        (84, 28, 92), (32, 60, 70), (110, 60, 30), (18, 38, 60),
    ]
    # Two tall bookshelf walls in mid-range
    bookshelf(d, 60, 120, 380, 600, book_palette)
    bookshelf(d, 420, 80, 720, 600, book_palette)
    bookshelf(d, 760, 120, 1060, 600, book_palette)
    bookshelf(d, 1100, 80, 1380, 600, book_palette)
    # Reading stand in front of center shelf
    d.rectangle((660, 540, 780, 580), fill=(46, 26, 14))
    d.polygon([(660, 540), (720, 510), (780, 540)], fill=(64, 38, 20))
    # Open book on the stand
    d.polygon([(680, 510), (720, 514), (760, 510), (760, 540), (720, 544), (680, 540)],
              fill=(232, 224, 198), outline=(80, 60, 30))
    d.line((720, 514, 720, 544), fill=(120, 88, 48), width=2)
    # Hanging chandelier-like floating tomes
    for x in (240, 600, 960, 1320):
        for layer in range(3):
            sx = x + RNG.randint(-12, 12)
            sy = 50 + layer * 16 + RNG.randint(-4, 4)
            d.rectangle((sx - 12, sy, sx + 12, sy + 6), fill=(140, 100, 36))
            d.rectangle((sx - 12, sy + 6, sx + 12, sy + 14), fill=(60, 40, 22))
            d.line((x, 0, sx, sy), fill=(80, 60, 30))
    # Dust motes
    for _ in range(120):
        mx = RNG.randint(0, W)
        my = RNG.randint(80, 600)
        d.ellipse((mx, my, mx + 2, my + 2), fill=(180, 158, 110))
    # Floor with rug strip
    floor_panel(d, 600, (88, 60, 30))
    d.rectangle((180, 612, W - 180, 700), fill=(72, 32, 32))
    d.rectangle((200, 624, W - 200, 688), fill=(98, 46, 44))
    for x in range(220, W - 200, 48):
        d.line((x, 624, x, 688), fill=(132, 78, 60))
    return img


# ===================== Crystal Cavern =====================

def crystal(d, base_x, base_y, height, width, top_color, mid_color, edge_color):
    tip_x = base_x + RNG.randint(-width // 4, width // 4)
    tip_y = base_y - height
    poly = [
        (base_x - width // 2, base_y),
        (tip_x - width // 6, tip_y + height // 4),
        (tip_x, tip_y),
        (tip_x + width // 6, tip_y + height // 4),
        (base_x + width // 2, base_y),
    ]
    d.polygon(poly, fill=mid_color, outline=edge_color)
    # bright facet
    d.polygon([poly[0], poly[1], poly[2], (base_x, base_y)], fill=top_color)
    # tiny sparkle
    d.ellipse((tip_x - 2, tip_y, tip_x + 2, tip_y + 4), fill=(255, 255, 255))


def cavern():
    img = base_gradient((10, 22, 32), (4, 8, 14))
    d = ImageDraw.Draw(img)
    # Cave walls (rough rocks)
    for y0 in range(0, 600, 60):
        for x0 in range(-30, W, 90):
            jitter = RNG.randint(-12, 12)
            col = mix((22, 30, 40), (44, 56, 70), RNG.random())
            col = tuple(max(0, min(255, c + jitter)) for c in col)
            poly = [
                (x0 + RNG.randint(-8, 8), y0),
                (x0 + 90 + RNG.randint(-8, 8), y0 + 6),
                (x0 + 90 + RNG.randint(-8, 8), y0 + 60),
                (x0 + RNG.randint(-8, 8), y0 + 60),
            ]
            d.polygon(poly, fill=col)
    # Stalactites from ceiling
    for x in range(40, W, 90):
        h = RNG.randint(30, 90)
        d.polygon([
            (x - 12, 0), (x + 12, 0), (x + RNG.randint(-4, 4), h)
        ], fill=(38, 50, 62), outline=(20, 28, 40))
    # Glowing crystals across the floor + walls
    palette = [
        ((180, 230, 255), (66, 122, 200), (120, 170, 230)),    # cyan
        ((232, 200, 255), (122, 80, 180), (180, 140, 220)),    # violet
        ((150, 240, 220), (40, 130, 110), (110, 200, 180)),    # teal
    ]
    for _ in range(38):
        x = RNG.randint(40, W - 40)
        y = RNG.randint(420, 620)
        h = RNG.randint(80, 220)
        w = RNG.randint(28, 56)
        top, mid, edge = palette[RNG.randint(0, len(palette) - 1)]
        crystal(d, x, y, h, w, top, mid, edge)
    # Smaller cluster on ceiling
    for _ in range(22):
        x = RNG.randint(40, W - 40)
        y = RNG.randint(20, 110)
        h = -RNG.randint(50, 130)
        w = RNG.randint(20, 40)
        top, mid, edge = palette[RNG.randint(0, len(palette) - 1)]
        # invert for ceiling
        d.polygon([
            (x - w // 2, y),
            (x, y - h),
            (x + w // 2, y),
        ], fill=mid, outline=edge)
    # Glow halo overlay
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for cx, cy, r, color in [
        (320, 540, 180, (90, 200, 255, 80)),
        (760, 480, 220, (170, 100, 240, 70)),
        (1180, 560, 160, (90, 220, 200, 80)),
    ]:
        gd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=40))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    # Floor pool reflection
    d = ImageDraw.Draw(img)
    d.rectangle((0, 620, W, H), fill=(8, 14, 22))
    for y in range(620, H, 6):
        d.line((0, y, W, y), fill=(20, 36, 56) if (y // 6) % 2 == 0 else (12, 22, 36))
    return img


# ===================== Sunken Belltower =====================

def belltower():
    img = base_gradient((20, 18, 16), (6, 6, 8))
    d = ImageDraw.Draw(img)
    brick_wall(d, 0, 600, [(38, 32, 28), (52, 44, 38), (28, 24, 22)])
    # Vertical chain ropes hanging from ceiling
    for x in [220, 460, 720, 980, 1240]:
        d.line((x, 0, x, 470), fill=(72, 60, 40), width=4)
        d.line((x + 1, 0, x + 1, 470), fill=(40, 32, 22), width=2)
        # chain links every 22 px
        for cy in range(20, 470, 22):
            d.ellipse((x - 5, cy - 4, x + 5, cy + 4), outline=(150, 120, 70), width=2)
    # The Great Bell — center mass
    cx = W // 2
    bell_top_y = 200
    bell_bot_y = 470
    # Dome top
    d.pieslice((cx - 200, bell_top_y - 60, cx + 200, bell_top_y + 100), 180, 360,
               fill=(112, 84, 36), outline=(30, 22, 12))
    # Body
    d.polygon([
        (cx - 200, bell_top_y + 40),
        (cx + 200, bell_top_y + 40),
        (cx + 235, bell_bot_y),
        (cx - 235, bell_bot_y),
    ], fill=(152, 110, 50), outline=(28, 20, 12))
    # Body shading
    d.polygon([
        (cx - 200, bell_top_y + 40),
        (cx - 60, bell_top_y + 40),
        (cx - 80, bell_bot_y),
        (cx - 235, bell_bot_y),
    ], fill=(118, 84, 36))
    # Highlight strip
    d.polygon([
        (cx - 70, bell_top_y + 50),
        (cx - 30, bell_top_y + 50),
        (cx - 40, bell_bot_y - 8),
        (cx - 80, bell_bot_y - 8),
    ], fill=(202, 158, 84))
    # Bell rim
    d.rectangle((cx - 245, bell_bot_y - 8, cx + 245, bell_bot_y + 14), fill=(94, 70, 30))
    d.line((cx - 245, bell_bot_y + 14, cx + 245, bell_bot_y + 14), fill=(28, 20, 12))
    # Cracks across the bell (it's ancient)
    for crack in [
        [(cx - 80, bell_top_y + 60), (cx - 50, bell_top_y + 140), (cx - 70, bell_top_y + 220)],
        [(cx + 40, bell_top_y + 80), (cx + 60, bell_top_y + 180), (cx + 30, bell_top_y + 240)],
    ]:
        d.line(crack, fill=(28, 18, 8), width=3)
    # Clapper inside
    d.line((cx, bell_top_y + 80, cx, bell_bot_y + 26), fill=(50, 38, 20), width=4)
    d.ellipse((cx - 14, bell_bot_y + 18, cx + 14, bell_bot_y + 46), fill=(36, 28, 16))
    # Side towers/arches
    column(d, 90, 80, 600, (110, 90, 60))
    column(d, W - 90, 80, 600, (110, 90, 60))
    # Distant smaller bells
    for sx in [340, W - 340]:
        d.pieslice((sx - 30, 320, sx + 30, 380), 180, 360, fill=(80, 62, 32))
        d.rectangle((sx - 32, 360, sx + 32, 380), fill=(64, 50, 26))
        d.line((sx, 240, sx, 320), fill=(50, 40, 24), width=2)
    # Floor with debris
    d.rectangle((0, 600, W, H), fill=(14, 12, 14))
    for x in range(0, W, 48):
        d.line((x, 600, x - 26, H), fill=(34, 28, 30))
    # Cracked stone debris
    for _ in range(40):
        rx = RNG.randint(0, W)
        ry = RNG.randint(610, H - 10)
        size = RNG.randint(4, 14)
        d.rectangle((rx, ry, rx + size, ry + size // 2), fill=(58, 48, 42))
    return img


# ===================== Entry =====================

def main():
    GEN.mkdir(parents=True, exist_ok=True)
    assets = {
        "bg_gothic_library.png": library(),
        "bg_gothic_cavern.png": cavern(),
        "bg_gothic_belltower.png": belltower(),
    }
    for name, im in assets.items():
        im.convert("RGB").save(GEN / name)
        print(f"Wrote {GEN / name}")


if __name__ == "__main__":
    main()
