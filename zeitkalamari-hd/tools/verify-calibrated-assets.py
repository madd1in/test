from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
CAL = ROOT / "assets" / "imagen" / "calibrated"

CHECKS = {
    "lab": [
        ("lab-portal-calibrated-sheet.png", (0.350, 0.125, 0.690, 0.720), 8),
        ("lab-tubes-calibrated-sheet.png", (0.200, 0.155, 0.350, 0.545), 6),
        ("professor-calibrated-sheet.png", (0.245, 0.455, 0.390, 0.900), 6),
        ("lab-tank-calibrated-sheet.png", (0.760, 0.075, 1.000, 0.895), 8),
    ],
    "kitchen": [
        ("chef-calibrated-sheet.png", (0.610, 0.245, 0.795, 0.770), 6),
        ("yeast-calibrated-sheet.png", (0.395, 0.455, 0.535, 0.620), 6),
    ],
    "archive": [
        ("guard-calibrated-sheet.png", (0.615, 0.250, 0.750, 0.810), 6),
        ("case-calibrated-sheet.png", (0.355, 0.275, 0.550, 0.785), 6),
    ],
}


def main() -> None:
    for scene, layers in CHECKS.items():
        master = Image.open(CAL / "masters" / f"{scene}-master-1920.png").convert("RGBA")
        width, height = master.size
        for name, box, frames in layers:
            left = round(box[0] * width)
            top = round(box[1] * height)
            right = round(box[2] * width)
            bottom = round(box[3] * height)
            master_crop = master.crop((left, top, right, bottom))
            sheet = Image.open(CAL / "frames" / name).convert("RGBA")
            first_frame = sheet.crop((0, 0, sheet.width // frames, sheet.height))
            diff = ImageChops.difference(master_crop, first_frame).getbbox()
            if diff is not None:
                raise RuntimeError(f"{scene}/{name} first frame does not match master crop: {diff}")

            full_name = name.replace("-calibrated-sheet.png", "-full-sheet.png")
            full_sheet = Image.open(CAL / "fullframes" / full_name).convert("RGBA")
            if full_sheet.size != (width * frames, height):
                raise RuntimeError(f"{scene}/{full_name} wrong full sheet size: {full_sheet.size}")

            first_full = full_sheet.crop((0, 0, width, height))
            composed = master.copy()
            composed.alpha_composite(first_full)
            full_diff = ImageChops.difference(master, composed).getbbox()
            if full_diff is not None:
                raise RuntimeError(f"{scene}/{full_name} first full frame does not composite exactly: {full_diff}")

            for frame_index in range(frames):
                full_frame = full_sheet.crop((frame_index * width, 0, (frame_index + 1) * width, height))
                alpha = full_frame.getchannel("A")
                bbox = alpha.getbbox()
                if bbox != (left, top, right, bottom):
                    raise RuntimeError(f"{scene}/{full_name} frame {frame_index + 1} alpha bbox drifted: {bbox}")

                frame_crop = full_frame.crop((left, top, right, bottom))
                master_edge = master_crop.copy()
                frame_edge = frame_crop.copy()
                inner = (2, 2, frame_crop.width - 2, frame_crop.height - 2)
                if inner[2] > inner[0] and inner[3] > inner[1]:
                    master_edge.paste((0, 0, 0, 0), inner)
                    frame_edge.paste((0, 0, 0, 0), inner)
                edge_diff = ImageChops.difference(master_edge, frame_edge).getbbox()
                if edge_diff is not None:
                    raise RuntimeError(f"{scene}/{full_name} frame {frame_index + 1} changed crop edge pixels: {edge_diff}")
            print(f"{scene}/{name}: crop and full-canvas overlay pixel exact")


if __name__ == "__main__":
    main()
