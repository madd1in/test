"""Build HD quest seal icons and mini-boss animation maps from Imagegen sources."""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source"
OUT = ROOT / "assets" / "generated"

SRC_BOSSES = SOURCE / "imagen_quest_minibosses_hd_sheet_20260509.png"
SRC_SEALS = SOURCE / "imagen_quest_seals_hd_icons_20260509.png"

BOSS_FRAME_W = 320
BOSS_FRAME_H = 256
BOSS_FRAMES = 24
ICON_SIZE = 128


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
            if g > 145 and green_delta > 55:
                px[x, y] = (0, 0, 0, 0)
            elif g > 108 and green_delta > 34:
                fade = max(0.0, min(1.0, (green_delta - 34) / 34))
                px[x, y] = (r, max(r, b, round(g * 0.45)), b, round(a * (1.0 - fade * 0.82)))
            elif green_delta > 14 and g > 70:
                px[x, y] = (r, max(r, b, round(g * 0.58)), b, a)
    return img


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


def crop_grid(img: Image.Image, col: int, row: int, cols: int, rows: int) -> Image.Image:
    w, h = img.size
    return img.crop((
        round(col * w / cols),
        round(row * h / rows),
        round((col + 1) * w / cols),
        round((row + 1) * h / rows),
    ))


def normalize_boss(raw: Image.Image, row: int, frame_index: int) -> Image.Image:
    body = trim_alpha(remove_green(raw), pad=10)
    body = ImageEnhance.Contrast(body).enhance(1.08)
    body = ImageEnhance.Color(body).enhance(1.07)
    body = body.filter(ImageFilter.UnsharpMask(radius=0.8, percent=82, threshold=2))

    canvas = Image.new("RGBA", (BOSS_FRAME_W, BOSS_FRAME_H), (0, 0, 0, 0))
    box = body.getchannel("A").getbbox()
    if not box:
        return canvas
    body = body.crop(box)

    scale_limit = [0.82, 0.86, 0.9][row]
    scale = min((BOSS_FRAME_W * 0.86) / body.width, (BOSS_FRAME_H * scale_limit) / body.height)
    body = body.resize((
        max(1, round(body.width * scale)),
        max(1, round(body.height * scale)),
    ), Image.Resampling.LANCZOS)

    aura = Image.new("RGBA", (BOSS_FRAME_W, BOSS_FRAME_H), (0, 0, 0, 0))
    ad = ImageDraw.Draw(aura, "RGBA")
    pulse = 0.5 + 0.5 * math.sin((frame_index / BOSS_FRAMES) * math.tau)
    glow_colors = ["#42dfff", "#ffd56a", "#bca8ff"]
    ad.ellipse(
        (42, 62, BOSS_FRAME_W - 42, BOSS_FRAME_H + 28),
        outline=rgba(glow_colors[row], round(30 + pulse * 22)),
        width=3,
    )
    canvas.alpha_composite(aura.filter(ImageFilter.GaussianBlur(8)))

    shadow = Image.new("RGBA", (BOSS_FRAME_W, BOSS_FRAME_H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    shadow_w = max(64, round(body.width * 0.58))
    sd.ellipse(
        ((BOSS_FRAME_W - shadow_w) // 2, BOSS_FRAME_H - 30, (BOSS_FRAME_W + shadow_w) // 2, BOSS_FRAME_H - 8),
        fill=(0, 0, 0, 96),
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(4)))

    wobble_x = round(math.sin(frame_index * 0.9) * (2 if frame_index >= 8 else 1))
    x = (BOSS_FRAME_W - body.width) // 2 + wobble_x
    y = BOSS_FRAME_H - body.height - 10
    canvas.alpha_composite(body, (x, y))
    return canvas


def make_boss_sheet() -> Image.Image:
    if not SRC_BOSSES.exists():
        raise SystemExit(f"Missing Imagegen mini-boss source: {SRC_BOSSES}")

    source = Image.open(SRC_BOSSES)
    sheet = Image.new("RGBA", (BOSS_FRAME_W * BOSS_FRAMES, BOSS_FRAME_H * 3), (0, 0, 0, 0))
    pose_cycle = [0, 1, 2, 3, 4, 5, 6, 7, 3, 4, 5, 6, 7, 6, 5, 4, 7, 6, 5, 4, 3, 2, 1, 0]

    for row in range(3):
      for frame_index, pose in enumerate(pose_cycle):
          raw = crop_grid(source, pose, row, 8, 3)
          frame = normalize_boss(raw, row, frame_index)
          sheet.alpha_composite(frame, (frame_index * BOSS_FRAME_W, row * BOSS_FRAME_H))
    return sheet


def normalize_icon(raw: Image.Image, glow: str) -> Image.Image:
    icon = trim_alpha(remove_green(raw), pad=14)
    icon = ImageEnhance.Contrast(icon).enhance(1.07)
    icon = ImageEnhance.Color(icon).enhance(1.06)
    icon = icon.filter(ImageFilter.UnsharpMask(radius=0.75, percent=80, threshold=2))
    box = icon.getchannel("A").getbbox()
    canvas = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    if not box:
        return canvas

    icon = icon.crop(box)
    scale = min((ICON_SIZE * 0.88) / icon.width, (ICON_SIZE * 0.88) / icon.height)
    icon = icon.resize((round(icon.width * scale), round(icon.height * scale)), Image.Resampling.LANCZOS)

    aura = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    ad = ImageDraw.Draw(aura, "RGBA")
    ad.ellipse((16, 16, ICON_SIZE - 16, ICON_SIZE - 16), fill=rgba(glow, 36))
    canvas.alpha_composite(aura.filter(ImageFilter.GaussianBlur(7)))
    canvas.alpha_composite(icon, ((ICON_SIZE - icon.width) // 2, (ICON_SIZE - icon.height) // 2))
    return canvas


def make_icon_sheet() -> Image.Image:
    if not SRC_SEALS.exists():
        raise SystemExit(f"Missing Imagegen quest seal source: {SRC_SEALS}")

    source = Image.open(SRC_SEALS)
    sheet = Image.new("RGBA", (ICON_SIZE * 3, ICON_SIZE), (0, 0, 0, 0))
    glows = ["#42dfff", "#ffd56a", "#c8b7ff"]
    for col in range(3):
        raw = crop_grid(source, col, 0, 3, 1)
        sheet.alpha_composite(normalize_icon(raw, glows[col]), (col * ICON_SIZE, 0))
    return sheet


def write_frame_map(path: Path) -> None:
    frame_map = {
        "version": "quest-seal-minibosses-hd-24f-v1",
        "image": "enemy_imagen_quest_minibosses_sheet.png",
        "source": "imagen_quest_minibosses_hd_sheet_20260509.png",
        "frameWidth": BOSS_FRAME_W,
        "frameHeight": BOSS_FRAME_H,
        "framesPerRow": BOSS_FRAMES,
        "animations": {
            "tideWarden": {
                "row": 0,
                "frames": BOSS_FRAMES,
                "fps": 12,
                "idle": list(range(0, 8)),
                "cast": list(range(8, 16)),
                "recover": list(range(16, 24)),
                "anchor": "bottom-center",
            },
            "starWarden": {
                "row": 1,
                "frames": BOSS_FRAMES,
                "fps": 12,
                "idle": list(range(0, 8)),
                "cast": list(range(8, 16)),
                "recover": list(range(16, 24)),
                "anchor": "bottom-center",
            },
            "inkWarden": {
                "row": 2,
                "frames": BOSS_FRAMES,
                "fps": 13,
                "idle": list(range(0, 8)),
                "cast": list(range(8, 16)),
                "recover": list(range(16, 24)),
                "anchor": "bottom-center",
            },
        },
    }
    path.write_text(json.dumps(frame_map, indent=2), encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_boss_sheet().save(OUT / "enemy_imagen_quest_minibosses_sheet.png", optimize=True)
    make_icon_sheet().save(OUT / "items_imagen_quest_seals.png", optimize=True)
    write_frame_map(OUT / "enemy_imagen_quest_minibosses_frame_map.json")

    for name in [
        "enemy_imagen_quest_minibosses_sheet.png",
        "items_imagen_quest_seals.png",
        "enemy_imagen_quest_minibosses_frame_map.json",
    ]:
        print(f"Wrote {OUT / name}")


if __name__ == "__main__":
    main()
