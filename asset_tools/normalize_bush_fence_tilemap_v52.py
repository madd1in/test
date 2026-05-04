from __future__ import annotations

import json
from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "generated"
RAW = OUT / "bush_fence_tilemap_imagegen_v52_raw.png"
SHEET = OUT / "bush_fence_tilemap_imagegen_v52.png"
META = OUT / "bush_fence_tilemap_imagegen_v52.json"
TILE = 32
COLS = 8
ROWS = 4


NAMES = [
    "hedge_dense",
    "hedge_low",
    "bush_round",
    "bush_gloss",
    "bush_shadow",
    "bush_cluster",
    "fern_spike",
    "vine_hedge",
    "rose_left",
    "rose_bloom",
    "rose_branch",
    "rose_dense",
    "rose_buds",
    "rose_hanging",
    "rose_tree",
    "rose_wall",
    "fence_pillar_left",
    "fence_rail_round",
    "fence_rail_vine",
    "fence_rail_plain",
    "fence_crown",
    "fence_low",
    "fence_frame",
    "fence_pillar_right",
    "lattice_clover",
    "lattice_diamond",
    "lattice_arch",
    "lattice_cross",
    "lattice_rosette",
    "lattice_quatrefoil",
    "stone_plinth_a",
    "stone_plinth_b",
]


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def edge_median(img: Image.Image) -> tuple[int, int, int]:
    px = img.convert("RGB").load()
    w, h = img.size
    samples: list[tuple[int, int, int]] = []
    for x in range(0, w, max(1, w // 48)):
        samples.append(px[x, 0])
        samples.append(px[x, h - 1])
    for y in range(0, h, max(1, h // 48)):
        samples.append(px[0, y])
        samples.append(px[w - 1, y])
    return (
        int(median(c[0] for c in samples)),
        int(median(c[1] for c in samples)),
        int(median(c[2] for c in samples)),
    )


def transparent_matte(img: Image.Image, row: int) -> Image.Image:
    rgba = img.convert("RGBA")
    src = rgba.load()
    w, h = rgba.size
    bg = edge_median(rgba)
    threshold = 28 if row >= 2 else 24

    def is_matte(x: int, y: int) -> bool:
        r, g, b, a = src[x, y]
        if a == 0:
            return True
        return color_distance((r, g, b), bg) <= threshold

    seen = [[False for _ in range(h)] for _ in range(w)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        if is_matte(x, 0):
            q.append((x, 0))
            seen[x][0] = True
        if is_matte(x, h - 1):
            q.append((x, h - 1))
            seen[x][h - 1] = True
    for y in range(h):
        if is_matte(0, y) and not seen[0][y]:
            q.append((0, y))
            seen[0][y] = True
        if is_matte(w - 1, y) and not seen[w - 1][y]:
            q.append((w - 1, y))
            seen[w - 1][y] = True

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny] and is_matte(nx, ny):
                seen[nx][ny] = True
                q.append((nx, ny))

    for x in range(w):
        for y in range(h):
            if seen[x][y]:
                src[x, y] = (0, 0, 0, 0)
    return rgba


def crop_tile(src: Image.Image, col: int, row: int) -> Image.Image:
    cell_w = src.width / COLS
    cell_h = src.height / ROWS
    margin = int(min(cell_w, cell_h) * 0.035)
    left = int(col * cell_w + margin)
    top = int(row * cell_h + margin)
    right = int((col + 1) * cell_w - margin)
    bottom = int((row + 1) * cell_h - margin)
    tile = src.crop((left, top, right, bottom))
    tile = transparent_matte(tile, row)
    tile = tile.resize((TILE, TILE), Image.Resampling.LANCZOS)
    tile = tile.quantize(colors=64, method=Image.Quantize.FASTOCTREE).convert("RGBA")
    data = tile.load()
    for x in range(TILE):
        for y in range(TILE):
            r, g, b, a = data[x, y]
            if a < 14:
                data[x, y] = (0, 0, 0, 0)
            elif a < 255:
                data[x, y] = (r, g, b, min(255, a + 24))
    return tile


def main() -> None:
    if not RAW.exists():
        raise FileNotFoundError(f"Missing Imagegen raw atlas: {RAW}")
    OUT.mkdir(parents=True, exist_ok=True)
    raw = Image.open(RAW)
    sheet = Image.new("RGBA", (COLS * TILE, ROWS * TILE), (0, 0, 0, 0))
    meta = {
        "tileSize": TILE,
        "columns": COLS,
        "rows": ROWS,
        "source": RAW.name,
        "sourcePrompt": "Imagegen 8x4 16-bit gothic garden atlas: hedges, rose bushes, wrought-iron fence, garden lattice/grille tiles.",
        "tiles": {},
    }
    for row in range(ROWS):
        for col in range(COLS):
            idx = row * COLS + col
            tile = crop_tile(raw, col, row)
            x = col * TILE
            y = row * TILE
            sheet.alpha_composite(tile, (x, y))
            meta["tiles"][NAMES[idx]] = {"index": idx, "x": x, "y": y, "w": TILE, "h": TILE}
    sheet.save(SHEET)
    META.write_text(json.dumps(meta, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
