from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
TILE = 32


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
        alpha,
    )


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def tile_canvas(cols: int, rows: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (cols * TILE, rows * TILE), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def cell_bounds(index: int, cols: int) -> tuple[int, int, int, int]:
    x = (index % cols) * TILE
    y = (index // cols) * TILE
    return x, y, x + TILE, y + TILE


def sprinkle(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], colors: list[str], count: int, seed: int) -> None:
    rng = random.Random(seed)
    x0, y0, x1, y1 = box
    for _ in range(count):
        x = rng.randrange(x0 + 2, x1 - 2)
        y = rng.randrange(y0 + 2, y1 - 2)
        c = rgba(rng.choice(colors), rng.randrange(70, 150))
        draw.point((x, y), fill=c)
        if rng.random() > 0.65:
            draw.point((x + 1, y), fill=c)


def draw_tiles() -> None:
    cols, rows = 8, 4
    img, draw = tile_canvas(cols, rows)
    tiles: list[tuple[str, str, list[str]]] = [
        ("#23422b", "#315f37", ["#7dd06e", "#9bdf86", "#173320"]),
        ("#284a2d", "#38693d", ["#8edb73", "#d0a658", "#1d3925"]),
        ("#53605f", "#7a8179", ["#2a3233", "#9da59b", "#3c4645"]),
        ("#31423a", "#4e6355", ["#83bd7a", "#9ddc93", "#25352d"]),
        ("#163f56", "#1e6584", ["#5ab5c8", "#0e2f47", "#90dbe5"]),
        ("#5b3d25", "#8a6744", ["#2d1d14", "#c99b60", "#3e2919"]),
        ("#513626", "#785437", ["#b48754", "#2b1a12", "#67432b"]),
        ("#11181a", "#253033", ["#0a0f10", "#3c4b4d", "#1a2425"]),
        ("#35413d", "#4d5e56", ["#8cae82", "#242c2a", "#647a70"]),
        ("#1c2f22", "#2e4a31", ["#6bb65b", "#88cf75", "#142318"]),
        ("#341b22", "#692b36", ["#f08b49", "#1f1116", "#9b3d43"]),
        ("#4a3128", "#8a5635", ["#ffc15a", "#241714", "#cc7d3d"]),
        ("#24332f", "#46534c", ["#93b59f", "#151e1c", "#5f7469"]),
        ("#42504e", "#65736e", ["#9ca99d", "#252f2e", "#2b3936"]),
        ("#3c2219", "#7d3929", ["#ff9d3b", "#2a160f", "#bf5130"]),
        ("#3b4545", "#75847d", ["#d3d3b5", "#293030", "#91a194"]),
        ("#23422b", "#315f37", ["#efc64f", "#e47f55", "#8edb73"]),
        ("#2b392d", "#47644b", ["#92704b", "#1d2b20", "#71a765"]),
        ("#465356", "#6f7a76", ["#1a2224", "#9fa79c", "#c0bf9a"]),
        ("#46322c", "#70513e", ["#f18f3b", "#d8c984", "#2b1e1a"]),
        ("#181b19", "#272f2a", ["#0b0d0c", "#3a4c40", "#5b6d5d"]),
        ("#263530", "#617066", ["#9fb59c", "#222b28", "#c1c49a"]),
        ("#1d2d25", "#395d3e", ["#ffad4d", "#e06a32", "#0f2118"]),
        ("#343f45", "#66727a", ["#a8b7ba", "#222a2f", "#85949b"]),
        ("#213821", "#325a2f", ["#74b867", "#233c22", "#91d487"]),
        ("#283b3a", "#4b6a64", ["#7bc9bd", "#172927", "#8be1d2"]),
        ("#3b2a1c", "#6f5132", ["#c18b4b", "#24170f", "#8e6238"]),
        ("#282f37", "#535f68", ["#ffc65a", "#1c2128", "#81909a"]),
        ("#253126", "#4f6849", ["#e4b64c", "#121d15", "#79996b"]),
        ("#202c31", "#48575f", ["#84b2bd", "#121b1f", "#d5e1d8"]),
        ("#30282c", "#5f494f", ["#f6a24b", "#1a1216", "#9c6c70"]),
        ("#1b2e26", "#2f4f36", ["#71b760", "#0f1f18", "#e17946"]),
    ]

    for i, (base, high, speckles) in enumerate(tiles):
        box = cell_bounds(i, cols)
        x0, y0, x1, y1 = box
        draw.rectangle(box, fill=rgba(base))
        draw.rectangle((x0, y0, x1, y0 + 10), fill=rgba(high, 96))
        sprinkle(draw, box, speckles, 96, i * 13 + 7)

    # Tile-specific readable forms.
    for i in [2, 18, 23]:
        x0, y0, x1, y1 = cell_bounds(i, cols)
        for offset in range(-16, 48, 14):
            draw.line((x0 + offset, y1, x0 + offset + 32, y0), fill=rgba("#20282a", 110), width=1)
        draw.rectangle((x0 + 3, y0 + 3, x1 - 4, y1 - 4), outline=rgba("#a6aea4", 90))

    x0, y0, x1, y1 = cell_bounds(4, cols)
    for wave in range(4):
        yy = y0 + 6 + wave * 7
        draw.arc((x0 + 2, yy - 5, x1 - 2, yy + 9), 12, 168, fill=rgba("#8fe8ed", 120), width=1)

    x0, y0, x1, y1 = cell_bounds(5, cols)
    for plank in range(4):
        yy = y0 + plank * 8
        draw.rectangle((x0, yy, x1, yy + 6), fill=rgba("#84613e"))
        draw.line((x0, yy + 6, x1, yy + 6), fill=rgba("#2b1b11"))

    x0, y0, x1, y1 = cell_bounds(9, cols)
    draw.ellipse((x0 + 1, y0 + 0, x1 - 1, y1 - 5), fill=rgba("#203f25"))
    draw.ellipse((x0 + 5, y0 + 3, x1 - 6, y1 - 8), fill=rgba("#3e7c39"))
    draw.rectangle((x0 + 13, y0 + 18, x0 + 19, y1), fill=rgba("#5f3e2c"))

    x0, y0, x1, y1 = cell_bounds(10, cols)
    for k in range(6):
        draw.line((x0 + 2, y0 + 5 + k * 4, x1 - 2, y0 + 2 + k * 5), fill=rgba("#250d15"), width=3)
        draw.line((x0 + 3, y0 + 5 + k * 4, x1 - 2, y0 + 2 + k * 5), fill=rgba("#a43d3f"), width=1)
    for k in range(8):
        px = x0 + 4 + (k * 7) % 25
        py = y0 + 5 + (k * 11) % 22
        draw.polygon([(px, py), (px + 3, py + 2), (px, py + 4)], fill=rgba("#f2a24e"))

    x0, y0, x1, y1 = cell_bounds(11, cols)
    draw.rectangle((x0 + 5, y0 + 4, x1 - 5, y1), fill=rgba("#37231d"))
    draw.rectangle((x0 + 8, y0 + 8, x1 - 8, y1), fill=rgba("#7f5232"))
    draw.ellipse((x0 + 12, y0 + 13, x0 + 20, y0 + 21), outline=rgba("#ffb54a"), width=2)

    x0, y0, x1, y1 = cell_bounds(12, cols)
    draw.arc((x0 + 4, y0 + 2, x1 - 4, y1 + 22), 180, 360, fill=rgba("#8a9b91"), width=4)
    draw.rectangle((x0 + 4, y0 + 16, x0 + 9, y1), fill=rgba("#6f7c78"))
    draw.rectangle((x1 - 9, y0 + 16, x1 - 4, y1), fill=rgba("#6f7c78"))

    x0, y0, x1, y1 = cell_bounds(13, cols)
    draw.rectangle((x0 + 9, y0 + 5, x1 - 9, y1 - 2), fill=rgba("#6a756f"))
    draw.rectangle((x0 + 6, y0 + 3, x1 - 6, y0 + 9), fill=rgba("#93a098"))
    draw.rectangle((x0 + 5, y1 - 7, x1 - 5, y1 - 2), fill=rgba("#4b5752"))

    x0, y0, x1, y1 = cell_bounds(14, cols)
    for k in range(5):
        draw.arc((x0 + k * 4, y0 + 4, x1 - 2, y1 - k * 3), 120, 260, fill=rgba("#e36838"), width=2)
    draw.ellipse((x0 + 14, y0 + 13, x0 + 21, y0 + 20), fill=rgba("#ffc35a"))

    x0, y0, x1, y1 = cell_bounds(15, cols)
    for step in range(5):
        yy = y1 - 4 - step * 5
        draw.rectangle((x0 + 3 + step * 2, yy, x1 - 3 - step * 2, yy + 3), fill=rgba("#9aa096"))

    save(img, ASSETS / "environment" / "tiles.png")


def draw_shadow(draw: ImageDraw.ImageDraw, cx: int, cy: int, w: int, h: int) -> None:
    draw.ellipse((cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2), fill=(0, 0, 0, 70))


def draw_player_frame(draw: ImageDraw.ImageDraw, ox: int, oy: int, direction: int, step: int) -> None:
    cx = ox + 20
    sway = [-2, 0, 2][step]
    foot = [-2, 1, -1][step]
    draw_shadow(draw, cx, oy + 41, 25, 8)
    cloak = "#5a2624"
    cloak_hi = "#b84332"
    tunic = "#263c36"
    ember = "#ffb44c"
    skin = "#d79a67"
    hood_y = oy + 9

    if direction == 1:
        face_dx = -3
        blade = [(ox + 9, oy + 20), (ox + 0, oy + 13), (ox + 10, oy + 23)]
    elif direction == 2:
        face_dx = 3
        blade = [(ox + 31, oy + 20), (ox + 40, oy + 13), (ox + 30, oy + 23)]
    elif direction == 3:
        face_dx = 0
        blade = [(ox + 24, oy + 16), (ox + 28, oy + 5), (ox + 27, oy + 18)]
    else:
        face_dx = 0
        blade = [(ox + 24, oy + 26), (ox + 34, oy + 32), (ox + 25, oy + 30)]

    draw.polygon([(cx - 10, oy + 16), (cx + 10, oy + 16), (cx + 13, oy + 37), (cx - 13, oy + 37)], fill=rgba(cloak))
    draw.polygon([(cx - 7, oy + 17), (cx + 7, oy + 17), (cx + 5, oy + 35), (cx - 5, oy + 35)], fill=rgba(tunic))
    draw.line((cx - 9, oy + 22, cx + 8, oy + 34), fill=rgba(cloak_hi), width=2)
    draw.ellipse((cx - 10 + sway, hood_y, cx + 10 + sway, hood_y + 17), fill=rgba(cloak_hi))
    if direction != 3:
        draw.ellipse((cx - 5 + face_dx + sway, hood_y + 5, cx + 5 + face_dx + sway, hood_y + 14), fill=rgba(skin))
        draw.rectangle((cx - 3 + face_dx + sway, hood_y + 10, cx + 4 + face_dx + sway, hood_y + 12), fill=rgba("#4a2d20"))
    else:
        draw.arc((cx - 8 + sway, hood_y + 6, cx + 8 + sway, hood_y + 16), 190, 350, fill=rgba("#381c1a"), width=2)

    draw.polygon(blade, fill=rgba("#ffd479"))
    draw.line((cx + 2, oy + 18, blade[0][0], blade[0][1]), fill=rgba("#7a4d2d"), width=2)
    draw.rectangle((cx - 8, oy + 36 + foot, cx - 3, oy + 43 + foot), fill=rgba("#1d2421"))
    draw.rectangle((cx + 4, oy + 36 - foot, cx + 9, oy + 43 - foot), fill=rgba("#1d2421"))
    draw.ellipse((cx - 3, oy + 25, cx + 3, oy + 31), fill=rgba(ember))


def draw_player() -> None:
    fw, fh = 40, 48
    img = Image.new("RGBA", (fw * 3, fh * 4), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for direction in range(4):
        for step in range(3):
            draw_player_frame(draw, step * fw, direction * fh, direction, step)
    save(img, ASSETS / "characters" / "player.png")


def draw_thornling_frame(draw: ImageDraw.ImageDraw, ox: int, oy: int, frame: int) -> None:
    cx = ox + 16
    wobble = [-2, 1, 2, -1][frame]
    draw_shadow(draw, cx, oy + 28, 24, 8)
    draw.ellipse((cx - 11 + wobble, oy + 9, cx + 11 + wobble, oy + 29), fill=rgba("#34202a"))
    draw.ellipse((cx - 7 + wobble, oy + 11, cx + 7 + wobble, oy + 26), fill=rgba("#75323d"))
    for k in range(5):
        angle = k * math.tau / 5 + frame * 0.25
        x = cx + wobble + math.cos(angle) * 12
        y = oy + 19 + math.sin(angle) * 10
        draw.line((cx + wobble, oy + 19, x, y), fill=rgba("#1b1016"), width=3)
        draw.line((cx + wobble, oy + 19, x, y), fill=rgba("#b04746"), width=1)
    draw.ellipse((cx - 4 + wobble, oy + 15, cx - 1 + wobble, oy + 19), fill=rgba("#ffc35a"))
    draw.ellipse((cx + 3 + wobble, oy + 15, cx + 6 + wobble, oy + 19), fill=rgba("#ffc35a"))


def draw_thornling() -> None:
    fw, fh = 32, 34
    img = Image.new("RGBA", (fw * 4, fh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for frame in range(4):
        draw_thornling_frame(draw, frame * fw, 0, frame)
    save(img, ASSETS / "characters" / "thornling.png")


def draw_boss_frame(draw: ImageDraw.ImageDraw, ox: int, oy: int, frame: int) -> None:
    cx = ox + 36
    pulse = [0, 2, 1, -1][frame]
    draw_shadow(draw, cx, oy + 63, 52, 14)
    draw.polygon(
        [(cx - 24, oy + 20), (cx - 10, oy + 7), (cx + 8, oy + 7), (cx + 25, oy + 21), (cx + 18, oy + 58), (cx - 18, oy + 58)],
        fill=rgba("#2a3434"),
    )
    draw.polygon(
        [(cx - 18, oy + 22), (cx - 6, oy + 13), (cx + 7, oy + 13), (cx + 19, oy + 22), (cx + 11, oy + 51), (cx - 13, oy + 51)],
        fill=rgba("#5d312b"),
    )
    draw.ellipse((cx - 15, oy + 4 + pulse, cx + 15, oy + 30 + pulse), fill=rgba("#6b5248"))
    draw.polygon([(cx - 17, oy + 11), (cx - 28, oy + 0), (cx - 19, oy + 22)], fill=rgba("#9ca59b"))
    draw.polygon([(cx + 17, oy + 11), (cx + 28, oy + 0), (cx + 19, oy + 22)], fill=rgba("#9ca59b"))
    draw.ellipse((cx - 7, oy + 14 + pulse, cx - 2, oy + 20 + pulse), fill=rgba("#ffb54a"))
    draw.ellipse((cx + 3, oy + 14 + pulse, cx + 8, oy + 20 + pulse), fill=rgba("#ffb54a"))
    draw.line((cx - 23, oy + 29, cx - 34, oy + 39 + pulse), fill=rgba("#9b5133"), width=5)
    draw.line((cx + 23, oy + 29, cx + 34, oy + 39 - pulse), fill=rgba("#9b5133"), width=5)
    for k in range(5):
        draw.line((cx - 10 + k * 5, oy + 31, cx - 14 + k * 7, oy + 56), fill=rgba("#d86d35", 150), width=2)


def draw_boss() -> None:
    fw, fh = 72, 72
    img = Image.new("RGBA", (fw * 4, fh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for frame in range(4):
        draw_boss_frame(draw, frame * fw, 0, frame)
    save(img, ASSETS / "characters" / "ashwarden.png")


def draw_objects() -> None:
    cols, fw, fh = 8, 32, 32
    img = Image.new("RGBA", (cols * fw, fh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def at(i: int) -> tuple[int, int]:
        return i * fw, 0

    x, y = at(0)
    draw.polygon([(x + 16, y + 2), (x + 24, y + 14), (x + 17, y + 30), (x + 8, y + 15)], fill=rgba("#ffb84e"))
    draw.polygon([(x + 16, y + 5), (x + 20, y + 15), (x + 16, y + 26), (x + 12, y + 15)], fill=rgba("#fff0a0"))
    draw.line((x + 16, y + 2, x + 16, y + 30), fill=rgba("#d65b2d"), width=1)

    x, y = at(1)
    draw.ellipse((x + 7, y + 7, x + 17, y + 18), fill=rgba("#ef5a63"))
    draw.ellipse((x + 15, y + 7, x + 25, y + 18), fill=rgba("#ef5a63"))
    draw.polygon([(x + 7, y + 13), (x + 25, y + 13), (x + 16, y + 27)], fill=rgba("#ef5a63"))
    draw.ellipse((x + 11, y + 9, x + 14, y + 12), fill=rgba("#ffd2c2"))

    x, y = at(2)
    draw.ellipse((x + 8, y + 7, x + 21, y + 20), outline=rgba("#f6c75e"), width=3)
    draw.rectangle((x + 20, y + 15, x + 28, y + 19), fill=rgba("#f6c75e"))
    draw.rectangle((x + 24, y + 18, x + 28, y + 22), fill=rgba("#f6c75e"))

    x, y = at(3)
    draw.rectangle((x + 4, y + 10, x + 28, y + 27), fill=rgba("#7a4a2d"))
    draw.rectangle((x + 6, y + 7, x + 26, y + 15), fill=rgba("#a66a3d"))
    draw.rectangle((x + 14, y + 14, x + 18, y + 20), fill=rgba("#f6c75e"))
    draw.line((x + 4, y + 15, x + 28, y + 15), fill=rgba("#2a1710"), width=2)

    x, y = at(4)
    draw.rectangle((x + 4, y + 16, x + 28, y + 27), fill=rgba("#6e432a"))
    draw.arc((x + 6, y + 4, x + 26, y + 26), 180, 360, fill=rgba("#b47742"), width=4)
    draw.line((x + 4, y + 16, x + 28, y + 16), fill=rgba("#f1b45b"), width=2)

    x, y = at(5)
    draw.rectangle((x + 12, y + 12, x + 20, y + 28), fill=rgba("#516057"))
    draw.ellipse((x + 7, y + 3, x + 25, y + 21), outline=rgba("#ffb84e"), width=3)
    draw.ellipse((x + 12, y + 8, x + 20, y + 16), fill=rgba("#ffc75d"))

    x, y = at(6)
    draw.rectangle((x + 11, y + 7, x + 21, y + 26), fill=rgba("#4c2e35"))
    draw.polygon([(x + 11, y + 7), (x + 16, y + 3), (x + 21, y + 7)], fill=rgba("#dd6e3b"))
    draw.rectangle((x + 12, y + 10, x + 20, y + 23), fill=rgba("#8a4050"))

    x, y = at(7)
    draw.polygon([(x + 16, y + 4), (x + 27, y + 16), (x + 16, y + 28), (x + 5, y + 16)], fill=rgba("#365e55"))
    draw.line((x + 16, y + 4, x + 16, y + 28), fill=rgba("#ffad4d"), width=2)
    draw.line((x + 5, y + 16, x + 27, y + 16), fill=rgba("#ffad4d"), width=2)

    save(img, ASSETS / "environment" / "objects.png")


def draw_slash() -> None:
    fw, fh, frames = 64, 64, 5
    img = Image.new("RGBA", (fw * frames, fh), (0, 0, 0, 0))
    for frame in range(frames):
        layer = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        alpha = 220 - frame * 32
        start = 210 - frame * 12
        end = 330 + frame * 8
        bbox = (8 - frame, 8 - frame, 56 + frame, 56 + frame)
        draw.arc(bbox, start, end, fill=rgba("#ffe5a3", alpha), width=7)
        draw.arc((bbox[0] + 5, bbox[1] + 5, bbox[2] - 5, bbox[3] - 5), start + 8, end - 8, fill=rgba("#e86732", max(80, alpha - 50)), width=4)
        img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.2)), (frame * fw, 0))
    save(img, ASSETS / "fx" / "slash.png")


def draw_ui() -> None:
    img = Image.new("RGBA", (128, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for i in range(4):
        x = i * 32
        draw.rounded_rectangle((x + 4, 4, x + 28, 28), radius=6, fill=rgba("#1c2f2c", 225), outline=rgba("#e0a14b", 220), width=2)
        if i == 0:
            draw.polygon([(x + 16, 8), (x + 23, 18), (x + 16, 26), (x + 9, 18)], fill=rgba("#ffc75d"))
        elif i == 1:
            draw.ellipse((x + 9, 9, x + 23, 23), fill=rgba("#e95760"))
        elif i == 2:
            draw.line((x + 10, 22, x + 22, 10), fill=rgba("#ffe4a0"), width=4)
            draw.line((x + 14, 12, x + 22, 20), fill=rgba("#ffe4a0"), width=3)
        else:
            draw.rectangle((x + 10, 9, x + 22, 24), fill=rgba("#8b4050"))
            draw.polygon([(x + 10, 9), (x + 16, 5), (x + 22, 9)], fill=rgba("#df6f3e"))
    save(img, ASSETS / "ui" / "icons.png")


def main() -> None:
    draw_tiles()
    draw_player()
    draw_thornling()
    draw_boss()
    draw_objects()
    draw_slash()
    draw_ui()


if __name__ == "__main__":
    main()
