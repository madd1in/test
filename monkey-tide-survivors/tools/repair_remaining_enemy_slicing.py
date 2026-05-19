from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
ALPHA_THRESHOLD = 18


def green_strength(r, g, b):
    return g - max(r, b)


def remove_edge_matte(image):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        r, g, b, a = pixels[index:index + 4]
        strength = green_strength(r, g, b)
        hard_alpha = a <= 28
        neon_matte = a < 245 and g > 138 and r < 142 and b < 150 and strength > 34
        soft_matte = a < 212 and g > 72 and g > r * 1.12 and g > b * 1.08 and strength > 18
        if hard_alpha or neon_matte:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
            continue
        if soft_matte:
            fade = min(0.82, max(0.25, (strength - 18) / 72))
            pixels[index + 3] = max(0, min(a, int(a * (1 - fade))))
        if pixels[index + 3] > 0 and a < 248 and strength > 12:
            pixels[index + 1] = min(g, int(max(r, b) * 0.9 + 16))
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def alpha_bbox(image, threshold=ALPHA_THRESHOLD):
    return image.getchannel("A").point(lambda a: 255 if a > threshold else 0).getbbox()


def visible_pixels(image, threshold=ALPHA_THRESHOLD):
    return sum(1 for alpha in image.getchannel("A").tobytes() if alpha > threshold)


def frame_edge_alpha(image, threshold=8):
    width, height = image.size
    alpha = image.getchannel("A").load()
    total = 0
    for x in range(width):
        total += alpha[x, 0] > threshold
        total += alpha[x, height - 1] > threshold
    for y in range(height):
        total += alpha[0, y] > threshold
        total += alpha[width - 1, y] > threshold
    return int(total)


def paste_normalized_cell(source, out, row, col, slot_w, slot_h, target_h, max_w, bottom_pad, pad):
    cell = remove_edge_matte(source.crop((
        col * slot_w,
        row * slot_h,
        (col + 1) * slot_w,
        (row + 1) * slot_h,
    )))
    bbox = alpha_bbox(cell)
    if not bbox:
        return {"visible": 0, "bbox": None, "size": (0, 0), "edge": 0}

    sprite = cell.crop(bbox)
    scale = target_h / max(1, sprite.height)
    scale = min(scale, max_w / max(1, sprite.width))
    scale = min(scale, (slot_w - pad * 2) / max(1, sprite.width))
    scale = min(scale, (slot_h - pad * 2) / max(1, sprite.height))
    width = max(1, round(sprite.width * scale))
    height = max(1, round(sprite.height * scale))
    sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
    sprite = remove_edge_matte(sprite)

    x = col * slot_w + (slot_w - width) // 2
    y = row * slot_h + slot_h - height - bottom_pad
    x = max(col * slot_w + pad, min(col * slot_w + slot_w - width - pad, x))
    y = max(row * slot_h + pad, min(row * slot_h + slot_h - height - pad, y))
    out.alpha_composite(sprite, (x, y))
    return {
        "visible": visible_pixels(sprite),
        "bbox": bbox,
        "size": (width, height),
        "edge": frame_edge_alpha(sprite),
    }


def normalize_sheet(source_name, target_name, slot_w, slot_h, cols, rows, row_targets, row_max_widths, row_bottom_pads, pad):
    source = remove_edge_matte(Image.open(SPRITES / source_name))
    out = Image.new("RGBA", (slot_w * cols, slot_h * rows), (0, 0, 0, 0))
    stats = []
    for row in range(rows):
        for col in range(cols):
            stat = paste_normalized_cell(
                source,
                out,
                row,
                col,
                slot_w,
                slot_h,
                row_targets[row],
                row_max_widths[row],
                row_bottom_pads[row],
                pad,
            )
            stats.append((row, col, stat["visible"], stat["size"], stat["edge"]))
    out = remove_edge_matte(out)
    out.save(SPRITES / target_name)
    weak = [item for item in stats if item[2] < max(1500, slot_w * slot_h * 0.02) or item[4] > 0]
    print(f"wrote {target_name} frames={len(stats)} weak={weak[:8]}")


def main():
    normalize_sheet(
        "new_enemy_trio_imagen_hd_sheet_clean.png",
        "new_enemy_trio_imagen_hd_sheet_clean_v2.png",
        slot_w=256,
        slot_h=256,
        cols=8,
        rows=3,
        row_targets=[202, 168, 214],
        row_max_widths=[232, 232, 224],
        row_bottom_pads=[12, 12, 12],
        pad=10,
    )
    normalize_sheet(
        "gothic_enemies_hd_sheet_clean.png",
        "gothic_enemies_hd_sheet_clean_v2.png",
        slot_w=128,
        slot_h=176,
        cols=4,
        rows=8,
        row_targets=[158, 152, 132, 148, 158, 152, 158, 150],
        row_max_widths=[112, 112, 112, 112, 110, 112, 108, 112],
        row_bottom_pads=[8, 8, 12, 8, 8, 8, 8, 8],
        pad=6,
    )
    normalize_sheet(
        "extra_enemies_imagen_hd.webp",
        "extra_enemies_imagen_hd_clean.png",
        slot_w=512,
        slot_h=512,
        cols=4,
        rows=2,
        row_targets=[440, 450],
        row_max_widths=[462, 462],
        row_bottom_pads=[24, 24],
        pad=22,
    )


if __name__ == "__main__":
    main()
