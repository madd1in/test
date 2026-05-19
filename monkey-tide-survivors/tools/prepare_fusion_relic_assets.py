from collections import deque
from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "sprites" / "fusion_relics_imagen_hd_source.png"
OUT = ROOT / "assets" / "sprites" / "fusion_relics_imagen_hd_clean.png"


def is_key_like(r, g, b):
    return r > 176 and b > 176 and g < 144 and abs(r - b) < 92


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
            elif edge_touch and r > 172 and b > 172 and g < 120:
                pixels[x, y] = (min(r, 174), g, min(b, 182), min(a, 150))
    return src


def crop_and_normalize():
    src = Image.open(SRC).convert("RGBA")
    width, height = src.size
    canvas = Image.new("RGBA", (4 * 256, 4 * 256), (0, 0, 0, 0))
    for row in range(4):
        for col in range(4):
            left = round(col * width / 4)
            top = round(row * height / 4)
            right = round((col + 1) * width / 4)
            bottom = round((row + 1) * height / 4)
            cell = remove_magenta(src.crop((left, top, right, bottom)))
            cell.thumbnail((238, 238), Image.Resampling.LANCZOS)
            normalized = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
            normalized.alpha_composite(cell, ((256 - cell.width) // 2, (256 - cell.height) // 2))
            canvas.alpha_composite(normalized, (col * 256, row * 256))
    canvas.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    crop_and_normalize()
