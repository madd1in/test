from colorsys import hsv_to_rgb, rgb_to_hsv
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SOURCE = SPRITES / "xp_crystal_anim_imagen_hd.png"
TARGETS = {
    "green": (0.36, 1.18, 1.06),
    "red": (0.985, 1.28, 1.08),
}


def clamp(value, low=0.0, high=1.0):
    return max(low, min(high, value))


def tint_crystals(image, hue, saturation_boost, value_boost):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        r, g, b, alpha = pixels[index:index + 4]
        if alpha <= 8:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
            continue
        src_r = r / 255
        src_g = g / 255
        src_b = b / 255
        _, saturation, value = rgb_to_hsv(src_r, src_g, src_b)
        if saturation < 0.12 and value > 0.72:
            target_r, target_g, target_b = hsv_to_rgb(hue, 0.32, clamp(value * 1.03))
            mix = 0.34
            out_r = src_r * (1 - mix) + target_r * mix
            out_g = src_g * (1 - mix) + target_g * mix
            out_b = src_b * (1 - mix) + target_b * mix
        else:
            new_saturation = clamp(max(saturation, 0.42) * saturation_boost)
            new_value = clamp(value * value_boost)
            out_r, out_g, out_b = hsv_to_rgb(hue, new_saturation, new_value)
        pixels[index] = round(out_r * 255)
        pixels[index + 1] = round(out_g * 255)
        pixels[index + 2] = round(out_b * 255)
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def main():
    source = Image.open(SOURCE)
    for name, target in TARGETS.items():
        out = tint_crystals(source, *target)
        path = SPRITES / f"xp_crystal_{name}_anim_imagen_hd.png"
        out.save(path, optimize=True)
        print(f"wrote {path.name} {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main()
