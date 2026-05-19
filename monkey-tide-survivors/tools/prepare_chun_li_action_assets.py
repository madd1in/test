from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SOURCE = SPRITES / "fighters_walkcycles_imagen_hd_clean_v2.png"
OUT_ACTION = SPRITES / "chun_li_action_sheet_imagen_hd.png"
OUT_PROJECTILES = SPRITES / "chun_li_projectile_fx_imagen_hd.png"

FRAME = 256
COLS = 8
ACTION_ROWS = 5
PROJECTILE_ROWS = 3
SCALE = 2
CHUN_LI_ROW = 3


def sx(value):
    return int(round(value * SCALE))


def hard_cut_alpha(image, threshold=28):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        if pixels[index + 3] <= threshold:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def clear_frame_edge(image, border=2):
    image = image.convert("RGBA")
    pixels = image.load()
    w, h = image.size
    for x in range(w):
        for y in range(border):
            pixels[x, y] = (0, 0, 0, 0)
            pixels[x, h - 1 - y] = (0, 0, 0, 0)
    for y in range(h):
        for x in range(border):
            pixels[x, y] = (0, 0, 0, 0)
            pixels[w - 1 - x, y] = (0, 0, 0, 0)
    return image


def crop_visible(image):
    image = hard_cut_alpha(image, 28)
    bbox = image.getchannel("A").getbbox()
    return image.crop(bbox) if bbox else Image.new("RGBA", (1, 1), (0, 0, 0, 0))


def normalize_source_frames(frames):
    max_w = max(frame.width for frame in frames)
    max_h = max(frame.height for frame in frames)
    normalized = []
    for frame in frames:
        canvas = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
        x = (max_w - frame.width) // 2
        y = max_h - frame.height
        canvas.alpha_composite(frame, (x, y))
        normalized.append(hard_cut_alpha(canvas, 28))
    return normalized


def extract_chun_li_frames():
    source = Image.open(SOURCE).convert("RGBA")
    frames = []
    for col in range(COLS):
        box = (col * FRAME, CHUN_LI_ROW * FRAME, (col + 1) * FRAME, (CHUN_LI_ROW + 1) * FRAME)
        frames.append(crop_visible(source.crop(box)))
    return normalize_source_frames(frames)


def make_cell():
    return Image.new("RGBA", (FRAME * SCALE, FRAME * SCALE), (0, 0, 0, 0))


def glow_layer(size, blur, draw_fn):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer, "RGBA"))
    return layer.filter(ImageFilter.GaussianBlur(sx(blur)))


def draw_glow_circle(layer, cx, cy, radius, color, blur=7):
    draw = ImageDraw.Draw(layer, "RGBA")
    r, g, b, a = color
    steps = max(3, min(7, int(blur // 2) + 2))
    for index in range(steps, 0, -1):
        t = index / steps
        grow = 1 + t * 0.62
        alpha = round(a * (1 - t * 0.72))
        if alpha <= 0:
            continue
        rr = radius * grow
        draw.ellipse((sx(cx - rr), sx(cy - rr), sx(cx + rr), sx(cy + rr)), fill=(r, g, b, alpha))
    draw.ellipse((sx(cx - radius), sx(cy - radius), sx(cx + radius), sx(cy + radius)), fill=color)


def draw_scaled_arc(draw, box, start, end, fill, width):
    draw.arc(tuple(sx(v) for v in box), start=start, end=end, fill=fill, width=max(1, sx(width)))


def draw_scaled_line(draw, points, fill, width):
    draw.line([(sx(x), sx(y)) for x, y in points], fill=fill, width=max(1, sx(width)))


def draw_shadow(cell, cx=128, y=234, width=55, height=9, alpha=42):
    draw = ImageDraw.Draw(cell, "RGBA")
    draw.ellipse((sx(cx - width), sx(y - height / 2), sx(cx + width), sx(y + height / 2)), fill=(28, 14, 7, alpha))


def place_sprite(cell, sprite, x=128, bottom=236, scale=1.0, rotate=0, alpha=255):
    work = sprite
    target_scale = SCALE * scale
    if target_scale != 1.0:
        work = work.resize((
            max(1, round(work.width * target_scale)),
            max(1, round(work.height * target_scale)),
        ), Image.Resampling.LANCZOS)
    if rotate:
        work = work.rotate(rotate, resample=Image.Resampling.BICUBIC, expand=True)
    if alpha < 255:
        r, g, b, a = work.split()
        a = a.point(lambda value: round(value * alpha / 255))
        work = Image.merge("RGBA", (r, g, b, a))
    work = hard_cut_alpha(work, 18)
    left = sx(x) - work.width // 2
    top = sx(bottom) - work.height
    cell.alpha_composite(work, (left, top))


def finalize(cell):
    cell = hard_cut_alpha(cell, 10)
    cell = cell.resize((FRAME, FRAME), Image.Resampling.LANCZOS)
    return clear_frame_edge(hard_cut_alpha(cell, 34), 2)


def draw_walk_cell(sprite, frame):
    cell = make_cell()
    bob = [0, -2, -4, -2, 0, -2, -4, -2][frame]
    drift = [-3, -2, 0, 2, 3, 2, 0, -2][frame]
    draw_shadow(cell, 128, 235, 49 + abs(drift) * 2, 8, 38)
    if frame in (1, 2, 5, 6):
        draw = ImageDraw.Draw(cell, "RGBA")
        draw_scaled_arc(draw, (88, 166, 176, 224), 202, 338, (255, 230, 95, 88), 4)
        draw_scaled_arc(draw, (94, 171, 170, 226), 196, 330, (102, 238, 255, 70), 3)
    place_sprite(cell, sprite, x=128 + drift, bottom=236 + bob, scale=1.06)
    return finalize(cell)


def draw_thousand_kick_cell(sprite, frame):
    cell = make_cell()
    phase = frame / COLS * 2 * pi
    draw_shadow(cell, 126, 235, 58, 8, 36)
    for ghost in range(2):
        ghost_phase = phase - (ghost + 1) * 0.52
        ghost_x = 123 - (ghost + 1) * 8 + cos(ghost_phase) * 4
        ghost_alpha = 74 - ghost * 24
        place_sprite(cell, sprite, x=ghost_x, bottom=230 + sin(ghost_phase) * 4, scale=1.01 - ghost * 0.03, rotate=-7 + ghost * 10, alpha=ghost_alpha)
    kick_lift = [0, -6, -12, -7, 0, -5, -11, -5][frame]
    place_sprite(cell, sprite, x=128 + cos(phase) * 4, bottom=232 + kick_lift, scale=1.04, rotate=[-3, 6, 10, 2, -6, 8, 12, 3][frame])
    draw = ImageDraw.Draw(cell, "RGBA")
    base_angle = frame * 45
    for blade in range(5):
        inset = blade * 7
        alpha = 176 - blade * 26
        draw_scaled_arc(draw, (42 + inset, 106 + blade * 3, 224 - inset, 216 - blade * 2), base_angle + blade * 19, base_angle + 132 + blade * 17, (255, 235, 93, alpha), 5)
        draw_scaled_arc(draw, (52 + inset, 124 + blade * 2, 216 - inset, 224), base_angle + 22 + blade * 12, base_angle + 118 + blade * 16, (116, 238, 255, max(50, alpha - 54)), 3)
    for spark in range(9):
        t = phase + spark * 0.62
        px = 151 + cos(t) * (39 + spark * 2.1)
        py = 174 + sin(t * 1.21) * (20 + spark * 1.2)
        draw.ellipse((sx(px - 2.2), sx(py - 2.2), sx(px + 2.2), sx(py + 2.2)), fill=(248, 255, 236, 132))
    return finalize(cell)


def draw_ki_kou_ken_cell(sprite, frame):
    cell = make_cell()
    prep = min(frame, 5) / 5
    recoil = [-6, -4, -2, 0, 3, 5, 4, 2][frame]
    draw_shadow(cell, 125, 235, 54, 8, 38)
    place_sprite(cell, sprite, x=123 + recoil, bottom=235, scale=1.03, rotate=[0, -2, -4, -2, 2, 4, 2, 0][frame])
    draw = ImageDraw.Draw(cell, "RGBA")
    ball_x = 151 + prep * 35 + max(0, frame - 4) * 9
    ball_y = 128 + sin(frame / 7 * pi) * 2
    radius = 11 + prep * 17 + (4 if frame >= 5 else 0)
    draw_glow_circle(cell, ball_x, ball_y, radius * 2.25, (84, 231, 255, 86 + frame * 5), 10)
    draw_glow_circle(cell, ball_x, ball_y, radius * 1.3, (222, 255, 255, 132), 5)
    draw.ellipse((sx(ball_x - radius), sx(ball_y - radius), sx(ball_x + radius), sx(ball_y + radius)), fill=(223, 255, 255, 224))
    draw.ellipse((sx(ball_x - radius * 0.47), sx(ball_y - radius * 0.47), sx(ball_x + radius * 0.47), sx(ball_y + radius * 0.47)), fill=(120, 241, 255, 228))
    for ring in range(4):
        offset = ring * 7 + (frame % 3)
        draw_scaled_arc(draw, (ball_x - radius - offset, ball_y - radius - offset, ball_x + radius + offset, ball_y + radius + offset), 190 + ring * 12, 164 + ring * 12, (114, 238, 255, 128 - ring * 22), 3)
    for trail in range(5):
        y = ball_y + sin(frame + trail) * 5
        draw_scaled_line(draw, [(ball_x - 44 - trail * 7, y), (ball_x - 9, y + 2)], (111, 230, 255, 96 - trail * 12), 3)
    return finalize(cell)


def draw_whirlwind_kick_cell(sprite, frame):
    cell = make_cell()
    phase = frame / COLS * 2 * pi
    draw_shadow(cell, 128, 235, 60, 8, 34)
    for ghost in range(3):
        t = phase - ghost * 0.68
        place_sprite(
            cell,
            sprite,
            x=128 + cos(t) * (9 + ghost * 3),
            bottom=226 + sin(t) * 6,
            scale=1.0 - ghost * 0.035,
            rotate=[-13, 14, -10, 16, -15, 10, -12, 13][frame] + ghost * 18,
            alpha=96 - ghost * 24,
        )
    place_sprite(cell, sprite, x=128 + cos(phase) * 5, bottom=226 + sin(phase) * 3, scale=1.05, rotate=[-10, 12, -8, 16, -16, 8, -11, 12][frame])
    draw = ImageDraw.Draw(cell, "RGBA")
    spin = frame * 45
    for band in range(4):
        inset = band * 13
        alpha = 164 - band * 28
        draw_scaled_arc(draw, (34 + inset, 80 + band * 8, 226 - inset, 205 - band * 3), spin + 12, spin + 308, (95, 236, 255, alpha), max(2, 6 - band))
        draw_scaled_arc(draw, (44 + inset, 111 + band * 3, 218 - inset, 226 - band * 4), spin + 185, spin + 478, (255, 231, 91, max(48, alpha - 38)), max(2, 4 - band))
    return finalize(cell)


def draw_lightning_kick_cell(sprite, frame):
    cell = make_cell()
    lift = [0, -14, -32, -45, -52, -38, -18, -4][frame]
    draw_shadow(cell, 128, 236, 54, 8, 32)
    place_sprite(cell, sprite, x=127 + [0, 1, 3, 5, 4, 2, 1, 0][frame], bottom=234 + lift, scale=1.05, rotate=[0, -8, -13, -7, 6, 12, 5, 0][frame])
    draw = ImageDraw.Draw(cell, "RGBA")
    strike_x = 151 + cos(frame * 0.6) * 14
    draw_glow_circle(cell, strike_x, 135 + lift * 0.25, 34, (255, 238, 83, 112), 8)
    bolt = [
        (strike_x - 7, 203 + lift * 0.35),
        (strike_x + 13, 172 + lift * 0.25),
        (strike_x + 2, 145 + lift * 0.18),
        (strike_x + 22, 112 + lift * 0.12),
        (strike_x + 5, 132 + lift * 0.16),
        (strike_x - 10, 166 + lift * 0.24),
    ]
    draw_scaled_line(draw, bolt, (255, 244, 138, 184), 7)
    draw_scaled_line(draw, [(x - 7, y + 8) for x, y in bolt], (100, 235, 255, 116), 4)
    if frame in (2, 3, 4, 5):
        draw_scaled_arc(draw, (62, 58, 206, 180), 226, 80, (255, 255, 220, 140), 5)
    return finalize(cell)


def build_action_sheet(source_frames):
    sheet = Image.new("RGBA", (COLS * FRAME, ACTION_ROWS * FRAME), (0, 0, 0, 0))
    builders = [
        draw_walk_cell,
        draw_thousand_kick_cell,
        draw_ki_kou_ken_cell,
        draw_whirlwind_kick_cell,
        draw_lightning_kick_cell,
    ]
    source_by_action = [
        list(range(COLS)),
        [1, 2, 3, 4, 5, 6, 7, 2],
        [0, 1, 1, 2, 2, 3, 4, 0],
        [2, 3, 4, 5, 6, 7, 2, 3],
        [0, 2, 3, 4, 5, 6, 7, 0],
    ]
    for row, builder in enumerate(builders):
        for col in range(COLS):
            cell = builder(source_frames[source_by_action[row][col]], col)
            sheet.alpha_composite(cell, (col * FRAME, row * FRAME))
    sheet.save(OUT_ACTION)
    print(f"wrote {OUT_ACTION.relative_to(ROOT)}")


def draw_projectile_core(cell, cx, cy, radius, frame, color_main=(220, 255, 255, 225), color_glow=(74, 231, 255, 92)):
    draw = ImageDraw.Draw(cell, "RGBA")
    draw_glow_circle(cell, cx, cy, radius * 2.25, color_glow, 10)
    draw_glow_circle(cell, cx, cy, radius * 1.34, (255, 255, 238, 118), 5)
    draw.ellipse((sx(cx - radius), sx(cy - radius), sx(cx + radius), sx(cy + radius)), fill=color_main)
    draw.ellipse((sx(cx - radius * 0.46), sx(cy - radius * 0.46), sx(cx + radius * 0.46), sx(cy + radius * 0.46)), fill=(115, 243, 255, 230))
    for ring in range(5):
        offset = ring * 8 + frame % 4
        alpha = 144 - ring * 20
        draw_scaled_arc(draw, (cx - radius - offset, cy - radius - offset, cx + radius + offset, cy + radius + offset), 198 + ring * 14, 160 + ring * 12, (116, 239, 255, alpha), 4)
    for trail in range(6):
        yy = cy + sin(frame * 0.85 + trail) * 8
        draw_scaled_line(draw, [(cx - radius - 48 - trail * 8, yy), (cx - radius * 0.55, yy + 2)], (96, 229, 255, 110 - trail * 12), 4)


def projectile_ki_kou_ken(frame):
    cell = make_cell()
    cx = 125 + cos(frame / COLS * 2 * pi) * 5
    cy = 128 + sin(frame / COLS * 2 * pi) * 4
    radius = 25 + sin(frame / COLS * 2 * pi) * 2
    draw_projectile_core(cell, cx, cy, radius, frame)
    return finalize(cell)


def projectile_thousand_kick(frame):
    cell = make_cell()
    draw = ImageDraw.Draw(cell, "RGBA")
    phase = frame * 45
    draw_glow_circle(cell, 134, 154, 63, (255, 228, 70, 82), 10)
    for blade in range(6):
        inset = blade * 9
        alpha = 190 - blade * 23
        draw_scaled_arc(draw, (34 + inset, 70 + blade * 8, 224 - inset, 218 - blade * 4), phase + blade * 18, phase + 138 + blade * 16, (255, 238, 104, alpha), max(2, 7 - blade))
        draw_scaled_arc(draw, (50 + inset, 112 + blade * 4, 212 - inset, 232 - blade * 4), phase + 42 + blade * 12, phase + 160 + blade * 15, (105, 235, 255, max(50, alpha - 62)), 3)
    for spark in range(12):
        t = frame * 0.8 + spark * 0.58
        px = 130 + cos(t) * (43 + spark * 2)
        py = 150 + sin(t * 1.17) * (30 + spark * 1.6)
        draw.ellipse((sx(px - 2.7), sx(py - 2.7), sx(px + 2.7), sx(py + 2.7)), fill=(255, 255, 229, 140))
    return finalize(cell)


def projectile_whirlwind(frame):
    cell = make_cell()
    draw = ImageDraw.Draw(cell, "RGBA")
    spin = frame * 45
    draw_glow_circle(cell, 128, 142, 72, (92, 230, 255, 74), 11)
    for band in range(5):
        inset = band * 11
        alpha = 178 - band * 25
        draw_scaled_arc(draw, (28 + inset, 56 + band * 8, 228 - inset, 212 - band * 4), spin + 20, spin + 318, (101, 239, 255, alpha), max(2, 7 - band))
        draw_scaled_arc(draw, (42 + inset, 101 + band * 3, 220 - inset, 232 - band * 5), spin + 191, spin + 492, (255, 236, 111, max(50, alpha - 45)), max(2, 5 - band))
    for spark in range(10):
        t = frame * 0.9 + spark * 0.7
        px = 128 + cos(t) * (36 + spark * 4)
        py = 143 + sin(t * 1.1) * (24 + spark * 3)
        draw.ellipse((sx(px - 2.4), sx(py - 2.4), sx(px + 2.4), sx(py + 2.4)), fill=(228, 255, 255, 122))
    return finalize(cell)


def build_projectile_sheet():
    builders = [projectile_ki_kou_ken, projectile_thousand_kick, projectile_whirlwind]
    sheet = Image.new("RGBA", (COLS * FRAME, PROJECTILE_ROWS * FRAME), (0, 0, 0, 0))
    for row, builder in enumerate(builders):
        for col in range(COLS):
            sheet.alpha_composite(builder(col), (col * FRAME, row * FRAME))
    sheet.save(OUT_PROJECTILES)
    print(f"wrote {OUT_PROJECTILES.relative_to(ROOT)}")


def main():
    source_frames = extract_chun_li_frames()
    build_action_sheet(source_frames)
    build_projectile_sheet()


if __name__ == "__main__":
    main()
