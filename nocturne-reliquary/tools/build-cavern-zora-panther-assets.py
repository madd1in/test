"""Build HD cavern section art and extended enemy animation sprites.

The cavern and enemy source images are Imagegen bitmap assets kept under
assets/source. This script normalizes them into runtime-friendly files:

  assets/generated/bg_imagen_cavern_depths_hd.png
  assets/generated/para_imagen_cavern_spires_hd.png
  assets/generated/para_imagen_cavern_mist_hd.png
  assets/generated/enemy_imagen_zora_panther_sheet.png
  assets/generated/enemy_imagen_zora_panther_frame_map.json
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source"
OUT = ROOT / "assets" / "generated"

SRC_CAVERN = SOURCE / "imagen_cavern_depths_hd_20260509.png"
SRC_CREATURES = SOURCE / "imagen_zora_panther_hd_sheet_20260509.png"

BG_SIZE = (1920, 1080)
FRAME_W = 256
FRAME_H = 192
FRAMES = 24


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
        alpha,
    )


def crop_cover(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    img = img.convert("RGB")
    src_w, src_h = img.size
    target_w, target_h = size
    scale = max(target_w / src_w, target_h / src_h)
    resized = img.resize((round(src_w * scale), round(src_h * scale)), Image.Resampling.LANCZOS)
    x = (resized.width - target_w) // 2
    y = (resized.height - target_h) // 2
    return resized.crop((x, y, x + target_w, y + target_h))


def hd_finish(img: Image.Image, contrast: float = 1.06, color: float = 1.04) -> Image.Image:
    img = ImageEnhance.Contrast(img.convert("RGB")).enhance(contrast)
    img = ImageEnhance.Color(img).enhance(color)
    return img.filter(ImageFilter.UnsharpMask(radius=1.05, percent=72, threshold=3))


def make_background() -> Image.Image:
    if not SRC_CAVERN.exists():
        raise SystemExit(f"Missing Imagegen cavern source: {SRC_CAVERN}")

    img = crop_cover(Image.open(SRC_CAVERN), BG_SIZE).convert("RGBA")
    w, h = BG_SIZE

    # Keep the generated painting intact, then tune it for readability behind gameplay.
    vignette = Image.new("RGBA", BG_SIZE, (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette, "RGBA")
    for y in range(h):
        edge = abs((y / h) - 0.48)
        alpha = round(max(0, edge - 0.18) * 100)
        vd.line((0, y, w, y), fill=(0, 3, 8, alpha))
    for x in range(w):
        edge = max(0, abs((x / w) - 0.5) - 0.34)
        alpha = round(edge * 240)
        vd.line((x, 0, x, h), fill=(0, 2, 7, alpha))
    img = Image.alpha_composite(img, vignette)

    # Subtle gameplay floor sheen for the Mode-7 stretch.
    water = Image.new("RGBA", BG_SIZE, (0, 0, 0, 0))
    wd = ImageDraw.Draw(water, "RGBA")
    for y in range(735, h):
        p = (y - 735) / max(1, h - 735)
        wd.rectangle((0, y, w, y + 1), fill=(5, 38, 58, round(18 + p * 46)))
    for x in range(-60, w + 80, 54):
        yy = 806 + math.sin(x * 0.016) * 14
        wd.line((x, yy, x + 34, yy + 2), fill=rgba("#b3f7ff", 30), width=2)
    img = Image.alpha_composite(img, water.filter(ImageFilter.GaussianBlur(0.7)))
    return hd_finish(img, contrast=1.08, color=1.06)


def make_spires() -> Image.Image:
    if not SRC_CAVERN.exists():
        raise SystemExit(f"Missing Imagegen cavern source: {SRC_CAVERN}")

    base = crop_cover(Image.open(SRC_CAVERN), BG_SIZE).convert("RGBA")
    px = base.load()
    w, h = BG_SIZE
    for y in range(h):
        top_gate = max(0.0, min(1.0, (410 - y) / 410))
        bottom_gate = max(0.0, min(1.0, (y - 610) / 360))
        for x in range(w):
            r, g, b, _ = px[x, y]
            lum = (r * 0.28 + g * 0.48 + b * 0.24)
            side_gate = max(0.0, min(1.0, (150 - min(x, w - 1 - x)) / 150))
            darkness = max(0.0, min(1.0, (82 - lum) / 82))
            alpha = max(top_gate * 220, bottom_gate * 150, side_gate * 145) * (0.35 + darkness * 0.65)
            if alpha < 10:
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (r, g, b, round(min(215, alpha)))

    draw = ImageDraw.Draw(base, "RGBA")
    rng = random.Random(9021)
    for x in range(-40, w + 80, 68):
        length = rng.randrange(96, 285)
        jag = rng.randrange(-12, 13)
        draw.polygon(
            [(x - 18, 0), (x + 24, 0), (x + jag, length)],
            fill=rgba("#020712", 160),
            outline=rgba("#7ee8ff", 34),
        )
    for x in range(-60, w + 80, 86):
        top = h - rng.randrange(130, 315)
        draw.polygon(
            [(x - 42, h), (x + rng.randrange(-9, 10), top), (x + 46, h)],
            fill=rgba("#030b13", 150),
            outline=rgba("#6cecff", 38),
        )
    return base.filter(ImageFilter.UnsharpMask(radius=0.75, percent=55, threshold=4))


def make_mist() -> Image.Image:
    rng = random.Random(7712)
    img = Image.new("RGBA", BG_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = BG_SIZE

    for _ in range(62):
        x = rng.randrange(-260, w)
        y = rng.randrange(270, 930)
        ww = rng.randrange(220, 560)
        hh = rng.randrange(30, 115)
        draw.ellipse((x, y, x + ww, y + hh), fill=rgba("#a8ecff", rng.randrange(10, 32)))
    for x in range(-120, w + 140, 112):
        drift = rng.randrange(-85, 86)
        draw.line((x, 0, x + drift, h), fill=rgba("#8fefff", rng.randrange(9, 22)), width=rng.randrange(2, 5))
    for x in range(96, w, 245):
        draw.line((x, 70, x + rng.randrange(-24, 25), h - 130), fill=rgba("#d8fbff", 30), width=3)
    return img.filter(ImageFilter.GaussianBlur(15))


def crop_cell(img: Image.Image, col: int, row: int, cols: int, rows: int) -> Image.Image:
    w, h = img.size
    left = round(col * w / cols)
    top = round(row * h / rows)
    right = round((col + 1) * w / cols)
    bottom = round((row + 1) * h / rows)
    return img.crop((left, top, right, bottom))


def remove_checkerboard(img: Image.Image) -> Image.Image:
    rgba_img = img.convert("RGBA")
    px = rgba_img.load()
    for y in range(rgba_img.height):
        for x in range(rgba_img.width):
            r, g, b, a = px[x, y]
            spread = max(r, g, b) - min(r, g, b)
            brightness = (r + g + b) / 3
            # The Imagegen sheet uses a baked light gray checker pattern.
            if spread < 18 and brightness > 178:
                px[x, y] = (0, 0, 0, 0)
            elif spread < 26 and brightness > 162:
                alpha = round(a * max(0, min(1, (spread - 12) / 22)))
                px[x, y] = (r, g, b, alpha)
    return rgba_img


def trim_alpha(img: Image.Image, pad: int = 8) -> Image.Image:
    img = img.convert("RGBA")
    box = img.getchannel("A").getbbox()
    if not box:
        return img
    x0, y0, x1, y1 = box
    return img.crop((
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(img.width, x1 + pad),
        min(img.height, y1 + pad),
    ))


def drop_faint_alpha(img: Image.Image, threshold: int = 10) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a < threshold:
                px[x, y] = (0, 0, 0, 0)
    return img


def drop_small_components(img: Image.Image, min_pixels: int = 140) -> Image.Image:
    img = img.convert("RGBA")
    alpha = img.getchannel("A")
    w, h = alpha.size
    data = alpha.tobytes()
    seen = bytearray(w * h)
    keep = bytearray(w * h)

    for yy in range(h):
        row_start = yy * w
        for xx in range(w):
            idx = row_start + xx
            if seen[idx] or data[idx] <= 18:
                continue

            stack = [(xx, yy)]
            seen[idx] = 1
            component = []
            while stack:
                x, y = stack.pop()
                ci = y * w + x
                component.append(ci)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        ni = ny * w + nx
                        if not seen[ni] and data[ni] > 18:
                            seen[ni] = 1
                            stack.append((nx, ny))

            if len(component) >= min_pixels:
                for ci in component:
                    keep[ci] = 1

    px = img.load()
    for y in range(h):
        for x in range(w):
            if not keep[y * w + x]:
                px[x, y] = (0, 0, 0, 0)
    return img


def normalize_frame(raw: Image.Image, scale_limit: float, y_offset: int = 6) -> Image.Image:
    sprite = drop_faint_alpha(trim_alpha(remove_checkerboard(raw), pad=6), threshold=8)
    box = sprite.getchannel("A").getbbox()
    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    if not box:
        return canvas

    body = sprite.crop(box)
    body = ImageEnhance.Contrast(body).enhance(1.06)
    body = ImageEnhance.Color(body).enhance(1.05)
    scale = min((FRAME_W * 0.92) / body.width, (FRAME_H * scale_limit) / body.height)
    body = body.resize((max(1, round(body.width * scale)), max(1, round(body.height * scale))), Image.Resampling.LANCZOS)
    body = body.filter(ImageFilter.UnsharpMask(radius=0.75, percent=78, threshold=2))

    shadow = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    shadow_w = max(38, round(body.width * 0.62))
    shadow_h = max(8, round(body.height * 0.09))
    sx = (FRAME_W - shadow_w) // 2
    sy = FRAME_H - shadow_h - 8
    sd.ellipse((sx, sy, sx + shadow_w, sy + shadow_h), fill=(0, 0, 0, 82))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(3)))

    x = (FRAME_W - body.width) // 2
    y = FRAME_H - body.height - y_offset
    canvas.alpha_composite(body, (x, y))
    return drop_small_components(canvas, min_pixels=140)


def component_boxes(img: Image.Image) -> list[tuple[int, int, int, int, int]]:
    alpha = img.getchannel("A")
    w, h = alpha.size
    data = alpha.tobytes()
    seen = bytearray(w * h)
    boxes: list[tuple[int, int, int, int, int]] = []

    for yy in range(h):
        row_start = yy * w
        for xx in range(w):
            idx = row_start + xx
            if seen[idx] or data[idx] <= 24:
                continue

            stack = [(xx, yy)]
            seen[idx] = 1
            min_x = max_x = xx
            min_y = max_y = yy
            count = 0

            while stack:
                x, y = stack.pop()
                count += 1
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        ni = ny * w + nx
                        if not seen[ni] and data[ni] > 24:
                            seen[ni] = 1
                            stack.append((nx, ny))

            width = max_x - min_x + 1
            height = max_y - min_y + 1
            if count > 2600 and width > 72 and height > 52:
                boxes.append((min_x, min_y, max_x + 1, max_y + 1, count))

    return boxes


def row_pick(boxes: list[tuple[int, int, int, int, int]], y_min: int, y_max: int, count: int) -> list[tuple[int, int, int, int, int]]:
    row = [
        box for box in boxes
        if y_min <= ((box[1] + box[3]) / 2) < y_max
    ]
    row.sort(key=lambda box: box[0])
    if len(row) < count:
        raise SystemExit(f"Only found {len(row)} sprite components in row {y_min}-{y_max}, need {count}")
    return row[:count]


def crop_box(img: Image.Image, box: tuple[int, int, int, int, int], pad: int = 8) -> Image.Image:
    left, top, right, bottom, _ = box
    return img.crop((
        max(0, left - pad),
        max(0, top - pad),
        min(img.width, right + pad),
        min(img.height, bottom + pad),
    ))


def make_sprite_sheet() -> Image.Image:
    if not SRC_CREATURES.exists():
        raise SystemExit(f"Missing Imagegen creature sheet source: {SRC_CREATURES}")

    source = remove_checkerboard(Image.open(SRC_CREATURES))
    boxes = component_boxes(source)
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H * 2), (0, 0, 0, 0))

    zora_boxes = (
        row_pick(boxes, 0, 120, 8)
        + row_pick(boxes, 120, 230, 8)
        + row_pick(boxes, 230, 346, 8)
    )
    panther_boxes = (
        row_pick(boxes, 346, 460, 8)
        + row_pick(boxes, 460, 575, 8)
        + row_pick(boxes, 575, 724, 8)
    )

    for i, box in enumerate(zora_boxes):
        frame = normalize_frame(crop_box(source, box), scale_limit=0.86, y_offset=5)
        sheet.alpha_composite(frame, (i * FRAME_W, 0))

    for i, box in enumerate(panther_boxes):
        frame = normalize_frame(crop_box(source, box), scale_limit=0.72, y_offset=4)
        sheet.alpha_composite(frame, (i * FRAME_W, FRAME_H))

    return sheet


def write_frame_map(path: Path) -> None:
    frame_map = {
        "version": "zora-panther-hd-24f-v2",
        "image": "enemy_imagen_zora_panther_sheet.png",
        "source": "imagen_zora_panther_hd_sheet_20260509.png",
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "framesPerRow": FRAMES,
        "animations": {
            "zora": {
                "row": 0,
                "frames": FRAMES,
                "fps": 12,
                "idle": list(range(0, 8)),
                "run": list(range(8, 16)),
                "attack": list(range(16, 24)),
                "anchor": "bottom-center",
            },
            "blackPanther": {
                "row": 1,
                "frames": FRAMES,
                "fps": 18,
                "run": list(range(0, 16)),
                "lunge": list(range(8, 20)),
                "recover": list(range(20, 24)),
                "anchor": "bottom-center",
            },
        },
    }
    path.write_text(json.dumps(frame_map, indent=2), encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_background().save(OUT / "bg_imagen_cavern_depths_hd.png", optimize=True)
    make_spires().save(OUT / "para_imagen_cavern_spires_hd.png", optimize=True)
    make_mist().save(OUT / "para_imagen_cavern_mist_hd.png", optimize=True)
    make_sprite_sheet().save(OUT / "enemy_imagen_zora_panther_sheet.png", optimize=True)
    write_frame_map(OUT / "enemy_imagen_zora_panther_frame_map.json")

    for name in [
        "bg_imagen_cavern_depths_hd.png",
        "para_imagen_cavern_spires_hd.png",
        "para_imagen_cavern_mist_hd.png",
        "enemy_imagen_zora_panther_sheet.png",
        "enemy_imagen_zora_panther_frame_map.json",
    ]:
        print(f"Wrote {OUT / name}")


if __name__ == "__main__":
    main()
