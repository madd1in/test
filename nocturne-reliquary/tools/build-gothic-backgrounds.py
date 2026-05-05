from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "assets" / "generated"
W = 1440
H = 720
RNG = random.Random(5212026)


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def base_gradient(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (W, H), top)
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        col = mix(top, bottom, t)
        for x in range(W):
            noise = RNG.randint(-5, 5)
            px[x, y] = tuple(max(0, min(255, c + noise)) for c in col)
    return img.filter(ImageFilter.GaussianBlur(radius=0.35))


def brick_wall(draw: ImageDraw.ImageDraw, y0: int, y1: int, palette: list[tuple[int, int, int]]) -> None:
    brick_w = 54
    brick_h = 24
    for row, y in enumerate(range(y0, y1, brick_h)):
        offset = 0 if row % 2 == 0 else brick_w // 2
        for x in range(-offset, W, brick_w):
            shade = palette[(row + x // brick_w) % len(palette)]
            jitter = RNG.randint(-9, 9)
            col = tuple(max(0, min(255, c + jitter)) for c in shade)
            draw.rectangle((x, y, x + brick_w - 2, y + brick_h - 2), fill=col)
            draw.line((x, y + brick_h - 2, x + brick_w - 2, y + brick_h - 2), fill=(9, 8, 11))
            draw.line((x + brick_w - 2, y, x + brick_w - 2, y + brick_h - 2), fill=(8, 7, 10))


def floor(draw: ImageDraw.ImageDraw, y: int, color: tuple[int, int, int]) -> None:
    draw.rectangle((0, y, W, H), fill=(15, 14, 18))
    for yy in range(y, H, 34):
        draw.line((0, yy, W, yy), fill=(49, 45, 50))
    for x in range(0, W, 96):
        draw.line((x, y, x - 32, H), fill=(32, 30, 34))
        draw.rectangle((x + 8, y + 8, x + 82, y + 22), fill=color)
        draw.line((x + 8, y + 8, x + 82, y + 8), fill=(114, 108, 102))


def column(draw: ImageDraw.ImageDraw, x: int, y0: int, y1: int, tint: tuple[int, int, int]) -> None:
    draw.rectangle((x - 28, y0, x + 28, y1), fill=(23, 22, 28))
    for dx, light in [(-24, 0.55), (-12, 0.78), (12, 0.48), (24, 0.3)]:
        col = mix((8, 8, 11), tint, light)
        draw.rectangle((x + dx - 4, y0, x + dx + 4, y1), fill=col)
    for y in range(y0 + 30, y1, 66):
        draw.rectangle((x - 34, y, x + 34, y + 8), fill=(70, 61, 64))
        draw.line((x - 34, y, x + 34, y), fill=(128, 113, 98))
    draw.rectangle((x - 46, y0 - 18, x + 46, y0), fill=(71, 61, 64))
    draw.rectangle((x - 54, y1, x + 54, y1 + 18), fill=(61, 54, 59))


def arch(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, accent: tuple[int, int, int]) -> None:
    bbox = (x, y, x + w, y + h * 2)
    draw.pieslice(bbox, 180, 360, fill=(45, 40, 48), outline=(110, 96, 84), width=4)
    draw.rectangle((x, y + h, x + 18, y + h * 2), fill=(45, 40, 48))
    draw.rectangle((x + w - 18, y + h, x + w, y + h * 2), fill=(45, 40, 48))
    inner = (x + 22, y + 24, x + w - 22, y + h * 2 + 2)
    draw.pieslice(inner, 180, 360, fill=(7, 7, 11))
    draw.rectangle((x + 22, y + h, x + w - 22, y + h * 2 + 2), fill=(7, 7, 11))
    draw.line((x + 25, y + h * 2, x + w - 25, y + h * 2), fill=accent, width=3)


def stained_window(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, colors: list[tuple[int, int, int]]) -> None:
    draw.rounded_rectangle((x, y + 24, x + w, y + h), radius=10, fill=(8, 8, 14), outline=(90, 83, 86), width=3)
    draw.pieslice((x, y, x + w, y + w), 180, 360, fill=(8, 8, 14), outline=(90, 83, 86), width=3)
    pane_w = max(8, w // 4)
    for i in range(4):
        col = colors[i % len(colors)]
        draw.rectangle((x + 7 + i * pane_w, y + 34, x + 7 + (i + 1) * pane_w - 3, y + h - 8), fill=col)
    for i in range(1, 4):
        draw.line((x + i * pane_w, y + 28, x + i * pane_w, y + h - 4), fill=(16, 16, 25), width=3)
    draw.line((x + 8, y + h // 2, x + w - 8, y + h // 2), fill=(16, 16, 25), width=3)


def chandelier(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float = 1.0) -> None:
    length = round(120 * scale)
    draw.line((x, 0, x, y), fill=(91, 72, 48), width=max(1, round(3 * scale)))
    draw.ellipse((x - 12, y - 8, x + 12, y + 8), fill=(126, 90, 39))
    for side in [-1, 1]:
        for i in range(4):
            arm = round((28 + i * 22) * scale)
            yy = y + round(i * 5 * scale)
            draw.arc((x - arm, yy - 16, x + arm, yy + 28), 200 if side < 0 else -20, 260 if side < 0 else 80, fill=(128, 88, 42), width=2)
            flame_x = x + side * arm
            flame_y = yy + round(12 * scale)
            draw.ellipse((flame_x - 5, flame_y - 12, flame_x + 5, flame_y + 5), fill=(235, 158, 50))
            draw.ellipse((flame_x - 2, flame_y - 9, flame_x + 2, flame_y + 2), fill=(255, 230, 136))
    draw.line((x - length, y + 28, x + length, y + 28), fill=(100, 73, 44), width=2)


def moon(draw: ImageDraw.ImageDraw, x: int, y: int, r: int) -> None:
    draw.ellipse((x - r, y - r, x + r, y + r), fill=(205, 218, 232))
    draw.ellipse((x - r // 3, y - r, x + r + r // 2, y + r), fill=(19, 24, 42))


def hall() -> Image.Image:
    img = base_gradient((18, 12, 18), (7, 6, 10))
    d = ImageDraw.Draw(img)
    brick_wall(d, 0, 610, [(33, 30, 39), (41, 37, 48), (25, 25, 32)])
    for x in [115, 375, 675, 965, 1230]:
        arch(d, x - 82, 150, 164, 196, (130, 74, 53))
        stained_window(d, x - 32, 188, 64, 210, [(88, 30, 45), (38, 43, 96), (168, 119, 53)])
    for x in [210, 520, 820, 1120, 1360]:
        column(d, x, 92, 612, (103, 92, 100))
    chandelier(d, 720, 112, 1.2)
    floor(d, 600, (70, 62, 61))
    return img


def stairs() -> Image.Image:
    img = base_gradient((12, 14, 24), (6, 6, 10))
    d = ImageDraw.Draw(img)
    brick_wall(d, 0, 610, [(28, 31, 44), (36, 36, 52), (22, 24, 34)])
    moon(d, 1150, 92, 42)
    for x in [125, 372, 1030, 1280]:
        stained_window(d, x, 120, 70, 260, [(44, 68, 128), (91, 52, 122), (157, 65, 48)])
    for i in range(15):
        x0 = 170 + i * 54
        y0 = 570 - i * 26
        d.rectangle((x0, y0, x0 + 108, y0 + 22), fill=(72, 66, 71))
        d.line((x0, y0, x0 + 108, y0), fill=(134, 120, 102))
    for i in range(13):
        x0 = 1030 - i * 48
        y0 = 585 - i * 24
        d.rectangle((x0, y0, x0 + 100, y0 + 20), fill=(61, 58, 66))
        d.line((x0, y0, x0 + 100, y0), fill=(120, 110, 100))
    for x in [300, 720, 1160]:
        chandelier(d, x, 130, 0.8)
    floor(d, 610, (62, 61, 70))
    return img


def dungeon() -> Image.Image:
    img = base_gradient((10, 19, 23), (4, 7, 9))
    d = ImageDraw.Draw(img)
    brick_wall(d, 0, 620, [(21, 33, 35), (28, 41, 42), (17, 26, 29)])
    for x in [130, 380, 635, 900, 1175]:
        arch(d, x - 70, 175, 140, 178, (56, 115, 93))
        d.rectangle((x - 38, 270, x + 38, 495), fill=(5, 8, 9))
        for bar in range(-30, 36, 15):
            d.line((x + bar, 275, x + bar, 492), fill=(60, 77, 78), width=3)
    for x in [245, 505, 765, 1035, 1320]:
        column(d, x, 90, 620, (70, 88, 83))
    for x in [80, 1290]:
        d.rectangle((x, 445, x + 42, 580), fill=(87, 60, 34))
        d.ellipse((x - 13, 415, x + 55, 470), fill=(182, 93, 36))
        d.ellipse((x + 6, 425, x + 37, 460), fill=(255, 185, 72))
    floor(d, 602, (42, 61, 61))
    return img


def cathedral() -> Image.Image:
    img = base_gradient((23, 9, 18), (7, 5, 9))
    d = ImageDraw.Draw(img)
    brick_wall(d, 0, 600, [(40, 29, 40), (52, 36, 46), (30, 24, 32)])
    for x in [180, 430, 1010, 1250]:
        stained_window(d, x, 90, 86, 330, [(145, 35, 58), (58, 46, 123), (202, 131, 57)])
    arch(d, 575, 95, 290, 235, (175, 53, 47))
    d.rectangle((645, 365, 795, 600), fill=(12, 7, 11))
    d.rectangle((670, 430, 770, 600), fill=(84, 26, 32))
    for x in [110, 325, 535, 905, 1120, 1350]:
        column(d, x, 68, 605, (111, 91, 97))
    for x in [300, 720, 1140]:
        chandelier(d, x, 120, 1.0)
    for i in range(8):
        y = 600 - i * 14
        d.rectangle((560 + i * 18, y, 880 - i * 18, y + 13), fill=(64, 39, 42))
        d.line((560 + i * 18, y, 880 - i * 18, y), fill=(146, 103, 68))
    floor(d, 610, (61, 48, 52))
    return img


def sharpen_pixel_edges(img: Image.Image) -> Image.Image:
    small = img.resize((W // 2, H // 2), Image.Resampling.BILINEAR)
    up = small.resize((W, H), Image.Resampling.NEAREST)
    return Image.blend(img, up, 0.18)


def main() -> None:
    GEN.mkdir(parents=True, exist_ok=True)
    assets = {
        "bg_gothic_hall.png": hall(),
        "bg_gothic_stairs.png": stairs(),
        "bg_gothic_dungeon.png": dungeon(),
        "bg_gothic_cathedral.png": cathedral(),
    }
    for name, img in assets.items():
        sharpen_pixel_edges(img).save(GEN / name)
    print("built procedural gothic backgrounds at 1440x720")


if __name__ == "__main__":
    main()
