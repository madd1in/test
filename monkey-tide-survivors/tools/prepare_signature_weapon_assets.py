from collections import deque
from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "sprites" / "signature_weapons_imagen_hd_source.png"
OUT = ROOT / "assets" / "sprites" / "signature_weapons_imagen_hd.png"
COLS = 4
ROWS = 11
FRAME = 256
SOURCE_ROW_CENTERS = [100, 302, 529, 680, 892, 1088, 1281, 1443, 1630, 1756, 1903]


def is_key_like(r, g, b):
    return r > 180 and b > 180 and g < 96 and abs(r - b) < 76


def remove_magenta(img):
    src = img.convert("RGBA")
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
            if clear[y][x]:
                pixels[x, y] = (r, g, b, 0)
                continue
            edge_touch = False
            for nx in (x - 1, x, x + 1):
                for ny in (y - 1, y, y + 1):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h or clear[ny][nx]:
                        edge_touch = True
            if edge_touch and is_key_like(r, g, b):
                pixels[x, y] = (r, g, b, 0)
            elif edge_touch and r > 170 and b > 170 and g < 125:
                pixels[x, y] = (min(r, 166), g, min(b, 176), min(a, 150))
    return src


def crop_visible(cell):
    alpha = cell.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return cell
    return cell.crop(bbox)


def normalize_cell(cell):
    cleaned = crop_visible(remove_magenta(cell))
    cleaned.thumbnail((236, 236), Image.Resampling.LANCZOS)
    normalized = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    normalized.alpha_composite(cleaned, ((FRAME - cleaned.width) // 2, (FRAME - cleaned.height) // 2))
    return normalized


def build_sheet():
    src = Image.open(SRC).convert("RGBA")
    width, height = src.size
    if len(SOURCE_ROW_CENTERS) == ROWS and height > SOURCE_ROW_CENTERS[-1]:
        row_bounds = [0]
        for a, b in zip(SOURCE_ROW_CENTERS, SOURCE_ROW_CENTERS[1:]):
            row_bounds.append(round((a + b) / 2))
        row_bounds.append(height)
    else:
        row_bounds = [round(row * height / ROWS) for row in range(ROWS + 1)]
    canvas = Image.new("RGBA", (COLS * FRAME, ROWS * FRAME), (0, 0, 0, 0))
    for row in range(ROWS):
        for col in range(COLS):
            left = round(col * width / COLS)
            right = round((col + 1) * width / COLS)
            top = row_bounds[row]
            bottom = row_bounds[row + 1]
            cell = normalize_cell(src.crop((left, top, right, bottom)))
            canvas.alpha_composite(cell, (col * FRAME, row * FRAME))
    canvas.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build_sheet()
