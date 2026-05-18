from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"


def should_drop_matte(r, g, b, a):
    if a <= 28:
        return True
    green_matte = a <= 180 and g > 90 and g > r * 1.24 and g > b * 1.24
    neon_key = g > 150 and r < 110 and b < 145 and g - max(r, b) > 45
    return green_matte or neon_key


def clean_sprite_sheet(source_name, target_name):
    image = Image.open(SPRITES / source_name).convert("RGBA")
    pixels = bytearray(image.tobytes())
    removed = 0
    for index in range(0, len(pixels), 4):
        r, g, b, a = pixels[index:index + 4]
        if should_drop_matte(r, g, b, a):
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
            removed += 1
        elif a == 0:
            pixels[index:index + 3] = b"\x00\x00\x00"
    clean = Image.frombytes("RGBA", image.size, bytes(pixels))
    clean.save(SPRITES / target_name)
    return target_name, image.size, removed


def main():
    targets = [
        ("enemy_anim_imagen_hd_sheet.webp", "enemy_anim_imagen_hd_sheet_clean.png"),
        ("new_enemy_trio_imagen_hd_sheet.webp", "new_enemy_trio_imagen_hd_sheet_clean.png"),
        ("gothic_enemies_hd_sheet.webp", "gothic_enemies_hd_sheet_clean.png"),
    ]
    for source, target in targets:
        name, size, removed = clean_sprite_sheet(source, target)
        print(f"wrote {name} {size[0]}x{size[1]} removed={removed}")


if __name__ == "__main__":
    main()
