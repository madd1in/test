"""Create smoother runtime boss sheets from the existing Imagen HD strips.

The source art is already HD, but the game can look choppy when large
silhouettes only advance every original frame. This keeps the source art
intact and inserts a lightweight in-between frame after every source frame.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "assets" / "generated"


def polish(frame: Image.Image) -> Image.Image:
    frame = ImageEnhance.Contrast(frame.convert("RGBA")).enhance(1.02)
    frame = ImageEnhance.Color(frame).enhance(1.02)
    return frame.filter(ImageFilter.UnsharpMask(radius=0.45, percent=34, threshold=4))


def tween(a: Image.Image, b: Image.Image, drift_px: int) -> Image.Image:
    """Blend toward the next frame and add a tiny directional drift."""
    mid = Image.blend(a.convert("RGBA"), b.convert("RGBA"), 0.42)
    canvas = Image.new("RGBA", a.size, (0, 0, 0, 0))
    canvas.alpha_composite(mid, (drift_px, 0))
    return polish(canvas)


def smooth_strip(source: Path, out: Path, frame_w: int, frame_h: int, frames: int, rows: int) -> None:
    src = Image.open(source).convert("RGBA")
    sheet = Image.new("RGBA", (frame_w * frames * 2, frame_h * rows), (0, 0, 0, 0))

    for row in range(rows):
        row_frames = [
            polish(src.crop((col * frame_w, row * frame_h, (col + 1) * frame_w, (row + 1) * frame_h)))
            for col in range(frames)
        ]
        for col, frame in enumerate(row_frames):
            next_frame = row_frames[(col + 1) % frames]
            sheet.alpha_composite(frame, ((col * 2) * frame_w, row * frame_h))
            drift = 1 if col % 2 == 0 else -1
            sheet.alpha_composite(tween(frame, next_frame, drift), ((col * 2 + 1) * frame_w, row * frame_h))

    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, optimize=True)
    print(f"Wrote {out.relative_to(ROOT)} ({frame_w}x{frame_h}, {frames * 2} frames x {rows} rows)")


def main() -> None:
    smooth_strip(
        GEN / "boss_sheet_hd_16.png",
        GEN / "boss_sheet_hd_32_smooth.png",
        frame_w=320,
        frame_h=256,
        frames=16,
        rows=1,
    )
    smooth_strip(
        GEN / "enemy_imagen_quest_minibosses_sheet.png",
        GEN / "enemy_imagen_quest_minibosses_sheet_48.png",
        frame_w=320,
        frame_h=256,
        frames=24,
        rows=3,
    )


if __name__ == "__main__":
    main()
