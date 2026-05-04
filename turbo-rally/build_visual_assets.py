from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent
ASSET_OUT = ROOT / "assets"
OUT = ROOT / "assets" / "tiles"
OUT.mkdir(parents=True, exist_ok=True)


def clamp(value: int) -> int:
    return max(0, min(255, value))


def jitter(color: tuple[int, int, int, int], amount: int) -> tuple[int, int, int, int]:
    r, g, b, a = color
    return (
        clamp(r + random.randint(-amount, amount)),
        clamp(g + random.randint(-amount, amount)),
        clamp(b + random.randint(-amount, amount)),
        a,
    )


def rect(draw: ImageDraw.ImageDraw, xy, fill, outline=None, width=1):
    draw.rectangle([round(v) for v in xy], fill=fill, outline=outline, width=width)


def ellipse(draw: ImageDraw.ImageDraw, xy, fill, outline=None, width=1):
    draw.ellipse([round(v) for v in xy], fill=fill, outline=outline, width=width)


def polygon(draw: ImageDraw.ImageDraw, points, fill, outline=None):
    draw.polygon([(round(x), round(y)) for x, y in points], fill=fill, outline=outline)


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle([round(v) for v in xy], radius=round(radius), fill=fill, outline=outline, width=width)


def lerp_color(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def gradient_rect(draw: ImageDraw.ImageDraw, xy, top, bottom):
    x1, y1, x2, y2 = [round(v) for v in xy]
    h = max(1, y2 - y1)
    for y in range(y1, y2):
        t = (y - y1) / h
        draw.line((x1, y, x2, y), fill=lerp_color(top, bottom, t))


def add_sheet_shadow(img: Image.Image, offset=(4, 5), blur=3, opacity=94) -> Image.Image:
    alpha = img.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    shadow_alpha = alpha.point(lambda value: int(value * opacity / 255))
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    shadow.putalpha(shadow_alpha)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(shadow, offset, shadow)
    out.alpha_composite(img)
    return out


def draw_asphalt(draw: ImageDraw.ImageDraw, ox: int, oy: int, wet=False, cracked=False):
    top = (86, 89, 92, 255) if not wet else (48, 68, 82, 255)
    bottom = (50, 54, 60, 255) if not wet else (32, 46, 58, 255)
    gradient_rect(draw, (ox, oy, ox + 64, oy + 64), top, bottom)
    for _ in range(120):
        x = ox + random.randrange(64)
        y = oy + random.randrange(64)
        tone = random.randint(-22, 18)
        base = lerp_color(top, bottom, y / 64)
        col = (clamp(base[0] + tone), clamp(base[1] + tone), clamp(base[2] + tone), 120)
        rect(draw, (x, y, x + random.randrange(1, 4), y + 1), col)
    for y in (11, 27, 44, 58):
        draw.line((ox, oy + y, ox + 64, oy + y + random.choice([-1, 0, 1])), fill=(255, 245, 205, 24), width=1)
    if wet:
        for i in range(5):
            y = oy + 8 + i * 11
            draw.line((ox + 6, y, ox + 58, y + random.choice([-1, 0, 1])), fill=(128, 204, 214, 52), width=1)
    if cracked:
        for start in (12, 34, 49):
            x = ox + start
            y = oy + random.randint(5, 24)
            pts = [(x, y)]
            for _ in range(4):
                x += random.randint(-7, 8)
                y += random.randint(5, 11)
                pts.append((x, y))
            draw.line(pts, fill=(20, 24, 26, 150), width=2)


def draw_lane_tile(draw: ImageDraw.ImageDraw, ox: int, oy: int):
    draw_asphalt(draw, ox, oy)
    rect(draw, (ox + 28, oy + 4, ox + 36, oy + 30), (227, 228, 216, 245))
    rect(draw, (ox + 28, oy + 42, ox + 36, oy + 62), (227, 228, 216, 245))


def draw_curb(draw: ImageDraw.ImageDraw, ox: int, oy: int):
    rect(draw, (ox, oy, ox + 64, oy + 64), (245, 238, 216, 255))
    for i in range(-2, 6):
        col = (222, 62, 55, 255) if i % 2 == 0 else (245, 238, 216, 255)
        polygon(draw, [(ox + i * 18, oy), (ox + i * 18 + 18, oy), (ox + i * 18 - 4, oy + 64), (ox + i * 18 - 22, oy + 64)], col)


def draw_grass(draw: ImageDraw.ImageDraw, ox: int, oy: int, dark=False):
    top = (53, 151, 77, 255) if not dark else (34, 106, 70, 255)
    bottom = (23, 97, 58, 255) if not dark else (20, 74, 50, 255)
    gradient_rect(draw, (ox, oy, ox + 64, oy + 64), top, bottom)
    for i in range(18):
        x = ox + random.randrange(64)
        y = oy + random.randrange(64)
        draw.line((x, y, x + random.randint(-3, 6), y - random.randint(2, 7)), fill=jitter((72, 177, 91, 140), 24), width=1)
    for y in range(8, 64, 16):
        draw.line((ox, oy + y, ox + 64, oy + y + 3), fill=(20, 72, 42, 55), width=3)


def draw_sand(draw: ImageDraw.ImageDraw, ox: int, oy: int):
    base = (234, 195, 112, 255)
    gradient_rect(draw, (ox, oy, ox + 64, oy + 64), (249, 222, 151, 255), (197, 151, 78, 255))
    for _ in range(80):
        x = ox + random.randrange(64)
        y = oy + random.randrange(64)
        rect(draw, (x, y, x + 1, y + 1), jitter((181, 142, 78, 150), 20))
    for i in range(4):
        cx = ox + 12 + i * 13
        cy = oy + 12 + ((i * 19) % 42)
        draw.arc((cx - 4, cy - 3, cx + 5, cy + 5), 20, 190, fill=(244, 228, 172, 120), width=1)


def draw_water(draw: ImageDraw.ImageDraw, ox: int, oy: int):
    gradient_rect(draw, (ox, oy, ox + 64, oy + 64), (39, 168, 185, 255), (16, 79, 121, 255))
    for y in range(6, 64, 9):
        for x in range(-8, 72, 18):
            draw.arc((ox + x, oy + y - 4, ox + x + 18, oy + y + 7), 8, 170, fill=(105, 219, 216, 95), width=2)
    for _ in range(24):
        x = ox + random.randrange(64)
        y = oy + random.randrange(64)
        rect(draw, (x, y, x + random.randrange(2, 6), y + 1), (255, 244, 188, 48))


def draw_boost(draw: ImageDraw.ImageDraw, ox: int, oy: int):
    rect(draw, (ox, oy, ox + 64, oy + 64), (44, 48, 45, 255))
    for i in range(3):
        x = ox + 6 + i * 18
        polygon(draw, [(x, oy + 52), (x + 14, oy + 32), (x + 4, oy + 32), (x + 18, oy + 10), (x + 30, oy + 32), (x + 20, oy + 32), (x + 34, oy + 52)], (55, 220, 198, 235))
    rect(draw, (ox + 4, oy + 4, ox + 60, oy + 60), None, (255, 210, 74, 220), 2)


def draw_start(draw: ImageDraw.ImageDraw, ox: int, oy: int):
    for row in range(8):
        for col in range(8):
            fill = (18, 18, 18, 255) if (row + col) % 2 else (238, 232, 207, 255)
            rect(draw, (ox + col * 8, oy + row * 8, ox + col * 8 + 8, oy + row * 8 + 8), fill)


def draw_city_tile(draw: ImageDraw.ImageDraw, ox: int, oy: int):
    rect(draw, (ox, oy, ox + 64, oy + 64), (38, 53, 61, 255))
    for i in range(4):
        bx = ox + 4 + i * 15
        bh = 18 + (i * 17) % 38
        rect(draw, (bx, oy + 62 - bh, bx + 11, oy + 62), (186, 187, 165, 220))
        rect(draw, (bx + 3, oy + 66 - bh, bx + 6, oy + 73 - bh), (55, 220, 198, 180) if i % 2 else (255, 210, 74, 160))


def draw_cliff(draw: ImageDraw.ImageDraw, ox: int, oy: int):
    rect(draw, (ox, oy, ox + 64, oy + 64), (116, 72, 52, 255))
    for y in range(6, 64, 13):
        draw.line((ox, oy + y, ox + 64, oy + y + random.randint(-3, 3)), fill=(75, 48, 40, 110), width=2)
    for _ in range(24):
        x = ox + random.randrange(64)
        y = oy + random.randrange(64)
        rect(draw, (x, y, x + random.randrange(2, 5), y + 1), (174, 111, 68, 105))


def build_tileset():
    random.seed(73)
    img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    drawers = [
        draw_asphalt,
        draw_lane_tile,
        draw_curb,
        draw_grass,
        draw_sand,
        draw_water,
        draw_boost,
        draw_start,
        lambda d, x, y: draw_asphalt(d, x, y, True, False),
        lambda d, x, y: draw_asphalt(d, x, y, False, True),
        draw_cliff,
        draw_city_tile,
        lambda d, x, y: draw_grass(d, x, y, True),
        draw_sand,
        draw_water,
        draw_boost,
    ]
    for index, fn in enumerate(drawers):
        col = index % 8
        row = index // 8
        fn(draw, col * 64, row * 64)
    # Fill unused slots with useful neutral variation.
    for row in range(2, 8):
        for col in range(8):
            fn = [draw_asphalt, draw_grass, draw_sand, draw_water, draw_curb, draw_city_tile, draw_cliff, draw_start][(row + col) % 8]
            fn(draw, col * 64, row * 64)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=130, threshold=3))
    img.save(OUT / "turbo-rally-tileset.png")


def draw_glow(draw: ImageDraw.ImageDraw, cx: int, cy: int, radius: int, color):
    for r in range(radius, 0, -4):
        a = int(color[3] * (1 - r / radius) ** 1.5)
        ellipse(draw, (cx - r, cy - r, cx + r, cy + r), (*color[:3], a))


def build_coast_layer():
    random.seed(94)
    w, h = 1536, 384
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    draw_glow(draw, int(w * 0.78), 78, 145, (255, 202, 68, 145))
    gradient_rect(draw, (0, 152, w, h), (42, 172, 190, 188), (12, 83, 126, 210))
    for y in range(170, 365, 18):
        alpha = max(26, 104 - int((y - 170) * 0.25))
        for x in range(-120, w + 120, 118):
            wiggle = random.randint(-4, 4)
            draw.arc((x, y - 8 + wiggle, x + 108, y + 20 + wiggle), 4, 176, fill=(151, 238, 223, alpha), width=3)
    for x in range(0, w, 36):
        draw.line((x, 238 + random.randint(-4, 4), x + 24, 238 + random.randint(-4, 4)), fill=(255, 228, 128, 32), width=2)

    for base_x in (-120, 180, 642, 1120, w + 180):
        polygon(draw, [(base_x, 238), (base_x + 100, 150), (base_x + 235, 232), (base_x + 282, 286), (base_x - 42, 288)], (42, 130, 82, 224))
        polygon(draw, [(base_x + 46, 244), (base_x + 132, 184), (base_x + 220, 240), (base_x + 214, 268), (base_x + 32, 270)], (238, 191, 101, 204))
        for palm_x in (base_x + 70, base_x + 168):
            draw.line((palm_x, 252, palm_x + 6, 198), fill=(84, 55, 36, 210), width=5)
            for i in range(5):
                ang = -2.6 + i * 0.5
                draw.line((palm_x + 6, 198, palm_x + 6 + math.cos(ang) * 35, 198 + math.sin(ang) * 18), fill=(55, 171, 85, 185), width=5)

    for base_x in (80, 410, 902, 1280):
        rect(draw, (base_x, 246, base_x + 168, 259), (144, 90, 58, 204))
        draw.line((base_x, 242, base_x + 168, 242), fill=(255, 226, 134, 118), width=2)
        for p in range(0, 176, 24):
            rect(draw, (base_x + p, 258, base_x + p + 5, 306), (72, 49, 40, 176))
        for p in range(14, 160, 46):
            ellipse(draw, (base_x + p, 230, base_x + p + 11, 241), (255, 210, 74, 150))
    img = img.filter(ImageFilter.GaussianBlur(0.22)).filter(ImageFilter.UnsharpMask(radius=1.0, percent=120, threshold=3))
    img.save(OUT / "backdrop-coast.png")


def building(draw, x, ground, w, h, fill, light):
    rect(draw, (x, ground - h, x + w, ground), fill)
    for yy in range(int(ground - h + 10), int(ground - 10), 18):
        for xx in range(int(x + 7), int(x + w - 6), 17):
            if random.random() < 0.42:
                rect(draw, (xx, yy, xx + 5, yy + 10), light)


def build_skyline_layer():
    random.seed(108)
    w, h = 1536, 384
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    for base in (-260, 260, 780, 1300):
        polygon(draw, [(base, 320), (base + 210, 126), (base + 390, 320)], (14, 36, 55, 218))
        polygon(draw, [(base + 150, 318), (base + 365, 80), (base + 620, 324)], (22, 46, 68, 226))
        polygon(draw, [(base + 230, 318), (base + 426, 142), (base + 710, 326)], (45, 74, 82, 130))
    ground = 342
    x = -20
    while x < w + 80:
        bw = random.randint(38, 76)
        bh = random.randint(62, 170)
        fill = random.choice([(190, 187, 166, 194), (121, 150, 151, 202), (83, 121, 147, 186), (207, 160, 138, 160)])
        light = random.choice([(55, 220, 198, 150), (255, 210, 74, 142), (245, 247, 235, 120)])
        building(draw, x, ground, bw, bh, fill, light)
        if random.random() < 0.22:
            rect(draw, (x + 4, ground - bh - 8, x + bw - 4, ground - bh - 3), (255, 111, 95, 125))
        x += bw + random.randint(4, 18)
    for palm_x in (68, 270, 615, 1040, 1390):
        draw.line((palm_x, ground, palm_x + 9, ground - 66), fill=(31, 71, 54, 220), width=6)
        for i in range(6):
            ang = -math.pi * 0.95 + i * 0.38
            ex = palm_x + 9 + math.cos(ang) * 46
            ey = ground - 66 + math.sin(ang) * 23
            draw.line((palm_x + 9, ground - 66, ex, ey), fill=(51, 163, 86, 210), width=8)
    for sign_x in (178, 560, 970, 1260):
        rounded_rect(draw, (sign_x, ground - 96, sign_x + 76, ground - 66), 5, (14, 18, 20, 160), (255, 210, 74, 110), 2)
        polygon(draw, [(sign_x + 50, ground - 89), (sign_x + 65, ground - 81), (sign_x + 50, ground - 73)], (55, 220, 198, 150))
    img = img.filter(ImageFilter.GaussianBlur(0.18)).filter(ImageFilter.UnsharpMask(radius=1.0, percent=115, threshold=4))
    img.save(OUT / "backdrop-skyline.png")


def cloud_puff(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, fill):
    ellipse(draw, (x, y + 18 * scale, x + 92 * scale, y + 54 * scale), fill)
    ellipse(draw, (x + 26 * scale, y, x + 92 * scale, y + 58 * scale), fill)
    ellipse(draw, (x + 70 * scale, y + 12 * scale, x + 146 * scale, y + 58 * scale), fill)
    ellipse(draw, (x + 112 * scale, y + 24 * scale, x + 180 * scale, y + 58 * scale), fill)


def build_cloud_layer():
    random.seed(132)
    w, h = 1536, 240
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    for x, y, scale, alpha in (
        (-80, 74, 0.82, 64),
        (190, 46, 0.62, 58),
        (450, 92, 0.96, 50),
        (800, 38, 0.68, 60),
        (1110, 82, 0.88, 54),
        (1420, 54, 0.75, 58),
    ):
        cloud_puff(draw, x, y, scale, (255, 220, 196, alpha))
    for _ in range(26):
        x = random.randint(0, w)
        y = random.randint(20, h - 30)
        draw.line((x, y, x + random.randint(42, 115), y + random.randint(-2, 3)), fill=(143, 199, 210, random.randint(16, 34)), width=random.randint(1, 3))
    img = img.filter(ImageFilter.GaussianBlur(1.1))
    img.save(OUT / "backdrop-clouds.png")


def draw_sailboat(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, alpha: int):
    hull = (88, 61, 45, alpha)
    sail = (245, 247, 235, max(0, alpha - 20))
    accent = (255, 210, 74, max(0, alpha - 10))
    polygon(draw, [(x, y), (x + 78 * scale, y), (x + 62 * scale, y + 12 * scale), (x + 12 * scale, y + 14 * scale)], hull)
    draw.line((x + 35 * scale, y, x + 35 * scale, y - 66 * scale), fill=(35, 42, 41, alpha), width=max(1, round(3 * scale)))
    polygon(draw, [(x + 39 * scale, y - 62 * scale), (x + 39 * scale, y - 8 * scale), (x + 82 * scale, y - 8 * scale)], sail)
    polygon(draw, [(x + 31 * scale, y - 54 * scale), (x + 31 * scale, y - 8 * scale), (x - 7 * scale, y - 8 * scale)], accent)
    draw.line((x - 12 * scale, y + 18 * scale, x + 92 * scale, y + 16 * scale), fill=(118, 225, 213, max(0, alpha - 110)), width=max(1, round(2 * scale)))


def draw_lighthouse(draw: ImageDraw.ImageDraw, x: int, base: int, scale: float):
    rect(draw, (x + 20 * scale, base - 120 * scale, x + 60 * scale, base), (235, 238, 218, 230), (25, 30, 29, 170), max(1, round(2 * scale)))
    rect(draw, (x + 20 * scale, base - 82 * scale, x + 60 * scale, base - 66 * scale), (255, 111, 95, 210))
    rect(draw, (x + 20 * scale, base - 42 * scale, x + 60 * scale, base - 28 * scale), (255, 111, 95, 210))
    rect(draw, (x + 14 * scale, base - 135 * scale, x + 66 * scale, base - 116 * scale), (38, 46, 45, 230))
    ellipse(draw, (x + 26 * scale, base - 151 * scale, x + 54 * scale, base - 123 * scale), (255, 210, 74, 230), (32, 38, 36, 180), max(1, round(2 * scale)))
    draw_glow(draw, round(x + 40 * scale), round(base - 137 * scale), round(45 * scale), (255, 210, 74, 65))


def draw_bridge(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, alpha: int):
    deck = (80, 62, 52, alpha)
    rail = (245, 247, 235, max(0, alpha - 45))
    rect(draw, (x, y, x + 250 * scale, y + 10 * scale), deck)
    draw.line((x, y - 9 * scale, x + 250 * scale, y - 9 * scale), fill=rail, width=max(1, round(2 * scale)))
    for p in range(0, 260, 32):
        rect(draw, (x + p * scale, y + 10 * scale, x + (p + 6) * scale, y + 62 * scale), deck)
    for p in range(0, 220, 52):
        draw.arc((x + p * scale, y + 16 * scale, x + (p + 60) * scale, y + 82 * scale), 190, 350, fill=(55, 220, 198, max(0, alpha - 95)), width=max(1, round(2 * scale)))


def draw_buoy(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, alpha: int):
    draw.line((x, y + 12 * scale, x, y + 32 * scale), fill=(28, 34, 33, alpha), width=max(1, round(2 * scale)))
    ellipse(draw, (x - 9 * scale, y - 4 * scale, x + 9 * scale, y + 15 * scale), (255, 111, 95, alpha), (245, 247, 235, max(0, alpha - 50)), max(1, round(2 * scale)))


def build_horizon_elements_layer():
    random.seed(155)
    w, h = 1536, 320
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    base = 260
    for x in range(-60, w + 80, 180):
        draw.line((x, base + 16, x + 118, base + 16 + random.randint(-2, 3)), fill=(118, 225, 213, 58), width=2)
    for x in range(-20, w + 160, 260):
        rect(draw, (x, base + 38, x + 170, base + 48), (116, 72, 48, 136))
        draw.line((x, base + 33, x + 170, base + 33), fill=(255, 210, 74, 82), width=2)
        for p in range(0, 180, 30):
            rect(draw, (x + p, base + 46, x + p + 6, base + 88), (74, 50, 40, 118))
    draw_lighthouse(draw, 76, base + 10, 0.78)
    draw_bridge(draw, 340, base - 10, 0.72, 154)
    draw_bridge(draw, 1160, base - 4, 0.62, 136)
    draw_sailboat(draw, 230, base + 18, 0.72, 178)
    draw_sailboat(draw, 706, base + 26, 0.52, 146)
    draw_sailboat(draw, 1348, base + 21, 0.64, 164)
    for x, y, s in ((590, base + 28, 0.75), (1014, base + 22, 0.58), (1486, base + 30, 0.68), (30, base + 34, 0.52)):
        draw_buoy(draw, x, y, s, 190)
    for x in (510, 880, 1070, 1510):
        rounded_rect(draw, (x, base - 66, x + 92, base - 18), 7, (18, 22, 21, 178), (255, 210, 74, 138), 2)
        polygon(draw, [(x + 48, base - 52), (x + 68, base - 40), (x + 48, base - 28)], (55, 220, 198, 180))
        draw_glow(draw, x + 58, base - 42, 34, (55, 220, 198, 48))
    img = img.filter(ImageFilter.GaussianBlur(0.14)).filter(ImageFilter.UnsharpMask(radius=1.0, percent=120, threshold=3))
    img.save(OUT / "backdrop-horizon-elements.png")


def draw_coin(draw, ox, oy):
    ellipse(draw, (ox + 36, oy + 20, ox + 92, oy + 98), (255, 210, 74, 255), (88, 60, 24, 190), 4)
    ellipse(draw, (ox + 48, oy + 30, ox + 80, oy + 88), (255, 236, 112, 255))


def draw_turbo_icon(draw, ox, oy):
    for i in range(3):
        x = ox + 24 + i * 22
        polygon(draw, [(x, oy + 92), (x + 19, oy + 62), (x + 7, oy + 62), (x + 28, oy + 28), (x + 46, oy + 62), (x + 31, oy + 62), (x + 50, oy + 92)], (55, 220, 198, 245))
    ellipse(draw, (ox + 18, oy + 88, ox + 108, oy + 112), (0, 0, 0, 58))


def draw_box(draw, ox, oy):
    polygon(draw, [(ox + 31, oy + 36), (ox + 84, oy + 26), (ox + 101, oy + 42), (ox + 48, oy + 53)], (255, 236, 122, 245), (20, 20, 16, 210))
    polygon(draw, [(ox + 84, oy + 26), (ox + 101, oy + 42), (ox + 97, oy + 94), (ox + 82, oy + 105)], (224, 139, 44, 245), (20, 20, 16, 210))
    polygon(draw, [(ox + 31, oy + 36), (ox + 48, oy + 53), (ox + 45, oy + 105), (ox + 28, oy + 89)], (238, 169, 54, 245), (20, 20, 16, 210))
    rect(draw, (ox + 47, oy + 53, ox + 97, oy + 105), (255, 210, 74, 245), (20, 20, 16, 220), 4)
    rect(draw, (ox + 58, oy + 62, ox + 86, oy + 91), (38, 45, 42, 225), (245, 247, 235, 90), 2)
    draw.line((ox + 61, oy + 68, ox + 82, oy + 86), fill=(55, 220, 198, 220), width=5)


def draw_puddle(draw, ox, oy):
    ellipse(draw, (ox + 14, oy + 72, ox + 116, oy + 106), (14, 15, 16, 230))
    ellipse(draw, (ox + 44, oy + 78, ox + 90, oy + 96), (143, 123, 255, 88))


def draw_sign(draw, ox, oy):
    rect(draw, (ox + 58, oy + 58, ox + 66, oy + 112), (62, 49, 41, 235))
    polygon(draw, [(ox + 16, oy + 28), (ox + 94, oy + 28), (ox + 112, oy + 48), (ox + 94, oy + 68), (ox + 16, oy + 68)], (255, 210, 74, 245), (35, 32, 25, 230))
    polygon(draw, [(ox + 74, oy + 38), (ox + 94, oy + 48), (ox + 74, oy + 58)], (36, 42, 38, 245))


def draw_lamp(draw, ox, oy):
    draw.line((ox + 64, oy + 110, ox + 64, oy + 38), fill=(41, 55, 58, 245), width=7)
    rect(draw, (ox + 50, oy + 100, ox + 78, oy + 112), (34, 44, 45, 245))
    draw_glow(draw, ox + 64, oy + 35, 42, (255, 210, 74, 105))
    ellipse(draw, (ox + 50, oy + 22, ox + 78, oy + 52), (255, 210, 74, 240), (44, 50, 47, 225), 3)
    draw.line((ox + 58, oy + 26, ox + 70, oy + 48), fill=(255, 245, 178, 120), width=2)


def draw_palm(draw, ox, oy):
    draw.line((ox + 64, oy + 114, ox + 72, oy + 34), fill=(92, 61, 39, 255), width=10)
    for i in range(7):
        ang = -2.65 + i * 0.52
        ex = ox + 72 + math.cos(ang) * 58
        ey = oy + 34 + math.sin(ang) * 30
        draw.line((ox + 72, oy + 34, ex, ey), fill=(42, 174, 82, 245), width=11)
    ellipse(draw, (ox + 60, oy + 28, ox + 77, oy + 45), (132, 78, 38, 255))


def draw_gate(draw, ox, oy, finish=False):
    color = (245, 247, 235, 245) if finish else (55, 220, 198, 235)
    accent = (24, 26, 25, 235) if finish else (255, 210, 74, 220)
    draw.line((ox + 22, oy + 110, ox + 22, oy + 28), fill=color, width=9)
    draw.line((ox + 106, oy + 110, ox + 106, oy + 28), fill=color, width=9)
    draw.line((ox + 22, oy + 28, ox + 106, oy + 28), fill=color, width=9)
    if finish:
        for i in range(8):
            fill = accent if i % 2 else (245, 247, 235, 245)
            rect(draw, (ox + 30 + i * 9, oy + 38, ox + 39 + i * 9, oy + 50), fill)
    else:
        rect(draw, (ox + 36, oy + 40, ox + 92, oy + 52), accent)


def draw_cone(draw, ox, oy):
    polygon(draw, [(ox + 64, oy + 26), (ox + 38, oy + 104), (ox + 90, oy + 104)], (255, 111, 95, 245), (28, 28, 24, 220))
    rect(draw, (ox + 42, oy + 72, ox + 86, oy + 82), (245, 247, 235, 230))


def draw_marker(draw, ox, oy):
    rect(draw, (ox + 56, oy + 30, ox + 72, oy + 108), (245, 247, 235, 235))
    ellipse(draw, (ox + 42, oy + 16, ox + 86, oy + 58), (55, 220, 198, 210), (12, 18, 18, 190), 3)


def draw_spark(draw, ox, oy):
    for i, r in enumerate((48, 34, 21)):
        polygon(draw, [(ox + 64, oy + 18), (ox + 74, oy + 55), (ox + 110, oy + 64), (ox + 74, oy + 75), (ox + 64, oy + 112), (ox + 54, oy + 75), (ox + 18, oy + 64), (ox + 54, oy + 55)], (255, 210, 74, 95 - i * 22))
    polygon(draw, [(ox + 64, oy + 30), (ox + 72, oy + 57), (ox + 98, oy + 64), (ox + 72, oy + 71), (ox + 64, oy + 98), (ox + 56, oy + 71), (ox + 30, oy + 64), (ox + 56, oy + 57)], (255, 238, 123, 245))


def draw_kart_driver(draw: ImageDraw.ImageDraw, cx: float, cy: float, palette: dict, yaw: float, kind: int):
    outline = (12, 17, 18, 245)
    helmet = palette["driver"]
    trim = palette["driver_trim"]
    if kind == 0:
        ellipse(draw, (cx - 21 + yaw * 4, cy - 30, cx + 21 + yaw * 4, cy + 15), helmet, outline, 4)
        ellipse(draw, (cx - 22 + yaw * 8, cy - 35, cx - 4 + yaw * 8, cy - 16), helmet, outline, 3)
        ellipse(draw, (cx + 4 + yaw * 8, cy - 35, cx + 22 + yaw * 8, cy - 16), helmet, outline, 3)
        rect(draw, (cx - 6 + yaw * 6, cy - 29, cx + 7 + yaw * 6, cy + 11), trim)
        ellipse(draw, (cx + 9 + yaw * 8, cy - 12, cx + 18 + yaw * 8, cy - 4), (32, 137, 45, 220))
    elif kind == 1:
        ellipse(draw, (cx - 22 + yaw * 4, cy - 31, cx + 22 + yaw * 4, cy + 14), helmet, outline, 4)
        rect(draw, (cx - 7 + yaw * 5, cy - 30, cx + 8 + yaw * 5, cy + 12), trim)
        for side in (-1, 1):
            draw.line((cx + side * 12 + yaw * 6, cy - 29, cx + side * 17 + yaw * 10, cy - 48), fill=outline, width=3)
            ellipse(draw, (cx + side * 14 + yaw * 10 - 4, cy - 52, cx + side * 14 + yaw * 10 + 4, cy - 44), (255, 165, 38, 245), outline, 2)
        ellipse(draw, (cx - 37 + yaw * 6, cy - 8, cx - 8 + yaw * 6, cy + 14), (151, 219, 255, 172), (245, 247, 235, 110), 2)
        ellipse(draw, (cx + 8 + yaw * 6, cy - 8, cx + 37 + yaw * 6, cy + 14), (151, 219, 255, 172), (245, 247, 235, 110), 2)
    else:
        ellipse(draw, (cx - 22 + yaw * 4, cy - 30, cx + 22 + yaw * 4, cy + 16), helmet, outline, 4)
        polygon(draw, [(cx - 18 + yaw * 4, cy - 26), (cx - 6 + yaw * 4, cy - 49), (cx + 1 + yaw * 4, cy - 23)], helmet, outline)
        polygon(draw, [(cx + 18 + yaw * 4, cy - 26), (cx + 6 + yaw * 4, cy - 49), (cx - 1 + yaw * 4, cy - 23)], helmet, outline)
        rect(draw, (cx - 6 + yaw * 5, cy - 30, cx + 7 + yaw * 5, cy + 13), trim)
        ellipse(draw, (cx + yaw * 9 - 8, cy - 8, cx + yaw * 9 + 8, cy + 4), (245, 247, 235, 180))


def draw_kart_frame(draw: ImageDraw.ImageDraw, ox: int, oy: int, palette: dict, yaw: float, drift=False, bounce=0, kind=0):
    outline = (12, 17, 18, 255)
    body = palette["body"]
    trim = palette["trim"]
    bright = palette["bright"]
    cx = ox + 96
    ground = oy + 158 + bounce
    roll = yaw * (7 if drift else 4)
    top_shift = yaw * 38
    lower_shift = yaw * 13
    body_top = ground - 86
    body_bottom = ground - 28

    if drift:
        smoke_x = cx - yaw * 58
        for i in range(4):
            ellipse(draw, (smoke_x - 38 - i * 12, ground - 29 + i * 2, smoke_x + 1 - i * 8, ground + 4 + i * 2), (224, 225, 218, 130 - i * 20))

    wheel_y = ground - 34
    for side in (-1, 1):
        wx = cx + side * (43 - abs(yaw) * 9) + lower_shift * 0.72
        wy = wheel_y + (side * yaw * 8)
        ellipse(draw, (wx - 19, wy - 28, wx + 19, wy + 22), (18, 21, 23, 255), outline, 4)
        ellipse(draw, (wx - 10, wy - 18, wx + 10, wy + 11), (55, 60, 64, 255), (6, 8, 9, 210), 2)
        rect(draw, (wx - 4, wy - 17, wx + 5, wy + 10), bright)

    body_poly = [
        (cx - 54 + lower_shift, body_bottom),
        (cx + 54 + lower_shift, body_bottom),
        (cx + 40 + top_shift, body_top),
        (cx - 40 + top_shift, body_top),
    ]
    polygon(draw, body_poly, body, outline)
    rounded_rect(draw, (cx - 42 + lower_shift, body_bottom - 29, cx + 42 + lower_shift, body_bottom + 5), 12, body, outline, 3)
    rounded_rect(draw, (cx - 24 + lower_shift, body_bottom - 23, cx + 24 + lower_shift, body_bottom - 3), 8, trim, None, 1)
    rounded_rect(draw, (cx - 31 + top_shift, body_top + 14, cx + 31 + top_shift, body_top + 34), 9, (28, 34, 33, 255), outline, 3)
    rect(draw, (cx - 9 + top_shift, body_top + 19, cx + 10 + top_shift, body_bottom - 3), bright)
    ellipse(draw, (cx - 14 + lower_shift, body_bottom - 18, cx + 14 + lower_shift, body_bottom + 10), (30, 36, 39, 255), outline, 4)
    ellipse(draw, (cx - 8 + lower_shift, body_bottom - 11, cx + 8 + lower_shift, body_bottom + 4), (117, 130, 130, 255))
    for side in (-1, 1):
        rounded_rect(draw, (cx + side * 34 + lower_shift - 9, body_bottom - 20, cx + side * 34 + lower_shift + 9, body_bottom + 2), 6, trim, outline, 2)

    draw_kart_driver(draw, cx + top_shift * 0.86, body_top - 6 + roll * 0.2, palette, yaw, kind)

    for side in (-1, 1):
        sx = cx + side * 31 + lower_shift
        draw.line((sx, body_top + 24, sx + side * 18, body_bottom - 4), fill=(245, 247, 235, 135), width=4)
    if drift:
        spark_x = cx + yaw * 52
        polygon(draw, [(spark_x, ground - 34), (spark_x + 9, ground - 20), (spark_x + 26, ground - 18), (spark_x + 12, ground - 8), (spark_x + 5, ground + 8), (spark_x - 3, ground - 8), (spark_x - 20, ground - 15), (spark_x - 4, ground - 21)], (255, 210, 74, 210))


def build_rally_sheet():
    ASSET_OUT.mkdir(parents=True, exist_ok=True)
    w, h = 1728, 768
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    frames = [
        (-1.0, True, -2),
        (-0.72, True, 0),
        (-0.42, False, 1),
        (-0.16, False, -1),
        (0.0, False, 0),
        (0.16, False, 1),
        (0.42, False, -1),
        (0.72, True, 0),
        (1.0, True, 2),
    ]
    palettes = [
        {"body": (93, 212, 61, 255), "trim": (246, 215, 61, 255), "bright": (226, 244, 176, 255), "driver": (90, 220, 56, 255), "driver_trim": (238, 244, 190, 245)},
        {"body": (255, 210, 74, 255), "trim": (43, 33, 17, 255), "bright": (255, 239, 132, 255), "driver": (246, 196, 42, 255), "driver_trim": (58, 48, 28, 255)},
        {"body": (239, 86, 56, 255), "trim": (255, 207, 84, 255), "bright": (255, 236, 210, 255), "driver": (244, 95, 65, 255), "driver_trim": (255, 241, 222, 250)},
    ]
    for row, palette in enumerate(palettes):
        for col, (yaw, drift, bounce) in enumerate(frames):
            draw_kart_frame(draw, col * 192, row * 192, palette, yaw, drift, bounce, row)

    # Keep a small item/decal row in the unused lower band for easy visual inspection.
    icon_y = 600
    for i, fn in enumerate((draw_coin, draw_turbo_icon, draw_box, draw_puddle, draw_cone, draw_marker, draw_spark, draw_lamp, draw_palm)):
        fn(draw, i * 192 + 32, icon_y + 18)
    img.save(ASSET_OUT / "rally-sprite-sheet.png")


def draw_arrow_sign(draw, ox, oy, direction=1):
    post_x = ox + (56 if direction > 0 else 72)
    rect(draw, (post_x, oy + 62, post_x + 8, oy + 113), (74, 51, 38, 245))
    polygon(draw, [(ox + 17, oy + 29), (ox + 91, oy + 29), (ox + 112, oy + 49), (ox + 91, oy + 69), (ox + 17, oy + 69)], (255, 210, 74, 250), (35, 32, 25, 235))
    if direction > 0:
        polygon(draw, [(ox + 72, oy + 38), (ox + 96, oy + 49), (ox + 72, oy + 60)], (34, 38, 34, 245))
    else:
        polygon(draw, [(ox + 56, oy + 38), (ox + 32, oy + 49), (ox + 56, oy + 60)], (34, 38, 34, 245))


def draw_sign_right(draw, ox, oy):
    draw_arrow_sign(draw, ox, oy, 1)


def draw_sign_left(draw, ox, oy):
    draw_arrow_sign(draw, ox, oy, -1)


def draw_palm_alt(draw, ox, oy):
    draw.line((ox + 61, oy + 115, ox + 54, oy + 35), fill=(99, 65, 42, 255), width=10)
    for i in range(8):
        ang = -2.92 + i * 0.5
        ex = ox + 54 + math.cos(ang) * 52
        ey = oy + 35 + math.sin(ang) * 28
        draw.line((ox + 54, oy + 35, ex, ey), fill=(62, 184, 92, 245), width=10)
    ellipse(draw, (ox + 47, oy + 29, ox + 65, oy + 47), (132, 78, 38, 255))


def draw_check_flag(draw, ox, oy, direction=1):
    pole_x = ox + (43 if direction > 0 else 85)
    rect(draw, (pole_x, oy + 18, pole_x + 7, oy + 114), (235, 238, 218, 245), (20, 24, 24, 170), 1)
    wave = direction * 7
    flag = [(pole_x + 6, oy + 21), (pole_x + 58 * direction, oy + 17 + wave), (pole_x + 62 * direction, oy + 56 - wave), (pole_x + 6, oy + 50)]
    polygon(draw, flag, (245, 247, 235, 245), (18, 20, 20, 220))
    min_x = min(x for x, _ in flag)
    for r in range(3):
        for c in range(4):
            if (r + c) % 2:
                x = min_x + c * 14
                y = oy + 22 + r * 9
                rect(draw, (x, y, x + 14, y + 9), (24, 26, 25, 235))


def draw_flag_left(draw, ox, oy):
    draw_check_flag(draw, ox, oy, -1)


def draw_flag_right(draw, ox, oy):
    draw_check_flag(draw, ox, oy, 1)


def draw_pennants(draw, ox, oy):
    draw.line((ox + 12, oy + 36, ox + 116, oy + 26), fill=(245, 247, 235, 190), width=3)
    colors = [(255, 210, 74, 245), (255, 111, 95, 245), (55, 220, 198, 245), (126, 227, 109, 245)]
    for i in range(7):
        x = ox + 17 + i * 15
        y = oy + 34 - i
        polygon(draw, [(x, y), (x + 10, y - 1), (x + 5, y + 18)], colors[i % len(colors)], (22, 25, 24, 125))
    rect(draw, (ox + 14, oy + 38, ox + 20, oy + 112), (58, 45, 37, 220))
    rect(draw, (ox + 108, oy + 30, ox + 114, oy + 112), (58, 45, 37, 220))


def draw_chevron_board(draw, ox, oy):
    rounded_rect(draw, (ox + 15, oy + 35, ox + 113, oy + 81), 8, (21, 25, 26, 245), (255, 210, 74, 220), 3)
    for i in range(3):
        x = ox + 33 + i * 25
        polygon(draw, [(x, oy + 45), (x + 16, oy + 58), (x, oy + 71), (x + 9, oy + 58)], (255, 111, 95, 250) if i < 2 else (55, 220, 198, 250))
    rect(draw, (ox + 27, oy + 82, ox + 34, oy + 113), (58, 45, 37, 220))
    rect(draw, (ox + 94, oy + 82, ox + 101, oy + 113), (58, 45, 37, 220))


def draw_umbrella(draw, ox, oy):
    rect(draw, (ox + 62, oy + 52, ox + 68, oy + 113), (77, 53, 38, 235))
    polygon(draw, [(ox + 23, oy + 59), (ox + 65, oy + 24), (ox + 107, oy + 59)], (255, 111, 95, 245), (22, 25, 24, 180))
    polygon(draw, [(ox + 35, oy + 59), (ox + 65, oy + 24), (ox + 64, oy + 59)], (245, 247, 235, 235))
    polygon(draw, [(ox + 64, oy + 59), (ox + 65, oy + 24), (ox + 95, oy + 59)], (255, 210, 74, 245))


def draw_course_buoy(draw, ox, oy):
    draw.line((ox + 64, oy + 74, ox + 64, oy + 113), fill=(31, 35, 34, 200), width=3)
    ellipse(draw, (ox + 44, oy + 45, ox + 84, oy + 85), (255, 111, 95, 245), (245, 247, 235, 220), 4)
    rect(draw, (ox + 45, oy + 60, ox + 83, oy + 70), (245, 247, 235, 235))


def draw_crowd_stand(draw, ox, oy):
    rounded_rect(draw, (ox + 13, oy + 39, ox + 115, oy + 91), 6, (25, 31, 32, 235), (55, 220, 198, 150), 3)
    for r in range(2):
        for c in range(7):
            color = [(255, 210, 74, 220), (255, 111, 95, 220), (55, 220, 198, 220), (245, 247, 235, 200)][(r + c) % 4]
            ellipse(draw, (ox + 24 + c * 12, oy + 50 + r * 17, ox + 31 + c * 12, oy + 57 + r * 17), color)
    rect(draw, (ox + 22, oy + 92, ox + 29, oy + 114), (58, 45, 37, 220))
    rect(draw, (ox + 100, oy + 92, ox + 107, oy + 114), (58, 45, 37, 220))


def draw_tire_stack(draw, ox, oy):
    for i in range(4):
        x = ox + 27 + (i % 2) * 31
        y = oy + 38 + i * 18
        ellipse(draw, (x, y, x + 39, y + 29), (21, 23, 24, 245), (88, 96, 96, 190), 3)
        ellipse(draw, (x + 11, y + 8, x + 28, y + 21), (45, 49, 50, 245))


def draw_flower_bed(draw, ox, oy):
    ellipse(draw, (ox + 19, oy + 78, ox + 109, oy + 111), (33, 112, 61, 230), (17, 50, 31, 160), 2)
    for i in range(9):
        x = ox + 28 + (i * 17) % 72
        y = oy + 83 + (i * 11) % 20
        ellipse(draw, (x - 4, y - 4, x + 4, y + 4), [(255, 210, 74, 235), (255, 111, 95, 235), (55, 220, 198, 235)][i % 3])


def draw_camera_drone(draw, ox, oy):
    rounded_rect(draw, (ox + 50, oy + 54, ox + 78, oy + 76), 7, (32, 39, 42, 245), (245, 247, 235, 160), 2)
    ellipse(draw, (ox + 58, oy + 58, ox + 70, oy + 70), (55, 220, 198, 245))
    for sx, sy in ((28, 44), (96, 44), (28, 86), (96, 86)):
        draw.line((ox + 64, oy + 65, ox + sx, oy + sy), fill=(32, 39, 42, 210), width=3)
        ellipse(draw, (ox + sx - 14, oy + sy - 5, ox + sx + 14, oy + sy + 5), (245, 247, 235, 115))


def draw_speed_board(draw, ox, oy):
    rounded_rect(draw, (ox + 19, oy + 34, ox + 109, oy + 82), 8, (16, 21, 22, 245), (255, 210, 74, 230), 3)
    draw.line((ox + 48, oy + 82, ox + 48, oy + 113), fill=(62, 49, 41, 235), width=7)
    draw.line((ox + 80, oy + 82, ox + 80, oy + 113), fill=(62, 49, 41, 235), width=7)
    for i in range(3):
        x = ox + 36 + i * 18
        polygon(draw, [(x, oy + 44), (x + 12, oy + 58), (x, oy + 72), (x + 7, oy + 58)], (55, 220, 198, 245))


def build_props():
    img = Image.new("RGBA", (1024, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    fns = [
        draw_coin,
        draw_turbo_icon,
        draw_box,
        draw_puddle,
        draw_sign_right,
        draw_sign_left,
        draw_lamp,
        draw_palm,
        draw_palm_alt,
        draw_flag_left,
        draw_flag_right,
        draw_pennants,
        draw_cone,
        draw_marker,
        draw_spark,
        draw_chevron_board,
        draw_umbrella,
        draw_course_buoy,
        draw_crowd_stand,
        draw_tire_stack,
        draw_flower_bed,
        draw_camera_drone,
        draw_speed_board,
        draw_lamp,
        draw_palm,
        draw_pennants,
        draw_cone,
        draw_marker,
        draw_spark,
        draw_chevron_board,
    ]
    for i, fn in enumerate(fns):
        fn(draw, (i % 8) * 128, (i // 8) * 128)
    img = add_sheet_shadow(img, offset=(4, 5), blur=3, opacity=82)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=140, threshold=3))
    img.save(OUT / "design-props.png")


def build_icon():
    img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    ellipse(draw, (8, 8, 88, 88), (16, 20, 18, 245), (255, 210, 74, 230), 5)
    rect(draw, (28, 55, 70, 72), (71, 186, 58, 255), (12, 17, 15, 220), 3)
    ellipse(draw, (22, 67, 38, 84), (22, 24, 24, 255))
    ellipse(draw, (58, 67, 74, 84), (22, 24, 24, 255))
    ellipse(draw, (31, 27, 45, 46), (93, 212, 61, 255), (12, 17, 15, 200), 2)
    ellipse(draw, (51, 27, 65, 46), (93, 212, 61, 255), (12, 17, 15, 200), 2)
    rect(draw, (44, 27, 52, 67), (226, 233, 194, 245))
    img.save(OUT / "turbo-rally-icon.png")


def main():
    build_rally_sheet()
    build_tileset()
    build_cloud_layer()
    build_coast_layer()
    build_skyline_layer()
    build_horizon_elements_layer()
    build_props()
    build_icon()
    print("built visual assets in", OUT)


if __name__ == "__main__":
    main()
