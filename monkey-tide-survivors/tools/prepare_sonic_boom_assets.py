from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
GUILE_SRC = SPRITES / "guile_action_sheet_imagen_hd.png"
GUILE_OUT = SPRITES / "guile_action_sheet_imagen_hd_clean_v2.png"
SONIC_OUT = SPRITES / "sonic_boom_fx_imagen_hd.png"

FRAME = 256
COLS = 8
GUILE_ROWS = 5
SONIC_STAGES = 4
SCALE = 4


def hard_cut_alpha(image, threshold=28):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        if pixels[index + 3] <= threshold:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def clear_frame_edge(image):
    image = image.convert("RGBA")
    pixels = image.load()
    w, h = image.size
    for x in range(w):
        pixels[x, 0] = (0, 0, 0, 0)
        pixels[x, h - 1] = (0, 0, 0, 0)
    for y in range(h):
        pixels[0, y] = (0, 0, 0, 0)
        pixels[w - 1, y] = (0, 0, 0, 0)
    return image


def clean_guile_sheet():
    source = Image.open(GUILE_SRC).convert("RGBA")
    sheet = Image.new("RGBA", source.size, (0, 0, 0, 0))
    for row in range(GUILE_ROWS):
        for col in range(COLS):
            box = (col * FRAME, row * FRAME, (col + 1) * FRAME, (row + 1) * FRAME)
            cell = source.crop(box)
            cell = clear_frame_edge(hard_cut_alpha(cell, 32))
            sheet.alpha_composite(cell, box[:2])
    sheet.save(GUILE_OUT)
    print(f"wrote {GUILE_OUT.relative_to(ROOT)}")


def sx(value):
    return int(round(value * SCALE))


def scaled_points(points):
    return [(sx(x), sx(y)) for x, y in points]


def draw_poly_glow(layer, points, fill, blur):
    glow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow, "RGBA")
    draw.polygon(scaled_points(points), fill=fill)
    glow = glow.filter(ImageFilter.GaussianBlur(sx(blur)))
    layer.alpha_composite(glow)


def draw_arc(draw, box, start, end, fill, width):
    draw.arc(tuple(sx(v) for v in box), start=start, end=end, fill=fill, width=sx(width))


def boom_frame(stage, frame):
    canvas = Image.new("RGBA", (FRAME * SCALE, FRAME * SCALE), (0, 0, 0, 0))
    phase = frame / COLS * pi * 2
    power = stage / max(1, SONIC_STAGES - 1)

    palette = [
        ((104, 255, 241, 210), (229, 255, 255, 245), (44, 185, 255, 135)),
        ((67, 235, 255, 220), (246, 255, 255, 255), (76, 255, 183, 155)),
        ((71, 191, 255, 235), (255, 255, 212, 255), (27, 255, 222, 175)),
        ((113, 255, 202, 245), (255, 255, 255, 255), (67, 158, 255, 205)),
    ][stage]
    body, core, accent = palette

    center_y = 128 + sin(phase) * (1.7 + stage * 0.45)
    left = 44 - stage * 4 + sin(phase * 0.9) * 2
    front = 208 + stage * 4 + cos(phase * 0.7) * 2
    top = center_y - (38 + stage * 7)
    bottom = center_y + (38 + stage * 7)
    waist = 24 + stage * 5

    outer = [
        (left, center_y),
        (78, top + 7),
        (132, top - 5 + sin(phase) * 2),
        (front - 18, top + waist * 0.35),
        (front, center_y),
        (front - 18, bottom - waist * 0.35),
        (132, bottom + 5 - sin(phase) * 2),
        (78, bottom - 7),
    ]
    inner = [
        (left + 32, center_y),
        (94, top + 22),
        (142, top + 10),
        (front - 32, center_y),
        (142, bottom - 10),
        (94, bottom - 22),
    ]

    draw_poly_glow(canvas, outer, (*accent[:3], 64 + stage * 18), 12 + stage * 3)
    draw_poly_glow(canvas, outer, (*body[:3], 74 + stage * 15), 6 + stage * 2)

    draw = ImageDraw.Draw(canvas, "RGBA")
    draw.polygon(scaled_points(outer), fill=(*body[:3], 122 + stage * 16))
    draw.polygon(scaled_points(inner), fill=(*core[:3], 116 + stage * 12))

    for band in range(3 + stage):
        inset = band * (9 + stage)
        alpha = max(42, 155 - band * 27 + stage * 8)
        wobble = sin(phase + band * 1.3) * 4
        draw_arc(
            draw,
            (left + inset * 0.62, top + inset * 0.55 + wobble, front - inset * 0.38, bottom - inset * 0.55 + wobble),
            206,
            154,
            (*core[:3], alpha),
            max(3, 8 - band),
        )
        draw_arc(
            draw,
            (left + 12 + inset * 0.45, top + 12 + inset * 0.48 - wobble, front - 18 - inset * 0.28, bottom - 12 - inset * 0.48 - wobble),
            23,
            337,
            (*accent[:3], max(38, alpha - 34)),
            max(2, 5 - band // 2),
        )

    for trail in range(4 + stage):
        y = center_y + sin(phase + trail * 1.7) * (18 + stage * 2)
        x1 = left - 8 - trail * (7 + stage)
        x2 = left + 45 + trail * 5
        alpha = max(18, 108 - trail * 17)
        draw.line((sx(x1), sx(y), sx(x2), sx(y + sin(phase + trail) * 4)), fill=(*accent[:3], alpha), width=sx(3 + stage))

    for spark in range(4 + stage * 2):
        t = (frame * 0.47 + spark * 1.73) % (pi * 2)
        px = 80 + spark * (18 - stage) + cos(t) * (8 + stage * 2)
        py = center_y + sin(t * 1.4) * (44 + stage * 6)
        radius = 1.8 + stage * 0.5 + (spark % 2) * 0.8
        draw.ellipse((sx(px - radius), sx(py - radius), sx(px + radius), sx(py + radius)), fill=(*core[:3], 116))

    if stage >= 2:
        bolt_points = [
            (76, center_y - 6),
            (111, center_y - 20 - sin(phase) * 5),
            (102, center_y - 3),
            (154, center_y - 24 + cos(phase) * 5),
            (135, center_y + 2),
            (190, center_y - 7),
        ]
        draw.line(scaled_points(bolt_points), fill=(255, 255, 216, 160), width=sx(3 + stage))
    if stage >= 3:
        for ring in range(2):
            offset = ring * 13 + sin(phase + ring) * 2
            draw_arc(
                draw,
                (52 + offset, 76 + offset * 0.2, 226 - offset * 0.2, 180 - offset * 0.2),
                192,
                168,
                (255, 255, 255, 128 - ring * 32),
                5 - ring,
            )

    canvas = hard_cut_alpha(canvas, 8)
    canvas = canvas.resize((FRAME, FRAME), Image.Resampling.LANCZOS)
    return clear_frame_edge(hard_cut_alpha(canvas, 10))


def build_sonic_boom_sheet():
    sheet = Image.new("RGBA", (COLS * FRAME, SONIC_STAGES * FRAME), (0, 0, 0, 0))
    for stage in range(SONIC_STAGES):
        for frame in range(COLS):
            cell = boom_frame(stage, frame)
            sheet.alpha_composite(cell, (frame * FRAME, stage * FRAME))
    sheet.save(SONIC_OUT)
    print(f"wrote {SONIC_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    clean_guile_sheet()
    build_sonic_boom_sheet()
