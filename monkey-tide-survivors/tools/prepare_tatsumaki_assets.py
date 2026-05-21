from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SOURCE = SPRITES / "tatsumaki_senpukyaku_imagen_hd_source_v2.png"
RYU_BASE = SPRITES / "ryu_action_sheet_imagen_hd_v8.png"
KEN_BASE = SPRITES / "ken_action_sheet_imagen_hd_v4.png"
RYU_OUT = SPRITES / "ryu_action_sheet_imagen_hd_v10.png"
KEN_OUT = SPRITES / "ken_action_sheet_imagen_hd_v6.png"
PREVIEW_OUT = SPRITES / "tatsumaki_senpukyaku_preview_v2.png"

FRAME = 256
COLS = 12
ROWS = 2
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


def source_cell(source, row, col):
    cell_w = source.width / COLS
    cell_h = source.height / ROWS
    x0 = round(col * cell_w) + 3
    x1 = round((col + 1) * cell_w) - 3
    y0 = round(row * cell_h) + 3
    y1 = round((row + 1) * cell_h) - 3
    return remove_green_key(source.crop((x0, y0, x1, y1)))


def normalized_tatsumaki_row(source, row, fit_w=242, fit_h=238, anchor_y=244):
    cells = [source_cell(source, row, col) for col in range(COLS)]
    boxes = [alpha_bbox(cell) for cell in cells]
    visible = [box for box in boxes if box]
    if not visible:
        raise SystemExit(f"No visible cells found in source row {row}")

    max_w = max(box[2] - box[0] for box in visible)
    max_h = max(box[3] - box[1] for box in visible)
    scale = min(fit_w / max(1, max_w), fit_h / max(1, max_h))
    out = []
    for cell, box in zip(cells, boxes):
        canvas = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
        if not box:
            out.append(canvas)
            continue
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
        out.append(clear_frame_edge(canvas))
    return out


def replace_row(base_path, out_path, frames):
    sheet = Image.open(base_path).convert("RGBA")
    if sheet.size != (FRAME * COLS, FRAME * 5):
        raise SystemExit(f"Unexpected action sheet size for {base_path}: {sheet.size}")
    draw = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    draw.alpha_composite(sheet)
    y = TATSU_ROW * FRAME
    draw.paste((0, 0, 0, 0), (0, y, FRAME * COLS, y + FRAME))
    for col, frame in enumerate(frames):
        draw.alpha_composite(frame, (col * FRAME, y))
    draw.save(out_path, optimize=True)
    return draw


def make_preview(ryu_frames, ken_frames):
    preview = Image.new("RGBA", (FRAME * COLS, FRAME * 2), (12, 14, 18, 255))
    for row, frames in enumerate([ryu_frames, ken_frames]):
        for col, frame in enumerate(frames):
            x = col * FRAME
            y = row * FRAME
            preview.alpha_composite(frame, (x, y))
    preview.save(PREVIEW_OUT, optimize=True)


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing generated source: {SOURCE}")
    source = Image.open(SOURCE).convert("RGBA")
    if source.width < 1000 or source.height < 500:
        raise SystemExit(f"Unexpected source size: {source.size}")

    ryu_frames = normalized_tatsumaki_row(source, 0, fit_w=242, fit_h=238, anchor_y=244)
    ken_frames = normalized_tatsumaki_row(source, 1, fit_w=244, fit_h=238, anchor_y=244)
    replace_row(RYU_BASE, RYU_OUT, ryu_frames)
    replace_row(KEN_BASE, KEN_OUT, ken_frames)
    make_preview(ryu_frames, ken_frames)
    for path in [SOURCE, RYU_OUT, KEN_OUT, PREVIEW_OUT]:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
