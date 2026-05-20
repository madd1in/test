from math import cos, pi, sin
from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SOURCE = SPRITES / "fighters_walkcycles_imagen_hd_clean_v2.png"
OUT_ACTION = SPRITES / "ryu_action_sheet_imagen_hd_v4.png"
OUT_HADOKEN = SPRITES / "ryu_hadoken_fx_imagen_hd_v3.png"

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


def blur_layer(cell, blur, draw_fn):
    layer = Image.new("RGBA", cell.size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer, "RGBA"))
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(sx(blur)))
    cell.alpha_composite(layer)


def paint_energy_blob(cell, cx, cy, radius, frame, stage=0, seed=0, tint=(78, 221, 255)):
    rng = Random(seed + frame * 811 + stage * 1543)
    r, g, b = tint

    def outer(draw):
        for i in range(22 + stage * 5):
            angle = i * 2 * pi / (22 + stage * 5) + rng.uniform(-0.18, 0.18)
            dist = rng.uniform(radius * 0.08, radius * (0.74 + stage * 0.03))
            rx = radius * rng.uniform(0.42, 0.9)
            ry = radius * rng.uniform(0.28, 0.74)
            px = cx + cos(angle) * dist
            py = cy + sin(angle) * dist
            alpha = rng.randint(38, 86) + stage * 12
            draw.ellipse((sx(px - rx), sx(py - ry), sx(px + rx), sx(py + ry)), fill=(r, g, b, alpha))

    blur_layer(cell, 6 + stage, outer)

    def body(draw):
        for i in range(16 + stage * 4):
            angle = i * 2 * pi / (16 + stage * 4) + frame * 0.19
            dist = rng.uniform(0, radius * 0.52)
            rx = radius * rng.uniform(0.2, 0.58)
            ry = radius * rng.uniform(0.18, 0.46)
            px = cx + cos(angle) * dist + rng.uniform(-2.5, 2.5)
            py = cy + sin(angle * 1.13) * dist + rng.uniform(-2.5, 2.5)
            draw.ellipse((sx(px - rx), sx(py - ry), sx(px + rx), sx(py + ry)), fill=(r + 16, min(255, g + 18), 255, rng.randint(105, 176)))
        for i in range(8 + stage * 2):
            angle = frame * 0.42 + i * 0.82 + rng.uniform(-0.16, 0.16)
            x1 = cx + cos(angle) * radius * rng.uniform(0.18, 0.42)
            y1 = cy + sin(angle) * radius * rng.uniform(0.18, 0.42)
            x2 = cx + cos(angle + 0.74) * radius * rng.uniform(0.62, 1.08)
            y2 = cy + sin(angle + 0.74) * radius * rng.uniform(0.62, 0.94)
            draw_scaled_line(draw, [(x1, y1), ((x1 + x2) / 2, (y1 + y2) / 2 + rng.uniform(-8, 8)), (x2, y2)], (235, 255, 255, rng.randint(128, 190)), rng.uniform(1.8, 3.8))

    blur_layer(cell, 1.1, body)

    def core(draw):
        core_r = radius * rng.uniform(0.22, 0.34)
        draw.ellipse((sx(cx - core_r), sx(cy - core_r), sx(cx + core_r), sx(cy + core_r)), fill=(234, 255, 255, 196))
        hot_r = core_r * 0.46
        draw.ellipse((sx(cx - hot_r), sx(cy - hot_r), sx(cx + hot_r), sx(cy + hot_r)), fill=(255, 255, 246, 224))

    blur_layer(cell, 0.25, core)


def paint_energy_trail(cell, cx, cy, radius, frame, stage=0, seed=0, tint=(82, 222, 255)):
    rng = Random(seed + frame * 733 + stage * 1399)
    r, g, b = tint

    def trail(draw):
        for i in range(9 + stage * 2):
            y = cy + rng.uniform(-radius * 0.58, radius * 0.58) + sin(frame * 0.7 + i) * 4
            x0 = cx - radius * rng.uniform(1.05, 1.7) - i * rng.uniform(4.0, 7.2)
            x1 = cx - radius * rng.uniform(0.25, 0.5)
            wobble = rng.uniform(-8, 8)
            draw_scaled_line(draw, [(x0, y + wobble), ((x0 + x1) / 2, y - wobble * 0.4), (x1, y + rng.uniform(-3, 3))], (r, g, b, max(36, 160 - i * 10)), rng.uniform(2.8, 6.4))
        for dust in range(18 + stage * 5):
            px = cx - radius * rng.uniform(0.8, 2.2)
            py = cy + rng.uniform(-radius * 0.9, radius * 0.9)
            rr = rng.uniform(1.1, 3.3 + stage * 0.4)
            draw.ellipse((sx(px - rr), sx(py - rr), sx(px + rr), sx(py + rr)), fill=(190, 250, 255, rng.randint(60, 132)))

    blur_layer(cell, 1.8, trail)


def paint_flame_plume(cell, cx, cy, frame, lift, seed=0):
    rng = Random(seed + frame * 971)

    def smoke(draw):
        for i in range(17):
            t = i / 16
            px = cx + rng.uniform(-16, 24) + sin(frame * 0.45 + i) * 6
            py = cy - t * 104 + lift * 0.08 + rng.uniform(-7, 7)
            rx = rng.uniform(8, 24) * (1.05 - t * 0.3)
            ry = rng.uniform(12, 34) * (1.05 - t * 0.22)
            color = (255, rng.randint(92, 172), rng.randint(34, 80), rng.randint(30, 78))
            draw.ellipse((sx(px - rx), sx(py - ry), sx(px + rx), sx(py + ry)), fill=color)

    blur_layer(cell, 4.4, smoke)

    def flame(draw):
        for i in range(11):
            t = i / 10
            px = cx + sin(frame * 0.62 + i * 0.72) * (11 + t * 11)
            py = cy - t * 94 + lift * 0.12
            draw_scaled_line(
                draw,
                [(px - 10, py + 25), (px + rng.uniform(-8, 8), py - 2), (px + rng.uniform(7, 23), py - 36)],
                (255, 220 - int(t * 60), 76, 142 - int(t * 48)),
                5.4 - t * 2.2,
            )
            draw_scaled_line(
                draw,
                [(px - 18, py + 31), (px + rng.uniform(-10, 10), py + 4), (px + rng.uniform(4, 18), py - 22)],
                (255, 82, 49, 98 - int(t * 28)),
                4.2 - t * 1.6,
            )

    blur_layer(cell, 1.4, flame)


def paint_motion_brush(cell, frame, seed=0, tint=(90, 230, 255)):
    rng = Random(seed + frame * 557)
    r, g, b = tint

    def strokes(draw):
        for i in range(18):
            angle = frame * 0.31 + i * 0.42 + rng.uniform(-0.35, 0.35)
            rx = rng.uniform(42, 82)
            ry = rng.uniform(22, 48)
            cx = 128 + cos(angle) * rng.uniform(2, 9)
            cy = 175 + sin(angle * 1.08) * rng.uniform(2, 13)
            x1 = cx + cos(angle) * rx
            y1 = cy + sin(angle) * ry
            x2 = cx + cos(angle + 0.94) * rx
            y2 = cy + sin(angle + 0.94) * ry
            mid = (cx + cos(angle + 0.48) * rx * 0.92, cy + sin(angle + 0.48) * ry * 0.92)
            alpha = rng.randint(42, 106)
            draw_scaled_line(draw, [(x1, y1), mid, (x2, y2)], (r, g, b, alpha), rng.uniform(2.2, 5.4))
        for i in range(12):
            angle = frame * 0.27 + i * 0.58
            draw_scaled_line(
                draw,
                [
                    (128 + cos(angle) * 48, 182 + sin(angle) * 28),
                    (128 + cos(angle + 0.58) * 72, 182 + sin(angle + 0.58) * 41),
                ],
                (255, 236, 118, rng.randint(32, 86)),
                rng.uniform(1.2, 3.0),
            )

    blur_layer(cell, 1.2, strokes)


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
    ball_x = 146 + prep * 38 + max(0, frame - 7) * 5
    ball_y = 124 + sin(frame / (COLS - 1) * pi) * 3
    radius = 7 + prep * 17 + (2 if frame >= 8 else 0)
    paint_energy_trail(cell, ball_x, ball_y, radius, frame, 1, 3100)
    paint_energy_blob(cell, ball_x, ball_y, radius, frame, 1, 3300)
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
    paint_flame_plume(cell, x + 24, 206 + jump * 0.34, frame, jump, 4100)
    if frame in (4, 5, 6, 7, 8):
        paint_motion_brush(cell, frame, 4200, (255, 211, 96))
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
    paint_motion_brush(cell, frame, 5100)
    return finalize(cell)


def draw_focus_cell(sprite, frame):
    cell = make_cell()
    pulse = sin(frame / COLS * 2 * pi)
    draw_shadow(cell, 128, 236, 54, 8, 42)
    if frame in (2, 3, 4, 5):
        place_sprite(cell, sprite, x=126, bottom=236, scale=1.07, rotate=-3, alpha=54)
    place_sprite(cell, sprite, x=128 + pulse * 2, bottom=236 - abs(pulse) * 2, scale=1.08, rotate=pulse * 3)
    paint_energy_trail(cell, 145 + pulse * 4, 132, 17 + abs(pulse) * 5, frame, 0, 6100)
    paint_energy_blob(cell, 145 + pulse * 4, 132, 14 + abs(pulse) * 5, frame, 0, 6200)
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
    phase = frame / COLS * 2 * pi
    cx = 138 + cos(phase) * (4 + stage)
    cy = 128 + sin(phase * 1.1) * (4 + stage * 0.5)
    radius = 59 + stage * 3 + sin(phase) * 2
    paint_energy_trail(cell, cx, cy, radius, frame, stage + 1, 7100)
    paint_energy_blob(cell, cx, cy, radius, frame, stage + 1, 7200)
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
