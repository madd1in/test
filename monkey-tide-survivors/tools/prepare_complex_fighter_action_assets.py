from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
FRAME = 256
COLS = 12
ROWS = 5


FIGHTERS = {
    "ryu": {
        "source": SPRITES / "ryu_action_sheet_imagen_hd_5row_source_v1.png",
        "safe_strip": SPRITES / "ryu_hadoken_cast_strip_imagen_hd_source_v1.png",
        "safe_row": 1,
        "out_action": SPRITES / "ryu_action_sheet_imagen_hd_v8.png",
        "out_fx": SPRITES / "ryu_hadoken_fx_imagen_hd_v7.png",
        "fx_rows": 4,
        "fx": "blue",
        "fit": [226, 236, 236, 238, 238],
    },
    "ken": {
        "source": SPRITES / "ken_action_sheet_imagen_hd_5row_source_v1.png",
        "safe_strip": SPRITES / "ken_dragon_rush_cast_strip_imagen_hd_source_v1.png",
        "safe_row": 4,
        "out_action": SPRITES / "ken_action_sheet_imagen_hd_v4.png",
        "out_fx": SPRITES / "ken_dragon_fx_imagen_hd_v4.png",
        "fx_rows": 3,
        "fx": "fire",
        "fit": [226, 238, 238, 240, 240],
    },
    "chun_li": {
        "source": SPRITES / "chun_li_action_sheet_imagen_hd_5row_source_v1.png",
        "safe_strip": SPRITES / "chun_li_kikouken_cast_strip_imagen_hd_source_v1.png",
        "safe_row": 2,
        "out_action": SPRITES / "chun_li_action_sheet_imagen_hd_v6.png",
        "out_fx": SPRITES / "chun_li_projectile_fx_imagen_hd_v6.png",
        "fx_rows": 3,
        "fx": "blue",
        "fit": [226, 238, 238, 240, 240],
    },
}


def remove_green_key(img):
    img = img.convert("RGBA")
    pixels = []
    for r, g, b, a in img.getdata():
        strongest_other = max(r, b)
        green_delta = g - strongest_other
        if g > 116 and green_delta > 28:
            pixels.append((r, g, b, 0))
            continue
        if g > strongest_other + 8:
            g = min(g, strongest_other + 26)
        pixels.append((r, g, b, 255 if a > 0 else 0))
    out = Image.new("RGBA", img.size)
    out.putdata(pixels)
    return out


def harden_alpha(img):
    img = img.convert("RGBA")
    pixels = []
    for r, g, b, a in img.getdata():
        pixels.append((r, g, b, 255 if a > 18 else 0))
    out = Image.new("RGBA", img.size)
    out.putdata(pixels)
    return out


def alpha_bbox(img, threshold=8):
    alpha = img.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    return alpha.getbbox()


def panel_green(pixel):
    r, g, b, _ = pixel
    return g > 140 and r > 20 and b < 100


def runs_from_mask(mask, min_len):
    runs = []
    start = None
    for index, value in enumerate(mask):
        if value and start is None:
            start = index
        if start is not None and (not value or index == len(mask) - 1):
            end = index if not value else index + 1
            if end - start >= min_len:
                runs.append((start, end))
            start = None
    return runs


def line_runs_y(source, x, min_len=80):
    return runs_from_mask([panel_green(source.getpixel((x, y))) for y in range(source.height)], min_len)


def line_runs_x(source, y, min_len=40):
    return runs_from_mask([panel_green(source.getpixel((x, y))) for x in range(source.width)], min_len)


def detect_row_panels(source):
    best = None
    for x in range(source.width):
        runs = line_runs_y(source, x)
        if len(runs) < 4:
            continue
        score = (abs(ROWS - len(runs)), -sum(end - start for start, end in runs))
        if best is None or score < best[0]:
            best = (score, runs)
    if not best:
        raise SystemExit("Could not detect row panels")
    runs = best[1]
    if len(runs) > ROWS:
        runs = sorted(runs, key=lambda run: run[1] - run[0], reverse=True)[:ROWS]
        runs = sorted(runs)
    return runs


def full_panel_score(runs):
    if not (10 <= len(runs) <= 13):
        return None
    widths = [end - start for start, end in runs]
    if min(widths) < 80:
        return None
    widths_sorted = sorted(widths)
    median = widths_sorted[len(widths_sorted) // 2]
    if median < 108:
        return None
    return (abs(COLS - len(runs)), -sum(widths), max(widths) - min(widths))


def detect_col_panels(source, row_run, fallback_runs):
    y0, y1 = row_run
    best = None
    for y in range(y0 + 8, min(y1 - 6, y0 + 46), 2):
        runs = line_runs_x(source, y)
        score = full_panel_score(runs)
        if score is None:
            continue
        if best is None or score < best[0]:
            best = (score, runs)
    if not best:
        return fallback_runs
    runs = best[1]
    if len(runs) > COLS:
        runs = sorted(runs, key=lambda run: run[1] - run[0], reverse=True)[:COLS]
        runs = sorted(runs)
    return runs


def resample_to_twelve(cells):
    if len(cells) == COLS:
        return cells
    if len(cells) < 2:
        return (cells * COLS)[:COLS]
    mapped = []
    for index in range(COLS):
        source_index = round(index * (len(cells) - 1) / (COLS - 1))
        mapped.append(cells[source_index])
    return mapped


def panel_cells(source):
    row_runs = detect_row_panels(source)
    base_cols = detect_col_panels(source, row_runs[0], [])
    if not base_cols:
        raise SystemExit("Could not detect base column panels")
    rows = []
    for row_run in row_runs:
        col_runs = detect_col_panels(source, row_run, base_cols)
        row = []
        for x0, x1 in col_runs:
            y0, y1 = row_run
            row.append(remove_green_key(source.crop((x0, y0, x1, y1))))
        rows.append(resample_to_twelve(row))
    return rows


def grid_cells(source, cols, rows):
    cell_w = source.width / cols
    cell_h = source.height / rows
    result = []
    for row in range(rows):
        row_cells = []
        for col in range(cols):
            x0 = round(col * cell_w)
            x1 = round((col + 1) * cell_w)
            y0 = round(row * cell_h)
            y1 = round((row + 1) * cell_h)
            row_cells.append(remove_green_key(source.crop((x0, y0, x1, y1))))
        result.append(row_cells)
    return result


def strip_cells(source):
    # The accepted full-body strips are 6 x 2 square tiles.
    return [cell for row in grid_cells(source, 6, 2) for cell in row]


def normalize_row(cells, fit=236, anchor_y=244):
    boxes = [alpha_bbox(cell) for cell in cells]
    visible = [box for box in boxes if box]
    if not visible:
        return [Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0)) for _ in cells]

    max_w = max(box[2] - box[0] for box in visible)
    max_h = max(box[3] - box[1] for box in visible)
    scale = min(fit / max(1, max_w), fit / max(1, max_h), 4.8)
    frames = []
    for cell, box in zip(cells, boxes):
        canvas = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
        if not box:
            frames.append(canvas)
            continue
        sprite = cell.crop(box)
        w = max(1, round(sprite.width * scale))
        h = max(1, round(sprite.height * scale))
        sprite = sprite.resize((w, h), Image.Resampling.LANCZOS)
        sprite = sprite.filter(ImageFilter.UnsharpMask(radius=1.0, percent=72, threshold=3))
        sprite = ImageEnhance.Contrast(sprite).enhance(1.04)
        x = max(0, min(FRAME - w, (FRAME - w) // 2))
        y = max(0, min(FRAME - h, round(anchor_y - h)))
        canvas.alpha_composite(sprite, (x, y))
        frames.append(harden_alpha(canvas))
    return frames


def build_action_sheet(config):
    source = Image.open(config["source"]).convert("RGBA")
    rows = panel_cells(source)
    safe_frames = strip_cells(Image.open(config["safe_strip"]).convert("RGBA"))

    sheet = Image.new("RGBA", (FRAME * COLS, FRAME * ROWS), (0, 0, 0, 0))
    for row_index, cells in enumerate(rows):
        if row_index == config["safe_row"]:
            cells = safe_frames
        frames = normalize_row(cells, fit=config["fit"][row_index])
        for col, frame in enumerate(frames):
            sheet.alpha_composite(frame, (col * FRAME, row_index * FRAME))
    sheet.save(config["out_action"], optimize=True)
    return config["out_action"]


def fx_mask_pixel(r, g, b, mode):
    if mode == "fire":
        return r > 145 and g > 58 and b < 110 and r > b + 60
    return b > 135 and g > 105 and r < 165 and (b > r + 25 or g > r + 25)


def isolate_fx(cell, mode):
    cell = cell.convert("RGBA")
    out = Image.new("RGBA", cell.size, (0, 0, 0, 0))
    source = cell.load()
    target = out.load()
    for y in range(cell.height):
        for x in range(cell.width):
            r, g, b, a = source[x, y]
            if a > 16 and fx_mask_pixel(r, g, b, mode):
                target[x, y] = (r, g, b, 255)
    return out.filter(ImageFilter.MaxFilter(3))


def visible_pixels(img):
    return sum(1 for _, _, _, a in img.getdata() if a > 8)


def normalize_fx_row(raw_fx, stage):
    strong = [index for index, fx in enumerate(raw_fx) if visible_pixels(fx) > 90]
    if not strong:
        return [Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0)) for _ in raw_fx]

    frames = []
    for col, fx in enumerate(raw_fx):
        source = fx if visible_pixels(fx) > 90 else raw_fx[min(strong, key=lambda index: abs(index - col))]
        box = alpha_bbox(source)
        canvas = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
        if box:
            sprite = source.crop(box)
            fit_w = 160 + stage * 22
            fit_h = 126 + stage * 18
            scale = min(fit_w / max(1, sprite.width), fit_h / max(1, sprite.height), 7.4)
            w = max(1, round(sprite.width * scale))
            h = max(1, round(sprite.height * scale))
            sprite = sprite.resize((w, h), Image.Resampling.LANCZOS)
            sprite = sprite.filter(ImageFilter.MaxFilter(3))
            sprite = sprite.filter(ImageFilter.UnsharpMask(radius=0.8, percent=90, threshold=2))
            canvas.alpha_composite(sprite, ((FRAME - w) // 2, (FRAME - h) // 2))
        frames.append(harden_alpha(canvas))
    return frames


def build_fx_sheet(config):
    safe_cells = strip_cells(Image.open(config["safe_strip"]).convert("RGBA"))
    raw_fx = [isolate_fx(cell, config["fx"]) for cell in safe_cells]
    sheet = Image.new("RGBA", (FRAME * COLS, FRAME * config["fx_rows"]), (0, 0, 0, 0))
    for row in range(config["fx_rows"]):
        for col, frame in enumerate(normalize_fx_row(raw_fx, row)):
            sheet.alpha_composite(frame, (col * FRAME, row * FRAME))
    sheet.save(config["out_fx"], optimize=True)
    return config["out_fx"]


def build_preview(action_paths):
    preview = Image.new("RGBA", (FRAME * COLS, FRAME * (ROWS * len(action_paths))), (17, 19, 25, 255))
    for index, path in enumerate(action_paths):
        img = Image.open(path).convert("RGBA")
        preview.alpha_composite(img, (0, index * ROWS * FRAME))
    out = SPRITES / "complex_fighter_action_preview_v1.png"
    preview.save(out, optimize=True)
    return out


def main():
    action_paths = []
    generated = []
    for config in FIGHTERS.values():
        for key in ("source", "safe_strip"):
            if not config[key].exists():
                raise SystemExit(f"Missing {config[key]}")
        action_paths.append(build_action_sheet(config))
        generated.append(action_paths[-1])
        generated.append(build_fx_sheet(config))
    generated.append(build_preview(action_paths))
    for path in generated:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
