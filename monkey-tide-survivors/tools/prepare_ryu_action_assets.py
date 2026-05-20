from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SOURCE = SPRITES / "fighters_walkcycles_imagen_hd_clean_v2.png"
OUT_ACTION = SPRITES / "ryu_action_sheet_imagen_hd_v3.png"
OUT_HADOKEN = SPRITES / "ryu_hadoken_fx_imagen_hd_v2.png"

FRAME = 256
COLS = 12
ACTION_ROWS = 5
HADOKEN_ROWS = 4
SCALE = 2
RYU_ROW = 0


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
        canvas.alpha_composite(frame, ((max_w - frame.width) // 2, max_h - frame.height))
        normalized.append(hard_cut_alpha(canvas, 28))
    return normalized


def extract_ryu_frames():
    source = Image.open(SOURCE).convert("RGBA")
    frames = []
    source_cols = 8
    for col in range(source_cols):
        box = (col * FRAME, RYU_ROW * FRAME, (col + 1) * FRAME, (RYU_ROW + 1) * FRAME)
        frames.append(crop_visible(source.crop(box)))
    return normalize_source_frames(frames)


def make_cell():
    return Image.new("RGBA", (FRAME * SCALE, FRAME * SCALE), (0, 0, 0, 0))


def draw_glow_circle(layer, cx, cy, radius, color, blur=7):
    draw = ImageDraw.Draw(layer, "RGBA")
    r, g, b, a = color
    steps = max(3, min(8, int(blur // 2) + 3))
    for index in range(steps, 0, -1):
        t = index / steps
        grow = 1 + t * 0.7
        alpha = round(a * (1 - t * 0.7))
        if alpha <= 0:
            continue
        rr = radius * grow
        draw.ellipse((sx(cx - rr), sx(cy - rr), sx(cx + rr), sx(cy + rr)), fill=(r, g, b, alpha))
    draw.ellipse((sx(cx - radius), sx(cy - radius), sx(cx + radius), sx(cy + radius)), fill=color)


def draw_scaled_arc(draw, box, start, end, fill, width):
    draw.arc(tuple(sx(v) for v in box), start=start, end=end, fill=fill, width=max(1, sx(width)))


def draw_scaled_line(draw, points, fill, width):
    draw.line([(sx(x), sx(y)) for x, y in points], fill=fill, width=max(1, sx(width)))


def draw_shadow(cell, cx=128, y=235, width=54, height=9, alpha=42):
    draw = ImageDraw.Draw(cell, "RGBA")
    draw.ellipse((sx(cx - width), sx(y - height / 2), sx(cx + width), sx(y + height / 2)), fill=(26, 15, 9, alpha))


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
    bob = [0, -2, -4, -5, -3, -1, 0, -2, -4, -5, -3, -1][frame]
    drift = [-4, -3, -1, 1, 3, 4, 4, 3, 1, -1, -3, -4][frame]
    lean = [-3, -3, -1, 1, 3, 2, -1, -3, -2, 1, 3, 1][frame]
    draw_shadow(cell, 128, 236, 52 + abs(drift) * 2, 8, 40)
    if frame in (1, 2, 5, 6):
        draw = ImageDraw.Draw(cell, "RGBA")
        draw_scaled_arc(draw, (80, 166, 178, 223), 204, 330, (245, 245, 245, 64), 4)
    place_sprite(cell, sprite, x=128 + drift, bottom=236 + bob, scale=1.08, rotate=lean)
    return finalize(cell)


def draw_hadoken_cell(sprite, frame):
    cell = make_cell()
    prep = min(frame, 8) / 8
    recoil = [-9, -8, -7, -5, -2, 0, 3, 6, 7, 5, 2, 0][frame]
    draw_shadow(cell, 124, 236, 55, 8, 42)
    if frame > 0:
        ghost_alpha = 38 + min(frame, 6) * 5
        place_sprite(cell, sprite, x=118 + recoil - 7, bottom=235, scale=1.06, rotate=-5, alpha=min(76, ghost_alpha))
    place_sprite(cell, sprite, x=124 + recoil, bottom=236, scale=1.08, rotate=[0, -2, -4, -5, -4, -2, 1, 4, 5, 3, 1, 0][frame])
    draw = ImageDraw.Draw(cell, "RGBA")
    ball_x = 146 + prep * 48 + max(0, frame - 8) * 8
    ball_y = 124 + sin(frame / (COLS - 1) * pi) * 3
    radius = 10 + prep * 22 + (3 if frame >= 8 else 0)
    draw_glow_circle(cell, ball_x, ball_y, radius * 2.35, (73, 221, 255, 98 + frame * 3), 10)
    draw_glow_circle(cell, ball_x, ball_y, radius * 1.32, (226, 255, 255, 134), 5)
    draw.ellipse((sx(ball_x - radius), sx(ball_y - radius), sx(ball_x + radius), sx(ball_y + radius)), fill=(228, 255, 255, 228))
    draw.ellipse((sx(ball_x - radius * 0.48), sx(ball_y - radius * 0.48), sx(ball_x + radius * 0.48), sx(ball_y + radius * 0.48)), fill=(99, 231, 255, 236))
    for ring in range(4):
        offset = ring * 7 + frame % 4
        draw_scaled_arc(draw, (ball_x - radius - offset, ball_y - radius - offset, ball_x + radius + offset, ball_y + radius + offset), 202 + ring * 12, 160 + ring * 10, (96, 229, 255, 134 - ring * 24), 3)
    for trail in range(5):
        y = ball_y + sin(frame + trail) * 6
        draw_scaled_line(draw, [(ball_x - 43 - trail * 8, y), (ball_x - 8, y + 2)], (100, 225, 255, 104 - trail * 13), 3)
    return finalize(cell)


def draw_shoryuken_cell(sprite, frame):
    cell = make_cell()
    jump = [0, -7, -17, -31, -46, -60, -67, -58, -42, -24, -10, -2][frame]
    angle = [0, -4, -8, -13, -12, -6, 5, 13, 12, 6, 2, 0][frame]
    x = 126 + [0, 1, 3, 6, 9, 11, 12, 10, 7, 4, 1, 0][frame]
    draw_shadow(cell, 126, 236, 52, 8, max(18, 42 + jump))
    if frame in (2, 3, 4, 5, 6, 7, 8):
        place_sprite(cell, sprite, x=x - 10, bottom=236 + jump + 10, scale=1.03, rotate=angle - 15, alpha=54)
    place_sprite(cell, sprite, x=x, bottom=236 + jump, scale=1.08, rotate=angle)
    draw = ImageDraw.Draw(cell, "RGBA")
    glow_alpha = 92 + frame * 8 if frame < 7 else 168 - frame * 8
    draw_glow_circle(cell, x + 27, 156 + jump * 0.32, 42, (255, 138, 58, max(50, glow_alpha)), 9)
    flame = [
        (x + 12, 205 + jump * 0.36),
        (x + 38, 174 + jump * 0.22),
        (x + 25, 136 + jump * 0.15),
        (x + 52, 92 + jump * 0.1),
        (x + 24, 121 + jump * 0.16),
        (x + 5, 168 + jump * 0.27),
    ]
    draw_scaled_line(draw, flame, (255, 224, 108, 186), 8)
    draw_scaled_line(draw, [(px - 8, py + 9) for px, py in flame[:-1]], (255, 84, 45, 126), 5)
    if frame in (4, 5, 6, 7, 8):
        draw_scaled_arc(draw, (58, 53, 210, 184), 226, 74, (255, 247, 188, 162), 5)
    return finalize(cell)


def draw_whirlwind_cell(sprite, frame):
    cell = make_cell()
    phase = frame / COLS * 2 * pi
    draw_shadow(cell, 128, 236, 62, 8, 34)
    for ghost in range(3):
        t = phase - ghost * 0.68
        place_sprite(
            cell,
            sprite,
            x=128 + cos(t) * (9 + ghost * 3),
            bottom=226 + sin(t) * 6,
            scale=1.05 - ghost * 0.04,
            rotate=[-13, -2, 13, 5, -9, 15, 2, -15, -4, 9, -12, 12][frame] + ghost * 18,
            alpha=88 - ghost * 22,
        )
    place_sprite(cell, sprite, x=128 + cos(phase) * 5, bottom=226 + sin(phase) * 3, scale=1.09, rotate=[-10, 2, 12, 5, -8, 16, 3, -16, -4, 8, -11, 12][frame])
    draw = ImageDraw.Draw(cell, "RGBA")
    spin = frame * 45
    for band in range(4):
        inset = band * 13
        alpha = 164 - band * 28
        draw_scaled_arc(draw, (34 + inset, 78 + band * 7, 226 - inset, 203 - band * 3), spin + 15, spin + 310, (96, 232, 255, alpha), max(2, 6 - band))
        draw_scaled_arc(draw, (44 + inset, 110 + band * 3, 218 - inset, 226 - band * 4), spin + 188, spin + 482, (255, 231, 92, max(48, alpha - 40)), max(2, 4 - band))
    return finalize(cell)


def draw_focus_cell(sprite, frame):
    cell = make_cell()
    pulse = sin(frame / COLS * 2 * pi)
    draw_shadow(cell, 128, 236, 54, 8, 42)
    if frame in (2, 3, 4, 5):
        place_sprite(cell, sprite, x=126, bottom=236, scale=1.07, rotate=-3, alpha=54)
    place_sprite(cell, sprite, x=128 + pulse * 2, bottom=236 - abs(pulse) * 2, scale=1.08, rotate=pulse * 3)
    draw = ImageDraw.Draw(cell, "RGBA")
    for ring in range(3):
        inset = ring * 16 + frame % 3
        alpha = 132 - ring * 30
        draw_scaled_arc(draw, (56 + inset, 78 + ring * 12, 210 - inset, 218 - ring * 8), frame * 26 + ring * 30, frame * 26 + 286 + ring * 25, (110, 231, 255, alpha), 4)
    draw_glow_circle(cell, 147, 126, 18 + abs(pulse) * 6, (92, 229, 255, 86), 7)
    return finalize(cell)


def build_action_sheet(source_frames):
    sheet = Image.new("RGBA", (COLS * FRAME, ACTION_ROWS * FRAME), (0, 0, 0, 0))
    builders = [
        draw_walk_cell,
        draw_hadoken_cell,
        draw_shoryuken_cell,
        draw_whirlwind_cell,
        draw_focus_cell,
    ]
    source_by_action = [
        [0, 1, 1, 2, 3, 4, 4, 5, 6, 7, 7, 0],
        [0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 2, 0],
        [0, 0, 1, 2, 3, 4, 5, 6, 6, 5, 2, 0],
        [2, 3, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2],
        [0, 0, 0, 1, 1, 2, 2, 1, 1, 0, 0, 0],
    ]
    for row, builder in enumerate(builders):
        for col in range(COLS):
            sheet.alpha_composite(builder(source_frames[source_by_action[row][col]], col), (col * FRAME, row * FRAME))
    sheet.save(OUT_ACTION)
    print(f"wrote {OUT_ACTION.relative_to(ROOT)}")


def projectile_hadoken(stage, frame):
    cell = make_cell()
    draw = ImageDraw.Draw(cell, "RGBA")
    phase = frame / COLS * 2 * pi
    cx = 125 + cos(phase) * (4 + stage)
    cy = 128 + sin(phase * 1.1) * (4 + stage * 0.5)
    radius = 22 + stage * 6 + sin(phase) * 2
    glow = (60, 216, 255, 94 + stage * 18)
    core = (227, 255, 255, 224)
    draw_glow_circle(cell, cx, cy, radius * (2.25 + stage * 0.08), glow, 10)
    draw_glow_circle(cell, cx, cy, radius * 1.28, (255, 255, 242, 120 + stage * 12), 5)
    draw.ellipse((sx(cx - radius), sx(cy - radius), sx(cx + radius), sx(cy + radius)), fill=core)
    draw.ellipse((sx(cx - radius * 0.46), sx(cy - radius * 0.46), sx(cx + radius * 0.46), sx(cy + radius * 0.46)), fill=(87, 231, 255, 232))
    for ring in range(5 + stage):
        offset = ring * (7 + stage) + frame % 4
        alpha = 148 - ring * 17
        if alpha <= 0:
            continue
        draw_scaled_arc(draw, (cx - radius - offset, cy - radius - offset, cx + radius + offset, cy + radius + offset), 202 + ring * 13 + stage * 8, 160 + ring * 11, (99, 231, 255, alpha), 3 + min(stage, 2))
    for trail in range(6 + stage):
        yy = cy + sin(frame * 0.9 + trail) * (7 + stage)
        draw_scaled_line(draw, [(cx - radius - 46 - trail * 8, yy), (cx - radius * 0.45, yy + 2)], (97, 225, 255, 118 - trail * 11), 4)
    if stage >= 2:
        for spark in range(9):
            t = frame * 0.7 + spark * 0.6
            px = cx + cos(t) * (radius + 16 + spark * 2)
            py = cy + sin(t * 1.13) * (radius * 0.72 + spark)
            draw.ellipse((sx(px - 2.2), sx(py - 2.2), sx(px + 2.2), sx(py + 2.2)), fill=(238, 255, 255, 124))
    return finalize(cell)


def build_hadoken_sheet():
    sheet = Image.new("RGBA", (COLS * FRAME, HADOKEN_ROWS * FRAME), (0, 0, 0, 0))
    for row in range(HADOKEN_ROWS):
        for col in range(COLS):
            sheet.alpha_composite(projectile_hadoken(row, col), (col * FRAME, row * FRAME))
    sheet.save(OUT_HADOKEN)
    print(f"wrote {OUT_HADOKEN.relative_to(ROOT)}")


def main():
    frames = extract_ryu_frames()
    build_action_sheet(frames)
    build_hadoken_sheet()


if __name__ == "__main__":
    main()
