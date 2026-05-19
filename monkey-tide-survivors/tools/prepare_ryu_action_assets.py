from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SOURCE = SPRITES / "fighters_walkcycles_imagen_hd_clean_v2.png"
OUT = SPRITES / "ryu_action_sheet_imagen_hd.png"

FRAME = 256
COLS = 8
ROWS = 4
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


def crop_visible(image):
    image = hard_cut_alpha(image)
    bbox = image.getchannel("A").getbbox()
    return image.crop(bbox) if bbox else Image.new("RGBA", (1, 1), (0, 0, 0, 0))


def sx(value):
    return int(round(value * SCALE))


def glow_layer(size, blur, draw_fn):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer, "RGBA"))
    return layer.filter(ImageFilter.GaussianBlur(sx(blur)))


def draw_glow_circle(layer, cx, cy, radius, color, blur=6):
    glow = glow_layer(layer.size, blur, lambda d: d.ellipse(
        (sx(cx - radius), sx(cy - radius), sx(cx + radius), sx(cy + radius)),
        fill=color,
    ))
    layer.alpha_composite(glow)


def draw_scaled_arc(draw, box, start, end, fill, width):
    draw.arc(tuple(sx(v) for v in box), start=start, end=end, fill=fill, width=sx(width))


def place_sprite(cell, sprite, x=128, bottom=236, scale=1.0, rotate=0, alpha=255):
    work = sprite
    if scale != 1.0:
      work = work.resize((max(1, round(work.width * scale)), max(1, round(work.height * scale))), Image.Resampling.LANCZOS)
    if rotate:
      work = work.rotate(rotate, resample=Image.Resampling.BICUBIC, expand=True)
    if alpha < 255:
      r, g, b, a = work.split()
      a = a.point(lambda value: round(value * alpha / 255))
      work = Image.merge("RGBA", (r, g, b, a))
    work = hard_cut_alpha(work, 18)
    left = round(x - work.width / 2)
    top = round(bottom - work.height)
    cell.alpha_composite(work, (left, top))


def extract_ryu_frames():
    source = Image.open(SOURCE).convert("RGBA")
    frames = []
    for col in range(COLS):
        box = (col * FRAME, 0, (col + 1) * FRAME, FRAME)
        frames.append(crop_visible(source.crop(box)))
    return frames


def make_cell():
    return Image.new("RGBA", (FRAME * SCALE, FRAME * SCALE), (0, 0, 0, 0))


def finalize(cell):
    cell = hard_cut_alpha(cell, 10)
    cell = cell.resize((FRAME, FRAME), Image.Resampling.LANCZOS)
    return clear_frame_edge(hard_cut_alpha(cell, 30))


def draw_walk_cell(sprite, frame):
    cell = make_cell()
    bob = [0, -2, -4, -2, 0, -2, -4, -2][frame]
    drift = [-2, -1, 0, 1, 2, 1, 0, -1][frame]
    place_sprite(cell, sprite, x=sx(128 + drift), bottom=sx(236 + bob), scale=SCALE)
    draw = ImageDraw.Draw(cell, "RGBA")
    shadow_w = 46 + abs(drift) * 2
    draw.ellipse((sx(128 - shadow_w), sx(232), sx(128 + shadow_w), sx(241)), fill=(28, 16, 8, 40))
    return finalize(cell)


def draw_hadoken_cell(sprite, frame):
    cell = make_cell()
    prep = min(frame, 4) / 4
    recoil = [0, -2, -4, -2, 1, 2, 1, 0][frame]
    place_sprite(cell, sprite, x=sx(123 + recoil), bottom=sx(236), scale=SCALE, rotate=[0, -2, -3, -2, 1, 2, 1, 0][frame])
    ball_x = 150 + prep * 44 + max(0, frame - 4) * 8
    ball_y = 124 - sin(frame / 7 * pi) * 3
    radius = 10 + prep * 17 + (2 if frame >= 5 else 0)
    draw_glow_circle(cell, ball_x, ball_y, radius * 2.0, (72, 218, 255, 80 + frame * 4), 10)
    draw_glow_circle(cell, ball_x, ball_y, radius * 1.25, (118, 246, 255, 120), 5)
    draw = ImageDraw.Draw(cell, "RGBA")
    draw.ellipse((sx(ball_x - radius), sx(ball_y - radius), sx(ball_x + radius), sx(ball_y + radius)), fill=(226, 255, 255, 210))
    for ring in range(3):
        offset = ring * 7 + frame % 3
        draw_scaled_arc(draw, (ball_x - radius - offset, ball_y - radius - offset, ball_x + radius + offset, ball_y + radius + offset), 204, 156, (91, 225, 255, 120 - ring * 28), 3)
    for trail in range(4):
        y = ball_y + sin(frame + trail) * 5
        draw.line((sx(ball_x - 34 - trail * 7), sx(y), sx(ball_x - 8), sx(y + 2)), fill=(96, 225, 255, 84 - trail * 13), width=sx(3))
    return finalize(cell)


def draw_shoryuken_cell(sprite, frame):
    cell = make_cell()
    jump = [0, -10, -26, -42, -54, -44, -22, -4][frame]
    angle = [0, -5, -9, -7, 4, 8, 4, 0][frame]
    x = 126 + [0, 1, 3, 6, 8, 7, 3, 0][frame]
    place_sprite(cell, sprite, x=sx(x), bottom=sx(236 + jump), scale=SCALE, rotate=angle)
    draw = ImageDraw.Draw(cell, "RGBA")
    flame_alpha = 80 + frame * 10 if frame < 5 else 120 - frame * 8
    draw_glow_circle(cell, x + 28, 158 + jump * 0.35, 38, (255, 142, 64, max(40, flame_alpha)), 9)
    points = [
        (x + 18, 202 + jump * 0.35),
        (x + 38, 172 + jump * 0.2),
        (x + 28, 134 + jump * 0.12),
        (x + 48, 96 + jump * 0.08),
        (x + 22, 124 + jump * 0.16),
        (x + 8, 168 + jump * 0.25),
    ]
    draw.line([(sx(px), sx(py)) for px, py in points], fill=(255, 226, 120, 170), width=sx(8))
    draw.line([(sx(px - 7), sx(py + 8)) for px, py in points[:5]], fill=(255, 84, 47, 110), width=sx(5))
    if frame in (3, 4, 5):
        draw_scaled_arc(draw, (68, 58, 204, 180), 230, 70, (255, 246, 188, 160), 5)
    return finalize(cell)


def draw_whirlwind_cell(sprite, frame):
    cell = make_cell()
    angle = [-11, 8, -7, 13, -13, 7, -8, 10][frame]
    x = 128 + cos(frame / COLS * pi * 2) * 4
    y_bottom = 226 + sin(frame / COLS * pi * 2) * 2
    for ghost in range(2):
        ghost_angle = angle + (ghost + 1) * (-18 if frame % 2 else 18)
        ghost_x = x - 9 * (ghost + 1)
        place_sprite(cell, sprite, x=sx(ghost_x), bottom=sx(y_bottom), scale=SCALE * (0.97 - ghost * 0.03), rotate=ghost_angle, alpha=62 - ghost * 18)
    place_sprite(cell, sprite, x=sx(x), bottom=sx(y_bottom), scale=SCALE, rotate=angle)
    draw = ImageDraw.Draw(cell, "RGBA")
    phase = frame / COLS * 360
    for band in range(3):
        inset = band * 12
        alpha = 150 - band * 38
        draw_scaled_arc(draw, (48 + inset, 92 + band * 5, 210 - inset, 196 - band * 4), phase + 25, phase + 290, (124, 239, 255, alpha), 5 - band)
        draw_scaled_arc(draw, (46 + inset, 112 + band * 4, 212 - inset, 212 - band * 3), phase + 206, phase + 494, (255, 236, 150, alpha - 28), 3)
    for spark in range(6):
        t = frame * 0.9 + spark
        px = 128 + cos(t) * (48 + spark * 3)
        py = 150 + sin(t * 1.18) * (32 + spark * 2)
        draw.ellipse((sx(px - 2), sx(py - 2), sx(px + 2), sx(py + 2)), fill=(231, 255, 255, 120))
    return finalize(cell)


def build_sheet():
    source_frames = extract_ryu_frames()
    sheet = Image.new("RGBA", (COLS * FRAME, ROWS * FRAME), (0, 0, 0, 0))
    builders = [draw_walk_cell, draw_hadoken_cell, draw_shoryuken_cell, draw_whirlwind_cell]
    for row, builder in enumerate(builders):
        for col in range(COLS):
            source_index = col if row == 0 else [0, 1, 2, 2, 3, 4, 5, 0][col]
            cell = builder(source_frames[source_index], col)
            sheet.alpha_composite(cell, (col * FRAME, row * FRAME))
    sheet.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build_sheet()
