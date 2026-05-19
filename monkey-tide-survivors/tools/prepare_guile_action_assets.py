from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SRC = SPRITES / "guile_action_sheet_imagen_hd_source.png"
OUT = SPRITES / "guile_action_sheet_imagen_hd.png"
COLS = 8
ROWS = 5
FRAME = 256
ROW_MAX_WIDTH = [226, 250, 232, 236, 252]
ROW_MAX_HEIGHT = [216, 218, 224, 220, 238]
ROW_BOTTOM_PAD = [18, 18, 16, 18, 8]
SOURCE_COLS_BY_ROW = {
    1: [0, 1, 2, 3, 4, 5, 5, 7],
}


def is_key_like(r, g, b):
    return r > 185 and b > 185 and g < 108 and abs(r - b) < 82


def remove_magenta(image):
    src = image.convert("RGBA")
    pixels = src.load()
    w, h = src.size
    clear = [[False for _ in range(w)] for _ in range(h)]
    queue = deque()
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))
    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or clear[y][x]:
            continue
        r, g, b, a = pixels[x, y]
        if a == 0 or is_key_like(r, g, b):
            clear[y][x] = True
            queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            hard_magenta = r > 175 and b > 165 and g < 116 and abs(r - b) < 96
            soft_magenta = r > 135 and b > 128 and g < 100 and (r + b) > g * 3.0
            if clear[y][x] or hard_magenta or (a < 28 and soft_magenta):
                pixels[x, y] = (r, g, b, 0)
                continue
            edge_touch = False
            for nx in (x - 1, x, x + 1):
                for ny in (y - 1, y, y + 1):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h or clear[ny][nx]:
                        edge_touch = True
            if edge_touch and soft_magenta:
                pixels[x, y] = (min(r, 120), g, min(b, 138), 0)
            elif soft_magenta:
                pixels[x, y] = (min(r, 150), g, min(b, 158), min(a, 170))
    return src


def alpha_bbox(image):
    return image.getchannel("A").getbbox()


def trim_low_alpha(image, threshold=18):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        if pixels[index + 3] <= threshold:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def crop_cell(source, row, col):
    col = SOURCE_COLS_BY_ROW.get(row, list(range(COLS)))[col]
    width, height = source.size
    left = round(col * width / COLS)
    right = round((col + 1) * width / COLS)
    top = round(row * height / ROWS)
    bottom = round((row + 1) * height / ROWS)
    return trim_low_alpha(remove_magenta(source.crop((left, top, right, bottom))))


def visible_crop(cell):
    bbox = alpha_bbox(cell)
    return cell.crop(bbox) if bbox else Image.new("RGBA", (1, 1), (0, 0, 0, 0))


def build_sheet():
    source = Image.open(SRC).convert("RGBA")
    rows = []
    for row in range(ROWS):
        crops = [visible_crop(crop_cell(source, row, col)) for col in range(COLS)]
        max_w = max(crop.width for crop in crops)
        max_h = max(crop.height for crop in crops)
        scale = min(ROW_MAX_WIDTH[row] / max(1, max_w), ROW_MAX_HEIGHT[row] / max(1, max_h), 1.35)
        rows.append((crops, scale))

    sheet = Image.new("RGBA", (COLS * FRAME, ROWS * FRAME), (0, 0, 0, 0))
    stats = []
    for row, (crops, scale) in enumerate(rows):
        row_heights = []
        row_widths = []
        for col, crop in enumerate(crops):
            width = max(1, round(crop.width * scale))
            height = max(1, round(crop.height * scale))
            sprite = crop.resize((width, height), Image.Resampling.LANCZOS)
            sprite = trim_low_alpha(sprite, 10)
            x = col * FRAME + (FRAME - width) // 2
            y = row * FRAME + FRAME - height - ROW_BOTTOM_PAD[row]
            sheet.alpha_composite(sprite, (x, y))
            row_widths.append(width)
            row_heights.append(height)
        stats.append({
            "row": row,
            "scale": round(scale, 4),
            "widths": row_widths,
            "heights": row_heights,
        })

    sheet.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)}")
    for stat in stats:
        print(stat)


if __name__ == "__main__":
    build_sheet()
