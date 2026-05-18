from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SOURCE = SPRITES / "xp_crystal_anim_imagen_source.png"
OUT = SPRITES / "xp_crystal_anim_imagen_hd.png"
SLOT = 256
FRAMES = 8


def remove_chroma(image):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        r, g, b, a = pixels[index:index + 4]
        green_key = g > 150 and r < 95 and b < 145 and g - max(r, b) > 45
        if green_key:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
        elif a == 0:
            pixels[index:index + 3] = b"\x00\x00\x00"
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def alpha_bbox(image, threshold=18):
    return image.getchannel("A").point(lambda a: 255 if a > threshold else 0).getbbox()


def normalize_sheet():
    src = remove_chroma(Image.open(SOURCE))
    out = Image.new("RGBA", (SLOT * FRAMES, SLOT), (0, 0, 0, 0))
    raw_slot_w = src.width / FRAMES
    for frame in range(FRAMES):
        left = round(frame * raw_slot_w)
        right = round((frame + 1) * raw_slot_w)
        crop = src.crop((left, 0, right, src.height))
        bbox = alpha_bbox(crop)
        if not bbox:
            continue
        sprite = crop.crop(bbox)
        max_w = 214
        target_h = 224
        scale = min(target_h / max(1, sprite.height), max_w / max(1, sprite.width))
        size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
        sprite = sprite.resize(size, Image.Resampling.LANCZOS)
        x = frame * SLOT + (SLOT - sprite.width) // 2
        y = SLOT - sprite.height - 16
        out.alpha_composite(sprite, (x, y))
    out.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)} {out.width}x{out.height}")


if __name__ == "__main__":
    normalize_sheet()
