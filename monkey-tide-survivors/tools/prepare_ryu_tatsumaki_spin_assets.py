from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SOURCE = SPRITES / "ryu_tatsumaki_spin_imagen_hd_source_v4.png"
FRAME9_SOURCE = SPRITES / "ryu_tatsumaki_frame9_imagen_hd_source_v1.png"
RYU_BASE = SPRITES / "ryu_action_sheet_imagen_hd_v10.png"
RYU_OUT = SPRITES / "ryu_action_sheet_imagen_hd_v12.png"
PREVIEW_OUT = SPRITES / "ryu_tatsumaki_spin_preview_v4.png"

FRAME = 256
COLS = 12
TATSU_ROW = 3


def remove_green_key(image):
    image = image.convert("RGBA")
    pixels = []
    for r, g, b, a in image.getdata():
        green_delta = g - max(r, b)
        keyed = g > 126 and green_delta > 34
        hard_keyed = g > 156 and green_delta > 58
        if hard_keyed:
            pixels.append((0, 0, 0, 0))
            continue
        if keyed:
            alpha = max(0, min(a, int(a * (58 - green_delta) / 24)))
            pixels.append((r, min(g, max(r, b) + 22), b, alpha))
            continue
        if g > max(r, b) + 10:
            g = min(g, max(r, b) + 32)
        pixels.append((r, g, b, a))
    out = Image.new("RGBA", image.size)
    out.putdata(pixels)
    return out


def alpha_bbox(image, threshold=8):
    alpha = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    return alpha.getbbox()


def hard_cut_alpha(image, threshold=28):
    image = image.convert("RGBA")
    pixels = []
    for r, g, b, a in image.getdata():
        pixels.append((r, g, b, 0 if a <= threshold else a))
    out = Image.new("RGBA", image.size)
    out.putdata(pixels)
    return out


def clear_frame_edge(image, border=2):
    pixels = image.load()
    w, h = image.size
    for x in range(w):
        for y in range(border):
            pixels[x, y] = (0, 0, 0, 0)
            pixels[x, h - 1 - y] = (0, 0, 0, 0)
    for y in range(h):
        for x in range(border):
            pixels[x, y] = (0, 0, 0, 0)
            pixels[w - 1 - x, y] = (0, 0, 0, 0)
    return image


def grouped_indices(indices):
    if not indices:
        return []
    groups = [[indices[0], indices[0]]]
    for value in indices[1:]:
        if value <= groups[-1][1] + 1:
            groups[-1][1] = value
        else:
            groups.append([value, value])
    return groups


def sprite_grid_y_bounds(source):
    rgb = source.convert("RGB")
    rows = []
    for y in range(rgb.height):
        white = 0
        for x in range(0, rgb.width, 2):
            r, g, b = rgb.getpixel((x, y))
            if r > 225 and g > 225 and b > 225 and max(r, g, b) - min(r, g, b) < 28:
                white += 2
        if white > rgb.width * 0.55:
            rows.append(y)
    groups = grouped_indices(rows)
    if len(groups) >= 2:
        return groups[0][1] + 3, groups[-1][0] - 3
    return 0, source.height


def source_cell(source, col, y0, y1):
    cell_w = source.width / COLS
    x0 = round(col * cell_w) + 7
    x1 = round((col + 1) * cell_w) - 7
    cell = remove_green_key(source.crop((x0, y0 + 4, x1, y1 - 4)))
    return clear_frame_edge(cell, border=9)


def normalized_tatsumaki_row(source, fit_w=242, fit_h=238, anchor_y=244):
    y0, y1 = sprite_grid_y_bounds(source)
    cells = [source_cell(source, col, y0, y1) for col in range(COLS)]
    boxes = [alpha_bbox(cell) for cell in cells]
    visible = [box for box in boxes if box]
    if len(visible) != COLS:
        raise SystemExit(f"Expected {COLS} visible Tatsumaki cells, found {len(visible)}")

    max_w = max(box[2] - box[0] for box in visible)
    max_h = max(box[3] - box[1] for box in visible)
    scale = min(fit_w / max(1, max_w), fit_h / max(1, max_h))
    out = []
    for cell, box in zip(cells, boxes):
        canvas = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
        sprite = cell.crop(box)
        width = max(1, round(sprite.width * scale))
        height = max(1, round(sprite.height * scale))
        sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
        sprite = sprite.filter(ImageFilter.UnsharpMask(radius=1.0, percent=72, threshold=3))
        sprite = ImageEnhance.Contrast(sprite).enhance(1.04)
        sprite = hard_cut_alpha(sprite)
        x = max(4, min(FRAME - width - 4, round((FRAME - width) / 2)))
        y = max(4, min(FRAME - height - 4, round(anchor_y - height)))
        canvas.alpha_composite(sprite, (x, y))
        out.append(clear_frame_edge(canvas, border=5))
    return out


def normalized_single_frame(source, fit_w=242, fit_h=238, anchor_y=244):
    cell = clear_frame_edge(remove_green_key(source), border=18)
    box = alpha_bbox(cell)
    if not box:
        raise SystemExit(f"No visible sprite found in {FRAME9_SOURCE}")
    sprite = cell.crop(box)
    scale = min(fit_w / max(1, sprite.width), fit_h / max(1, sprite.height))
    width = max(1, round(sprite.width * scale))
    height = max(1, round(sprite.height * scale))
    sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
    sprite = sprite.filter(ImageFilter.UnsharpMask(radius=1.0, percent=72, threshold=3))
    sprite = ImageEnhance.Contrast(sprite).enhance(1.04)
    sprite = hard_cut_alpha(sprite)
    canvas = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = max(4, min(FRAME - width - 4, round((FRAME - width) / 2)))
    y = max(4, min(FRAME - height - 4, round(anchor_y - height)))
    canvas.alpha_composite(sprite, (x, y))
    return clear_frame_edge(canvas, border=5)


def replace_row(base_path, out_path, frames):
    sheet = Image.open(base_path).convert("RGBA")
    if sheet.size != (FRAME * COLS, FRAME * 5):
        raise SystemExit(f"Unexpected action sheet size for {base_path}: {sheet.size}")
    out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    out.alpha_composite(sheet)
    y = TATSU_ROW * FRAME
    out.paste((0, 0, 0, 0), (0, y, FRAME * COLS, y + FRAME))
    for col, frame in enumerate(frames):
        out.alpha_composite(frame, (col * FRAME, y))
    out.save(out_path, optimize=True)


def make_preview(frames):
    preview = Image.new("RGBA", (FRAME * COLS, FRAME), (12, 14, 18, 255))
    for col, frame in enumerate(frames):
        preview.alpha_composite(frame, (col * FRAME, 0))
    preview.save(PREVIEW_OUT, optimize=True)


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing generated source: {SOURCE}")
    if not FRAME9_SOURCE.exists():
        raise SystemExit(f"Missing generated frame 9 source: {FRAME9_SOURCE}")
    source = Image.open(SOURCE).convert("RGBA")
    frame9_source = Image.open(FRAME9_SOURCE).convert("RGBA")
    if source.width < 1200 or source.height < 300:
        raise SystemExit(f"Unexpected source size: {source.size}")
    frames = normalized_tatsumaki_row(source)
    frames[8] = normalized_single_frame(frame9_source)
    replace_row(RYU_BASE, RYU_OUT, frames)
    make_preview(frames)
    for path in [SOURCE, FRAME9_SOURCE, RYU_OUT, PREVIEW_OUT]:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
