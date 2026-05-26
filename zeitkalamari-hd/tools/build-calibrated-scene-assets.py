from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
CAL = ROOT / "assets" / "imagen" / "calibrated"
MASTERS = CAL / "masters"
FRAMES = CAL / "frames"
FULLFRAMES = CAL / "fullframes"
OUT_SIZE = (1920, 1080)


@dataclass(frozen=True)
class Crop:
    scene: str
    name: str
    box: tuple[float, float, float, float]
    frames: int
    mode: str = "still"


CROPS = [
    Crop("lab", "lab-portal-calibrated-sheet.png", (0.350, 0.125, 0.690, 0.720), 8, "glow"),
    Crop("lab", "lab-tubes-calibrated-sheet.png", (0.200, 0.155, 0.350, 0.545), 6, "flicker"),
    Crop("lab", "professor-calibrated-sheet.png", (0.245, 0.455, 0.390, 0.900), 6, "still"),
    Crop("lab", "lab-tank-calibrated-sheet.png", (0.760, 0.075, 1.000, 0.895), 8, "water"),
    Crop("kitchen", "chef-calibrated-sheet.png", (0.610, 0.245, 0.795, 0.770), 6, "still"),
    Crop("kitchen", "yeast-calibrated-sheet.png", (0.395, 0.455, 0.535, 0.620), 6, "pulse"),
    Crop("archive", "guard-calibrated-sheet.png", (0.615, 0.250, 0.750, 0.810), 6, "still"),
    Crop("archive", "case-calibrated-sheet.png", (0.355, 0.275, 0.550, 0.785), 6, "flicker"),
]


def normalize_master(scene: str) -> Image.Image:
    source = Image.open(MASTERS / f"{scene}-master.png").convert("RGBA")
    normalized = source.resize(OUT_SIZE, Image.Resampling.LANCZOS)
    normalized.save(MASTERS / f"{scene}-master-1920.png", optimize=True)
    return normalized


def make_frame(base: Image.Image, index: int, frames: int, mode: str) -> Image.Image:
    if mode == "still" or index == 0:
        return base.copy()

    phase = index / max(1, frames - 1)
    mask = Image.new("L", base.size, 0)
    draw = ImageDraw.Draw(mask)
    if mode == "glow":
        draw.ellipse((base.width * 0.16, base.height * 0.12, base.width * 0.88, base.height * 0.88), fill=190)
        mask = mask.filter(ImageFilter.GaussianBlur(round(base.width * 0.05)))
        enhanced = ImageEnhance.Brightness(base).enhance(0.98 + 0.14 * phase).filter(ImageFilter.UnsharpMask(radius=0.6, percent=90))
        return Image.composite(enhanced, base, mask)
    if mode == "flicker":
        amount = [0.98, 1.04, 1.0, 1.07, 0.99, 1.03][index % 6]
        draw.rounded_rectangle((base.width * 0.12, base.height * 0.10, base.width * 0.88, base.height * 0.85), radius=32, fill=160)
        mask = mask.filter(ImageFilter.GaussianBlur(round(base.width * 0.04)))
        enhanced = ImageEnhance.Brightness(base).enhance(amount)
        return Image.composite(enhanced, base, mask)
    if mode == "water":
        draw.rounded_rectangle((base.width * 0.08, base.height * 0.18, base.width * 0.92, base.height * 0.78), radius=48, fill=150)
        mask = mask.filter(ImageFilter.GaussianBlur(round(base.width * 0.035)))
        enhanced = ImageEnhance.Color(ImageEnhance.Brightness(base).enhance(1.0 + 0.045 * phase)).enhance(1.0 + 0.05 * phase)
        return Image.composite(enhanced, base, mask)
    if mode == "pulse":
        draw.ellipse((base.width * 0.12, base.height * 0.18, base.width * 0.92, base.height * 0.76), fill=180)
        mask = mask.filter(ImageFilter.GaussianBlur(round(base.width * 0.035)))
        enhanced = ImageEnhance.Brightness(base).enhance(0.99 + 0.12 * (1 - abs(0.5 - phase) * 2))
        return Image.composite(enhanced, base, mask)
    return base.copy()


def build_crop(master: Image.Image, crop: Crop) -> dict[str, float | int | str]:
    width, height = master.size
    left = round(crop.box[0] * width)
    top = round(crop.box[1] * height)
    right = round(crop.box[2] * width)
    bottom = round(crop.box[3] * height)
    base = master.crop((left, top, right, bottom)).convert("RGBA")
    sheet = Image.new("RGBA", (base.width * crop.frames, base.height), (0, 0, 0, 0))
    full_sheet = Image.new("RGBA", (width * crop.frames, height), (0, 0, 0, 0))

    for index in range(crop.frames):
        frame = make_frame(base, index, crop.frames, crop.mode)
        sheet.alpha_composite(frame, (index * base.width, 0))
        full_frame = Image.new("RGBA", master.size, (0, 0, 0, 0))
        full_frame.alpha_composite(frame, (left, top))
        full_sheet.alpha_composite(full_frame, (index * width, 0))

    FRAMES.mkdir(parents=True, exist_ok=True)
    FULLFRAMES.mkdir(parents=True, exist_ok=True)
    sheet.save(FRAMES / crop.name, optimize=True)
    full_name = crop.name.replace("-calibrated-sheet.png", "-full-sheet.png")
    full_sheet.save(FULLFRAMES / full_name, optimize=True)
    return {
        "src": f"assets/imagen/calibrated/fullframes/{full_name}",
        "x": 0,
        "y": 0,
        "w": 100,
        "h": 100,
        "frames": crop.frames,
    }


def main() -> None:
    masters = {scene: normalize_master(scene) for scene in ("lab", "kitchen", "archive")}
    manifest: dict[str, list[dict[str, float | int | str]]] = {}
    for crop in CROPS:
        manifest.setdefault(crop.scene, []).append(build_crop(masters[crop.scene], crop))
    for scene, layers in manifest.items():
        print(scene)
        for layer in layers:
            print(" ", layer)


if __name__ == "__main__":
    main()
