"""Normalize the Imagen Lord Veyr sprite-sheet source into a 16-frame strip."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "imagen_nocturne_boss_hd_sheet_20260508.png"
OUT = ROOT / "assets" / "generated" / "boss_sheet_hd_16.png"
FRAME_W = 320
FRAME_H = 256
FRAMES = 16

# The Imagen source has good character poses, but it did not honor an exact
# 8x2 slot grid. These boxes are hand-picked from the source atlas so the
# runtime strip contains whole silhouettes instead of detached spell fragments.
FRAME_BOXES = [
    (8, 54, 216, 404),
    (214, 54, 438, 404),
    (436, 54, 658, 404),
    (662, 54, 882, 404),
    (896, 54, 1110, 404),
    (1116, 54, 1324, 404),
    (1334, 66, 1548, 408),
    (1560, 70, 1774, 410),
    (0, 452, 232, 838),
    (238, 448, 452, 838),
    (470, 436, 700, 838),
    (470, 436, 700, 838),
    (690, 566, 1048, 842),
    (1040, 584, 1354, 842),
    (1338, 594, 1774, 842),
    (1338, 594, 1774, 842),
]


def remove_green_key(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = px[x, y]
            green_score = g - max(r, b)
            if g > 165 and green_score > 58:
                px[x, y] = (0, 0, 0, 0)
            elif g > 110 and green_score > 34:
                alpha = int(a * max(0, min(1, 1 - (green_score - 34) / 70)))
                px[x, y] = (r, min(g, max(r, b) + 12), b, alpha)
            elif g > max(r, b) + 24:
                px[x, y] = (r, min(g, max(r, b) + 10), b, a)
    return rgba


def extract_frames(atlas: Image.Image) -> list[Image.Image]:
    keyed = remove_green_key(atlas)
    frames = []
    for box in FRAME_BOXES:
        crop = keyed.crop(box)
        crop = ImageEnhance.Contrast(crop).enhance(1.04)
        crop = ImageEnhance.Color(crop).enhance(1.03)
        crop = crop.filter(ImageFilter.UnsharpMask(radius=0.8, percent=70, threshold=3))
        frames.append(crop)
    return frames


def normalize(frames: list[Image.Image]) -> list[Image.Image]:
    boxes = [frame.getbbox() for frame in frames]
    boxes = [box for box in boxes if box]
    if not boxes:
        raise SystemExit("No non-transparent boss frames found")

    max_w = max(box[2] - box[0] for box in boxes)
    max_h = max(box[3] - box[1] for box in boxes)
    scale = min((FRAME_W * 0.96) / max_w, (FRAME_H * 0.96) / max_h, 0.78)
    normalized = []

    for frame in frames:
        box = frame.getbbox()
        canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        if box:
            body = frame.crop(box)
            body = body.resize((round(body.width * scale), round(body.height * scale)), Image.Resampling.LANCZOS)
            x = (FRAME_W - body.width) // 2
            y = FRAME_H - body.height - 5
            canvas.alpha_composite(body, (x, y))
        normalized.append(drop_small_components(canvas))
    return normalized


def drop_small_components(img: Image.Image, min_pixels: int = 900) -> Image.Image:
    alpha = img.getchannel("A")
    w, h = alpha.size
    mask = bytearray(1 if v > 16 else 0 for v in alpha.tobytes())
    seen = bytearray(w * h)
    keep = bytearray(w * h)

    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not mask[i] or seen[i]:
                continue
            stack = [(x, y)]
            seen[i] = 1
            component = []
            while stack:
                cx, cy = stack.pop()
                ci = cy * w + cx
                component.append(ci)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        ni = ny * w + nx
                        if mask[ni] and not seen[ni]:
                            seen[ni] = 1
                            stack.append((nx, ny))
            if len(component) >= min_pixels:
                for ci in component:
                    keep[ci] = 1

    out = img.copy()
    px = out.load()
    for y in range(h):
        for x in range(w):
            if not keep[y * w + x]:
                px[x, y] = (0, 0, 0, 0)
    return out


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source sheet: {SOURCE}")
    atlas = Image.open(SOURCE)
    frames = normalize(extract_frames(atlas))
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME_W, 0))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    print(f"Wrote {OUT} ({FRAME_W}x{FRAME_H}, {FRAMES} frames)")


if __name__ == "__main__":
    main()
