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


def component_boxes(img: Image.Image) -> list[tuple[int, int, int, int]]:
    alpha = img.getchannel("A")
    w, h = alpha.size
    mask = bytearray(1 if v > 12 else 0 for v in alpha.tobytes())
    seen = bytearray(w * h)
    boxes: list[tuple[int, int, int, int, int]] = []

    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not mask[i] or seen[i]:
                continue
            stack = [(x, y)]
            seen[i] = 1
            x0 = x1 = x
            y0 = y1 = y
            count = 0
            while stack:
                cx, cy = stack.pop()
                count += 1
                x0 = min(x0, cx)
                x1 = max(x1, cx)
                y0 = min(y0, cy)
                y1 = max(y1, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        ni = ny * w + nx
                        if mask[ni] and not seen[ni]:
                            seen[ni] = 1
                            stack.append((nx, ny))
            if count > 12000:
                boxes.append((count, x0, y0, x1 + 1, y1 + 1))

    if len(boxes) < 8:
        raise SystemExit(f"Expected several boss components, found {len(boxes)}")

    # The source image has reliable character silhouettes but not a perfect slot grid.
    # Sort by visual rows, then x, and duplicate the last dash poses to fill 16 frames.
    boxes = sorted(boxes, key=lambda b: b[0], reverse=True)[:16]
    top_cut = img.height * 0.48
    top = sorted([b for b in boxes if (b[2] + b[4]) / 2 < top_cut], key=lambda b: b[1])
    bottom = sorted([b for b in boxes if (b[2] + b[4]) / 2 >= top_cut], key=lambda b: b[1])
    ordered = top + bottom
    while len(ordered) < FRAMES:
      ordered.append(ordered[-1])
    return [(b[1], b[2], b[3], b[4]) for b in ordered[:FRAMES]]


def extract_frames(atlas: Image.Image) -> list[Image.Image]:
    keyed = remove_green_key(atlas)
    frames = []
    for x0, y0, x1, y1 in component_boxes(keyed):
        pad_x = round((x1 - x0) * 0.18)
        pad_y = round((y1 - y0) * 0.08)
        box = (
            max(0, x0 - pad_x),
            max(0, y0 - pad_y),
            min(keyed.width, x1 + pad_x),
            min(keyed.height, y1 + pad_y),
        )
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
    scale = min((FRAME_W * 0.92) / max_w, (FRAME_H * 0.93) / max_h)
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
        normalized.append(canvas)
    return normalized


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
