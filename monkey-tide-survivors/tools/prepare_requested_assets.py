from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SLOT = 256


def green_strength(r, g, b):
    return g - max(r, b)


def remove_green_matte(image):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    removed = 0
    despilled = 0
    for index in range(0, len(pixels), 4):
        r, g, b, a = pixels[index:index + 4]
        strength = green_strength(r, g, b)
        hard_key = g > 136 and r < 150 and b < 154 and strength > 34
        soft_key = g > 92 and g > r * 1.18 and g > b * 1.12 and strength > 24
        if a <= 8 or hard_key:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
            removed += 1
            continue
        if soft_key:
            fade = min(0.82, max(0.25, (strength - 24) / 82))
            pixels[index + 3] = max(0, min(a, int(a * (1 - fade))))
            removed += 1
        if pixels[index + 3] > 0 and strength > 16:
            pixels[index + 1] = min(g, int(max(r, b) * 0.92 + 18))
            despilled += 1
    return Image.frombytes("RGBA", image.size, bytes(pixels)), removed, despilled


def finalize_alpha(image):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        r, g, b, a = pixels[index:index + 4]
        strength = green_strength(r, g, b)
        neon_key = g > 145 and r < 120 and b < 150 and strength > 36
        if a <= 28 or neon_key:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
            continue
        if strength > 14:
            pixels[index + 1] = min(g, int(max(r, b) * 0.9 + 16))
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def alpha_bbox(image, threshold=18):
    return image.getchannel("A").point(lambda a: 255 if a > threshold else 0).getbbox()


def prune_small_components(image, threshold=18):
    image = image.convert("RGBA")
    width, height = image.size
    alpha = image.getchannel("A")
    alpha_bytes = alpha.tobytes()
    visited = bytearray(width * height)
    components = []

    for start in range(width * height):
        if visited[start] or alpha_bytes[start] <= threshold:
            continue
        stack = [start]
        visited[start] = 1
        pixels = []
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0
        while stack:
            current = stack.pop()
            pixels.append(current)
            x = current % width
            y = current // width
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
            if x > 0:
                nxt = current - 1
                if not visited[nxt] and alpha_bytes[nxt] > threshold:
                    visited[nxt] = 1
                    stack.append(nxt)
            if x < width - 1:
                nxt = current + 1
                if not visited[nxt] and alpha_bytes[nxt] > threshold:
                    visited[nxt] = 1
                    stack.append(nxt)
            if y > 0:
                nxt = current - width
                if not visited[nxt] and alpha_bytes[nxt] > threshold:
                    visited[nxt] = 1
                    stack.append(nxt)
            if y < height - 1:
                nxt = current + width
                if not visited[nxt] and alpha_bytes[nxt] > threshold:
                    visited[nxt] = 1
                    stack.append(nxt)
        components.append({
            "pixels": pixels,
            "area": len(pixels),
            "bbox": (min_x, min_y, max_x + 1, max_y + 1),
        })

    if len(components) <= 1:
        return image

    largest = max(component["area"] for component in components)
    center_x0 = width * 0.16
    center_x1 = width * 0.84
    out_pixels = bytearray(image.tobytes())
    for component in components:
        x0, _, x1, _ = component["bbox"]
        central = x1 >= center_x0 and x0 <= center_x1
        keep = component["area"] >= max(64, largest * 0.055) or (central and component["area"] >= 42)
        if keep:
            continue
        for pixel_index in component["pixels"]:
            byte_index = pixel_index * 4
            out_pixels[byte_index:byte_index + 4] = b"\x00\x00\x00\x00"
    return Image.frombytes("RGBA", image.size, bytes(out_pixels))


def cell_box(image, cols, rows, col, row):
    w, h = image.size
    return (
        round(col * w / cols),
        round(row * h / rows),
        round((col + 1) * w / cols),
        round((row + 1) * h / rows),
    )


def paste_normalized(source, target, slot_x, slot_y, target_h, max_w=232, bottom_pad=12):
    source = prune_small_components(source)
    bbox = alpha_bbox(source)
    if not bbox:
        return False
    sprite = source.crop(bbox)
    scale = target_h / max(1, sprite.height)
    if sprite.width * scale > max_w:
        scale = max_w / max(1, sprite.width)
    width = max(1, round(sprite.width * scale))
    height = max(1, round(sprite.height * scale))
    sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
    x = slot_x + (SLOT - width) // 2
    y = slot_y + SLOT - height - bottom_pad
    target.alpha_composite(sprite, (x, y))
    return True


def normalize_grid(source_name, target_name, cols, rows, row_targets, row_max_widths=None, row_bottom_pads=None):
    source, removed, despilled = remove_green_matte(Image.open(SPRITES / source_name))
    out = Image.new("RGBA", (cols * SLOT, rows * SLOT), (0, 0, 0, 0))
    kept = 0
    row_max_widths = row_max_widths or [232] * rows
    row_bottom_pads = row_bottom_pads or [12] * rows
    for row in range(rows):
        for col in range(cols):
            crop = source.crop(cell_box(source, cols, rows, col, row))
            if paste_normalized(
                crop,
                out,
                col * SLOT,
                row * SLOT,
                row_targets[row],
                max_w=row_max_widths[row],
                bottom_pad=row_bottom_pads[row],
            ):
                kept += 1
    out = finalize_alpha(out)
    out.save(SPRITES / target_name)
    print(f"wrote {target_name} kept={kept} removed={removed} despilled={despilled}")
    return out


def build_select_sheet(walk_sheet, target_name, rows):
    out = Image.new("RGBA", (rows * SLOT, SLOT), (0, 0, 0, 0))
    for row in range(rows):
        frame = walk_sheet.crop((0, row * SLOT, SLOT, (row + 1) * SLOT))
        out.alpha_composite(frame, (row * SLOT, 0))
    out = finalize_alpha(out)
    out.save(SPRITES / target_name)
    print(f"wrote {target_name}")


def clean_existing_enemy_anim():
    clean, removed, despilled = remove_green_matte(Image.open(SPRITES / "enemy_anim_imagen_hd_sheet.webp"))
    clean = finalize_alpha(clean)
    clean.save(SPRITES / "enemy_anim_imagen_hd_sheet_clean_v2.png")
    print(f"wrote enemy_anim_imagen_hd_sheet_clean_v2.png removed={removed} despilled={despilled}")


def main():
    fighters = normalize_grid(
        "fighters_walkcycles_imagen_hd_source.png",
        "fighters_walkcycles_imagen_hd_clean.png",
        cols=8,
        rows=4,
        row_targets=[224, 224, 232, 222],
        row_max_widths=[222, 222, 232, 226],
        row_bottom_pads=[14, 14, 12, 14],
    )
    build_select_sheet(fighters, "fighters_select_imagen_hd.png", 4)
    normalize_grid(
        "gothic_enemy_anim_imagen_hd_source.png",
        "gothic_enemy_anim_imagen_hd_clean.png",
        cols=8,
        rows=2,
        row_targets=[216, 224],
        row_max_widths=[234, 246],
        row_bottom_pads=[16, 10],
    )
    clean_existing_enemy_anim()


if __name__ == "__main__":
    main()
