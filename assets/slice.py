#!/usr/bin/env python3
"""Auto-slice the uploaded sprite sheets into individual frame PNGs.

The sheets all have a uniform grey background (~133,132,131). We detect
which columns/rows have any non-bg pixels, group them into row-bands,
and within each band detect individual sprite columns by finding
column-gaps. Each sprite is exported as a centered, transparent-bg PNG.
A JSON atlas with bounding boxes is written next to the sprites.
"""
import os, json, sys
from PIL import Image

ART = os.path.join(os.path.dirname(__file__), 'art')
OUT = os.path.join(os.path.dirname(__file__), 'sprites2')
os.makedirs(OUT, exist_ok=True)

BG_TOL = 18   # tolerance for matching grey bg
LABEL_PX = 38 # pixel rows reserved for the label text under each row


def is_fg(p, bg):
    return any(abs(p[i] - bg[i]) > BG_TOL for i in range(3))


def detect_bg(im):
    # average several corner samples
    s = []
    w, h = im.size
    for x, y in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3), (w // 2, 2)]:
        s.append(im.getpixel((x, y)))
    return tuple(sum(c[i] for c in s) // len(s) for i in range(3))


def row_mask(im, bg):
    """Return a list of bool, one per pixel row, True if any fg pixel."""
    w, h = im.size
    px = im.load()
    out = []
    for y in range(h):
        any_fg = False
        # quick horizontal scan with stride 4 for speed
        for x in range(0, w, 3):
            if is_fg(px[x, y], bg):
                any_fg = True
                break
        out.append(any_fg)
    return out


def group_rows(mask, gap=14):
    """Find contiguous fg row bands separated by >=gap empty rows."""
    bands = []
    in_band = False
    start = 0
    empty = 0
    for y, f in enumerate(mask):
        if f:
            if not in_band:
                in_band = True
                start = y
            empty = 0
        else:
            if in_band:
                empty += 1
                if empty >= gap:
                    bands.append((start, y - empty + 1))
                    in_band = False
                    empty = 0
    if in_band:
        bands.append((start, len(mask)))
    # filter tiny bands (text-only labels)
    bands = [b for b in bands if b[1] - b[0] > 18]
    return bands


def col_mask(im, bg, y0, y1):
    w, _ = im.size
    px = im.load()
    out = []
    for x in range(w):
        any_fg = False
        for y in range(y0, y1, 2):
            if is_fg(px[x, y], bg):
                any_fg = True
                break
        out.append(any_fg)
    return out


def group_cols(mask, gap=3):
    bands = []
    in_band = False
    start = 0
    empty = 0
    for x, f in enumerate(mask):
        if f:
            if not in_band:
                in_band = True
                start = x
            empty = 0
        else:
            if in_band:
                empty += 1
                if empty >= gap:
                    bands.append((start, x - empty + 1))
                    in_band = False
                    empty = 0
    if in_band:
        bands.append((start, len(mask)))
    bands = [b for b in bands if b[1] - b[0] > 8]
    return bands


def crop_with_alpha(im, bg, box):
    x0, y0, x1, y1 = box
    region = im.crop(box).convert('RGBA')
    px = region.load()
    w, h = region.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if all(abs([r, g, b][i] - bg[i]) <= BG_TOL for i in range(3)):
                px[x, y] = (0, 0, 0, 0)
    # tighten alpha bbox
    bbox = region.getbbox()
    if bbox:
        region = region.crop(bbox)
    return region


def slice_sheet(name, sheet_dir=OUT):
    src = os.path.join(ART, f'{name}.png')
    im = Image.open(src).convert('RGB')
    bg = detect_bg(im)
    rmask = row_mask(im, bg)
    bands = group_rows(rmask)

    sheet_out = os.path.join(sheet_dir, name)
    os.makedirs(sheet_out, exist_ok=True)
    atlas = []
    for ri, (y0, y1) in enumerate(bands):
        # leave a small bottom margin in case label text dipped into the band
        cmask = col_mask(im, bg, y0, y1)
        cols = group_cols(cmask)
        for ci, (x0, x1) in enumerate(cols):
            box = (x0, y0, x1, y1)
            sub = crop_with_alpha(im, bg, box)
            fn = f'r{ri:02d}_c{ci:02d}.png'
            sub.save(os.path.join(sheet_out, fn))
            atlas.append({
                'sheet': name,
                'row': ri,
                'col': ci,
                'box': list(box),
                'size': list(sub.size),
                'file': fn,
            })
        print(f'{name} band {ri}: y={y0}-{y1} cols={len(cols)}')
    with open(os.path.join(sheet_out, 'atlas.json'), 'w') as f:
        json.dump(atlas, f, indent=1)
    return atlas


def main():
    for name in ['sprites_actors', 'sprites_enemies']:
        slice_sheet(name)
    print('done')


if __name__ == '__main__':
    main()
