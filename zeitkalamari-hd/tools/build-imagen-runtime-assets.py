from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFont


ROOT = Path(__file__).resolve().parents[1]
IMAGEN = ROOT / "assets" / "imagen"
LAYERS = IMAGEN / "layers"
VFX = IMAGEN / "vfx"
FRAMES = IMAGEN / "frames"
UI = IMAGEN / "ui"
FONTS = IMAGEN / "fonts"
LABELS = FONTS / "labels"


def ensure_dirs() -> None:
    for folder in (FRAMES, UI, FONTS, LABELS):
        folder.mkdir(parents=True, exist_ok=True)


def fit_image(image: Image.Image, max_edge: int) -> Image.Image:
    scale = min(1.0, max_edge / max(image.size))
    if scale >= 1:
        return image
    return image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)


def paste_centered(base: Image.Image, image: Image.Image, x: int, y: int) -> None:
    base.alpha_composite(image, (x, y))


def make_cutout_sheet(source_name: str, output_name: str, frames: int, max_edge: int, motion: str) -> None:
    source = fit_image(Image.open(LAYERS / source_name).convert("RGBA"), max_edge)
    pad_x = max(16, round(source.width * 0.06))
    pad_y = max(16, round(source.height * 0.06))
    frame_w = source.width + pad_x * 2
    frame_h = source.height + pad_y * 2
    sheet = Image.new("RGBA", (frame_w * frames, frame_h), (0, 0, 0, 0))

    for index in range(frames):
        t = index / frames
        phase = math.sin(t * math.tau)
        frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        art = source.copy()

        if motion == "npc":
            scale_x = 1 + 0.006 * phase
            scale_y = 1 - 0.006 * phase
            art = art.resize((round(source.width * scale_x), round(source.height * scale_y)), Image.Resampling.LANCZOS)
            x = pad_x + round((source.width - art.width) / 2)
            y = pad_y + round(source.height - art.height - 5 * max(0, phase))
        elif motion == "tank":
            glow = ImageEnhance.Color(art).enhance(1.0 + 0.05 * max(0, phase))
            art = Image.blend(art, glow, 0.35)
            x = pad_x
            y = pad_y + round(2 * phase)
        elif motion == "gel":
            scale_x = 1 + 0.035 * max(0, phase)
            scale_y = 1 - 0.03 * max(0, phase)
            art = art.resize((round(source.width * scale_x), round(source.height * scale_y)), Image.Resampling.LANCZOS)
            x = pad_x + round((source.width - art.width) / 2)
            y = pad_y + round(source.height - art.height)
        else:
            x = pad_x
            y = pad_y

        paste_centered(frame, art, x, y)
        sheet.alpha_composite(frame, (index * frame_w, 0))

    sheet.save(FRAMES / output_name, optimize=True)


def make_screen_vfx_sheet(source_name: str, output_name: str, frames: int, max_edge: int, kind: str) -> None:
    source = fit_image(Image.open(VFX / source_name).convert("RGBA"), max_edge)
    frame_w, frame_h = source.size
    sheet = Image.new("RGBA", (frame_w * frames, frame_h), (0, 0, 0, 255))

    for index in range(frames):
        t = index / frames
        phase = math.sin(t * math.tau)
        art = source.copy()
        if kind == "portal":
            art = art.rotate(2.4 * phase, resample=Image.Resampling.BICUBIC, center=(frame_w / 2, frame_h / 2))
            art = ImageEnhance.Brightness(art).enhance(0.88 + 0.2 * max(0, phase))
            art = ImageEnhance.Color(art).enhance(1.08)
        else:
            art = ImageEnhance.Brightness(art).enhance(0.78 + 0.28 * ((index % 3) / 2))
            art = ImageChops.offset(art, 0, round(2 * phase))
        sheet.alpha_composite(art, (index * frame_w, 0))

    sheet.save(FRAMES / output_name, optimize=True)


def crop_ui() -> None:
    atlas = Image.open(UI / "ui-skin-atlas.png").convert("RGBA")
    crops = {
        "topbar.png": (64, 52, 1388, 176),
        "dialog-panel.png": (44, 226, 954, 648),
        "inventory-strip.png": (44, 758, 1342, 956),
        "button-teal.png": (1580, 54, 1750, 144),
        "button-dark.png": (1428, 356, 1578, 436),
        "button-parchment.png": (1606, 356, 1760, 438),
        "slot.png": (150, 790, 244, 914),
        "slot-selected.png": (1444, 768, 1586, 928),
        "time-plaque.png": (986, 242, 1408, 430),
    }
    for name, box in crops.items():
        atlas.crop(box).save(UI / name, optimize=True)


def load_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/trebucbd.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.truetype("DejaVuSans-Bold.ttf", size=size)


def render_label(text: str, output: str, size: int = 44) -> None:
    font = load_font(size)
    dummy = Image.new("RGBA", (1, 1))
    draw = ImageDraw.Draw(dummy)
    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=3)
    width = bbox[2] - bbox[0] + 34
    height = bbox[3] - bbox[1] + 24
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.text(
        (17 - bbox[0], 10 - bbox[1]),
        text,
        font=font,
        fill=(255, 242, 204, 255),
        stroke_width=4,
        stroke_fill=(25, 18, 13, 255),
    )
    image.save(LABELS / output, optimize=True)


def render_labels() -> None:
    labels = {
        "tab-lab.png": "GEGENWART",
        "tab-past.png": "1876",
        "tab-future.png": "2189",
        "verb-look.png": "SCHAU",
        "verb-take.png": "NIMM",
        "verb-use.png": "BENUTZE",
        "verb-talk.png": "REDE",
        "inventory.png": "INVENTAR",
        "reset.png": "NEU",
        "next.png": "WEITER",
        "title-lab.png": "LABOR UNTER DEM KURHOTEL",
        "title-past.png": "DAMPFBÄCKEREI",
        "title-future.png": "SNACKMUSEUM",
    }
    for output, text in labels.items():
        render_label(text, output, 40 if output.startswith("title") else 34)


def render_font_atlas() -> None:
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäöüß0123456789!?.,:;+-/()' "
    font = load_font(46)
    cell_w, cell_h = 64, 72
    columns = 12
    rows = math.ceil(len(chars) / columns)
    atlas = Image.new("RGBA", (columns * cell_w, rows * cell_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(atlas)
    meta: dict[str, dict[str, int]] = {}
    for index, char in enumerate(chars):
        col = index % columns
        row = index // columns
        x = col * cell_w
        y = row * cell_h
        bbox = draw.textbbox((0, 0), char, font=font, stroke_width=3)
        tx = x + (cell_w - (bbox[2] - bbox[0])) // 2 - bbox[0]
        ty = y + (cell_h - (bbox[3] - bbox[1])) // 2 - bbox[1]
        draw.text((tx, ty), char, font=font, fill=(255, 242, 204, 255), stroke_width=3, stroke_fill=(25, 18, 13, 255))
        meta[char] = {"x": x, "y": y, "w": cell_w, "h": cell_h}
    atlas.save(FONTS / "zeitkalamari-bitmap-font-atlas.png", optimize=True)
    (FONTS / "zeitkalamari-bitmap-font-atlas.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    make_cutout_sheet("professor.png", "professor-idle-sheet.png", 6, 760, "npc")
    make_cutout_sheet("chef.png", "chef-idle-sheet.png", 6, 820, "npc")
    make_cutout_sheet("guard.png", "guard-idle-sheet.png", 6, 820, "npc")
    make_cutout_sheet("lab-tank-squid.png", "lab-tank-squid-idle-sheet.png", 8, 1050, "tank")
    make_cutout_sheet("yeast-gel.png", "yeast-gel-idle-sheet.png", 6, 520, "gel")
    make_screen_vfx_sheet("portal-glow.png", "portal-glow-sheet.png", 8, 760, "portal")
    make_screen_vfx_sheet("vacuum-tubes-glow.png", "vacuum-tubes-glow-sheet.png", 6, 520, "tube")
    crop_ui()
    render_labels()
    render_font_atlas()
    print("Imagen runtime assets built.")


if __name__ == "__main__":
    main()
