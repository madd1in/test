from pathlib import Path

from PIL import Image


SLOT = 256
ROOT = Path(__file__).resolve().parents[1]


def paste_normalized(source, target, slot_x, slot_y, bbox, target_h, max_w=232, bottom_pad=12):
    sprite = source.crop(bbox)
    scale = target_h / max(1, sprite.height)
    if sprite.width * scale > max_w:
        scale = max_w / max(1, sprite.width)
    nw = max(1, round(sprite.width * scale))
    nh = max(1, round(sprite.height * scale))
    sprite = sprite.resize((nw, nh), Image.Resampling.LANCZOS)
    x = slot_x + (SLOT - nw) // 2
    y = slot_y + SLOT - nh - bottom_pad
    target.alpha_composite(sprite, (x, y))


def alpha_bbox(image, threshold=18):
    return image.getchannel("A").point(lambda a: 255 if a > threshold else 0).getbbox()


def normalize_enemy_trio():
    src = Image.open(ROOT / "assets/sprites/new_enemy_trio_imagen_hd_alpha.png").convert("RGBA")
    out = Image.new("RGBA", (SLOT * 8, SLOT * 3), (0, 0, 0, 0))
    bands = [(0, 245), (245, 500), (500, 850)]
    targets = [210, 168, 214]
    for row, (y0, y1) in enumerate(bands):
        for col in range(8):
            crop = src.crop((col * SLOT, y0, (col + 1) * SLOT, y1))
            bbox = alpha_bbox(crop)
            if bbox:
                paste_normalized(crop, out, col * SLOT, row * SLOT, bbox, targets[row])
    out.save(ROOT / "assets/sprites/new_enemy_trio_imagen_hd_sheet.webp", lossless=True, quality=95, method=6)
    out.save(ROOT / "assets/sprites/new_enemy_trio_imagen_hd_sheet.png")


def normalize_player_walks():
    src = Image.open(ROOT / "assets/sprites/player_skin_walkcycles_imagen_hd.webp").convert("RGBA")
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    row_targets = [218, 206, 216, 222, 218, 222]
    for row, target_h in enumerate(row_targets):
        for col in range(8):
            crop = src.crop((col * SLOT, row * SLOT, (col + 1) * SLOT, (row + 1) * SLOT))
            bbox = alpha_bbox(crop)
            if bbox:
                max_w = 238 if row == 5 else 230
                paste_normalized(crop, out, col * SLOT, row * SLOT, bbox, target_h, max_w=max_w, bottom_pad=14)
    out.save(ROOT / "assets/sprites/player_skin_walkcycles_imagen_hd_clean.webp", lossless=True, quality=95, method=6)
    out.save(ROOT / "assets/sprites/player_skin_walkcycles_imagen_hd_clean.png")


if __name__ == "__main__":
    normalize_enemy_trio()
    normalize_player_walks()
    print("wrote normalized enemy and player walk sheets")
