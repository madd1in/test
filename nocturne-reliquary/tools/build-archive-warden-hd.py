"""Normalize the Imagen HD Moonlit Archives boss into a smooth 48-frame game sheet."""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "imagen_archive_warden_hd_48f_20260510.png"
OUT = ROOT / "assets" / "generated"

FRAME_W = 320
FRAME_H = 256
COLS = 12
ROWS = 4
FRAMES = COLS * ROWS


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
        alpha,
    )


def remove_green(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            green_delta = g - max(r, b)
            if g > 135 and green_delta > 45:
                px[x, y] = (0, 0, 0, 0)
            elif g > 92 and green_delta > 22:
                fade = max(0.0, min(1.0, (green_delta - 22) / 45))
                px[x, y] = (r, max(r, b, round(g * 0.42)), b, round(a * (1.0 - fade * 0.86)))
            elif green_delta > 8 and g > 36:
                px[x, y] = (r, max(r, b, round(g * 0.18)), b, a)
    return img


def trim_alpha(img: Image.Image, pad: int = 6) -> Image.Image:
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


def remove_specks(img: Image.Image, min_area: int = 95) -> Image.Image:
    img = img.convert("RGBA")
    alpha = img.getchannel("A")
    px_alpha = alpha.load()
    w, h = img.size
    seen = bytearray(w * h)
    keep = bytearray(w * h)

    for start_y in range(h):
        for start_x in range(w):
            idx = start_y * w + start_x
            if seen[idx] or px_alpha[start_x, start_y] < 24:
                continue
            stack = [(start_x, start_y)]
            seen[idx] = 1
            cells = []
            while stack:
                x, y = stack.pop()
                cells.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    nidx = ny * w + nx
                    if seen[nidx] or px_alpha[nx, ny] < 24:
                        continue
                    seen[nidx] = 1
                    stack.append((nx, ny))
            if len(cells) >= min_area:
                for x, y in cells:
                    keep[y * w + x] = 1

    px = img.load()
    for y in range(h):
        for x in range(w):
            if not keep[y * w + x]:
                r, g, b, a = px[x, y]
                if a:
                    px[x, y] = (r, g, b, 0)
    return img


def clear_cell_bleed(img: Image.Image, edge: int = 7) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(edge):
            px[x, y] = (0, 0, 0, 0)
            px[w - 1 - x, y] = (0, 0, 0, 0)
    return img


def crop_source(col: int, row: int) -> Image.Image:
    source = Image.open(SOURCE).convert("RGBA")
    w, h = source.size
    return source.crop((
        round(col * w / COLS),
        round(row * h / ROWS),
        round((col + 1) * w / COLS),
        round((row + 1) * h / ROWS),
    ))


def draw_ink_slash(canvas: Image.Image, frame: int) -> None:
    local = frame - 24
    t = local / 11
    draw = ImageDraw.Draw(canvas, "RGBA")
    cx = 142 - round(t * 58)
    cy = 132 - round(math.sin(t * math.pi) * 18)
    length = 70 + round(math.sin(t * math.pi) * 102)
    thickness = 20 + round(math.sin(t * math.pi) * 30)

    wave = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wave, "RGBA")
    pts = []
    for i in range(9):
        p = i / 8
        x = cx - p * length
        y = cy - math.sin(p * math.pi) * (24 + 26 * math.sin(t * math.pi)) + math.sin((p + t) * 10) * 6
        pts.append((x, y))
    for width, alpha, color in [
        (thickness + 22, 44, "#2d1940"),
        (thickness + 8, 112, "#050207"),
        (max(4, thickness // 3), 158, "#bca8ff"),
    ]:
        wd.line(pts, fill=rgba(color, alpha), width=width, joint="curve")
    for i in range(16):
        p = (i * 0.073 + t * 0.61) % 1.0
        x = cx - p * (length + 18) + math.sin(i * 1.7) * 8
        y = cy - math.sin(p * math.pi) * 44 + math.cos(i * 2.1 + t * 8) * 14
        radius = 1.5 + (i % 4)
        draw_alpha = 58 + (i % 5) * 18
        wd.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(3, 1, 6, draw_alpha))
    canvas.alpha_composite(wave.filter(ImageFilter.GaussianBlur(0.45)))


def normalize_frame(raw: Image.Image, frame: int) -> Image.Image:
    body = remove_specks(clear_cell_bleed(remove_green(raw)))
    body = trim_alpha(body, pad=8)
    body = ImageEnhance.Contrast(body).enhance(1.12)
    body = ImageEnhance.Color(body).enhance(1.05)
    body = body.filter(ImageFilter.UnsharpMask(radius=0.7, percent=84, threshold=2))
    box = body.getchannel("A").getbbox()
    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    if not box:
        return canvas

    body = body.crop(box)
    scale = min((FRAME_W * 0.52) / body.width, (FRAME_H * 0.78) / body.height)
    body = body.resize((max(1, round(body.width * scale)), max(1, round(body.height * scale))), Image.Resampling.LANCZOS)

    pulse = 0.5 + 0.5 * math.sin((frame / FRAMES) * math.tau)
    aura = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    ad = ImageDraw.Draw(aura, "RGBA")
    ad.ellipse((78, 48, 232, 240), outline=rgba("#bca8ff", round(24 + pulse * 18)), width=3)
    ad.ellipse((104, 66, 206, 228), fill=rgba("#12081c", round(18 + pulse * 12)))
    canvas.alpha_composite(aura.filter(ImageFilter.GaussianBlur(6)))

    if 24 <= frame <= 35:
        draw_ink_slash(canvas, frame)

    shadow = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    sd.ellipse((98, FRAME_H - 28, 220, FRAME_H - 9), fill=(0, 0, 0, 92))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(4)))

    hover = round(math.sin(frame * 0.56) * 3)
    if 12 <= frame <= 23:
        hover -= round(math.sin(((frame - 12) / 11) * math.pi) * 8)
    x = (FRAME_W - body.width) // 2 + round(math.sin(frame * 0.33) * 2)
    y = FRAME_H - body.height - 13 + hover
    canvas.alpha_composite(body, (x, y))
    return canvas


def build_sheet() -> Image.Image:
    if not SOURCE.exists():
        raise SystemExit(f"Missing Imagen archive warden source: {SOURCE}")

    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H), (0, 0, 0, 0))
    for frame in range(FRAMES):
        row = frame // COLS
        col = frame % COLS
        source_row = 1 if row == 2 else row
        raw = crop_source(col, source_row)
        sheet.alpha_composite(normalize_frame(raw, frame), (frame * FRAME_W, 0))
    return sheet


def write_frame_map() -> None:
    frame_map = {
        "version": "archive-warden-imagen-hd-48f-v1",
        "image": "enemy_imagen_archive_warden_48f_sheet.png",
        "source": "imagen_archive_warden_hd_48f_20260510.png",
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "framesPerRow": FRAMES,
        "animations": {
            "inkWarden": {
                "row": 0,
                "frames": FRAMES,
                "fps": 14,
                "idle": list(range(0, 12)),
                "cast": list(range(12, 24)),
                "attack": list(range(24, 36)),
                "recover": list(range(36, 48)),
                "anchor": "bottom-center",
            }
        },
    }
    (OUT / "enemy_imagen_archive_warden_48f_frame_map.json").write_text(json.dumps(frame_map, indent=2), encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    build_sheet().save(OUT / "enemy_imagen_archive_warden_48f_sheet.png", optimize=True)
    write_frame_map()
    print(f"Wrote {OUT / 'enemy_imagen_archive_warden_48f_sheet.png'}")
    print(f"Wrote {OUT / 'enemy_imagen_archive_warden_48f_frame_map.json'}")


if __name__ == "__main__":
    main()
