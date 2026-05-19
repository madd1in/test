from PIL import Image

from repair_enemy_slicing import (
    SPRITES,
    SLOT,
    alpha_bbox,
    rebuild_sheet_by_components,
    visible_pixels,
)


FIGHTER_SOURCE = "fighters_walkcycles_imagen_hd_source.png"
FIGHTER_TARGET = "fighters_walkcycles_imagen_hd_clean_v2.png"
GOTHIC_SOURCE = "gothic_enemy_anim_imagen_hd_source.png"
GOTHIC_BASE = "gothic_enemy_anim_imagen_hd_clean_v3.png"
GOTHIC_TARGET = "gothic_enemy_anim_imagen_hd_clean_v4.png"


def green_screen_key(image):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        r, g, b, alpha = pixels[index:index + 4]
        strength = g - max(r, b)
        hard_key = (
            alpha <= 28
            or (g > 48 and strength > 12 and g > r * 1.10 and g > b * 1.06)
            or (g > 86 and r < 172 and b < 172 and strength > 8)
        )
        soft_key = g > 38 and strength > 7 and g > r * 1.04 and g > b * 1.03
        if hard_key:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
            continue
        if soft_key:
            fade = min(0.9, max(0.25, (strength - 7) / 70))
            pixels[index + 3] = max(0, min(alpha, int(alpha * (1 - fade))))
        if pixels[index + 3] > 0 and strength > 10:
            pixels[index + 1] = min(g, int(max(r, b) * 0.88 + 18))
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def paste_source_rect(source, target, row, col, rect, target_h, max_w, bottom_pad):
    crop = green_screen_key(source.crop(rect))
    bbox = alpha_bbox(crop)
    if not bbox:
        return {"visible": 0, "bbox": None}
    sprite = crop.crop(bbox)
    scale = target_h / max(1, sprite.height)
    if sprite.width * scale > max_w:
        scale = max_w / max(1, sprite.width)
    width = max(1, round(sprite.width * scale))
    height = max(1, round(sprite.height * scale))
    sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
    sprite = green_screen_key(sprite)
    x = col * SLOT + (SLOT - width) // 2
    y = row * SLOT + SLOT - height - bottom_pad
    target.alpha_composite(sprite, (x, y))
    return {"visible": visible_pixels(sprite), "bbox": alpha_bbox(sprite), "size": (width, height)}


def remove_low_alpha(image):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        if pixels[index + 3] <= 28:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def repair_fighters():
    rebuild_sheet_by_components(
        FIGHTER_SOURCE,
        FIGHTER_TARGET,
        cols=8,
        rows=4,
        row_targets=[210, 210, 214, 212],
        row_max_widths=[224, 224, 226, 226],
        row_bottom_pads=[20, 20, 18, 18],
        row_min_body_areas=[4500, 4300, 4600, 4300],
    )


def repair_gothic_gargoyle():
    source = Image.open(SPRITES / GOTHIC_SOURCE)
    target = Image.open(SPRITES / GOTHIC_BASE).convert("RGBA")
    for col in range(8):
        target.paste((0, 0, 0, 0), (col * SLOT, SLOT, (col + 1) * SLOT, SLOT * 2))

    rects = [
        (0, 520, 205, 770),
        (214, 520, 415, 770),
        (425, 515, 635, 770),
        (630, 495, 845, 765),
        (840, 475, 1115, 770),
        (840, 475, 1115, 770),
        (1550, 540, 1765, 780),
        (1550, 540, 1765, 780),
    ]
    stats = [
        paste_source_rect(source, target, 1, col, rect, target_h=218, max_w=248, bottom_pad=14)
        for col, rect in enumerate(rects)
    ]
    target = remove_low_alpha(target)
    target.save(SPRITES / GOTHIC_TARGET)
    weak = [(index, stat) for index, stat in enumerate(stats) if stat["visible"] < 8000]
    print(f"wrote {GOTHIC_TARGET} weak={weak[:4]}")


def main():
    repair_fighters()
    repair_gothic_gargoyle()


if __name__ == "__main__":
    main()
