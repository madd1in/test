from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "raw"
GEN = ROOT / "assets" / "generated"

PLAYER_RAW = RAW / "player_sheet_imagegen_v4_raw.png"
WHIP_RAW = RAW / "whip_sheet_imagegen_v4_raw.png"

PLAYER_FRAME_W = 128
PLAYER_FRAME_H = 184
PLAYER_FRAMES = 24
WHIP_FRAME_W = 192
WHIP_FRAME_H = 72
WHIP_FRAMES = 8


def keyed_crop(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    crop = img.crop(box).convert("RGBA")
    px = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = px[x, y]
            green = g > 70 and g - r > 20 and g - b > 20 and g > max(r, b) * 1.12
            white_grid = r > 230 and g > 230 and b > 230
            if green or white_grid:
                px[x, y] = (0, 0, 0, 0)
    return crop


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").getbbox()


def bright_line_positions(img: Image.Image, axis: str, expected_cells: int) -> list[int]:
    rgba = img.convert("RGBA")
    px = rgba.load()
    length = rgba.width if axis == "x" else rgba.height
    span = rgba.height if axis == "x" else rgba.width
    threshold = int(span * 0.18)
    hits: list[int] = []
    for i in range(length):
        count = 0
        for j in range(span):
            x, y = (i, j) if axis == "x" else (j, i)
            r, g, b, a = px[x, y]
            if a and r > 230 and g > 230 and b > 230:
                count += 1
        if count >= threshold:
            hits.append(i)

    runs: list[tuple[int, int]] = []
    if hits:
        start = last = hits[0]
        for pos in hits[1:]:
            if pos <= last + 2:
                last = pos
            else:
                runs.append((start, last))
                start = last = pos
        runs.append((start, last))

    centers = [round((a + b) / 2) for a, b in runs]
    lines = [0]
    for center in centers:
        if 4 < center < length - 4 and center - lines[-1] > 24:
            lines.append(center)
    if length - lines[-1] > 24:
        lines.append(length)
    if len(lines) != expected_cells + 1:
        return [round(i * length / expected_cells) for i in range(expected_cells + 1)]
    return lines


def scrub_frame_ground_artifacts(img: Image.Image, frame_w: int, frame_h: int) -> None:
    px = img.load()
    frames = img.width // frame_w
    for frame in range(frames):
        x0 = frame * frame_w
        for y in range(frame_h - 14, frame_h):
            for x in range(x0, x0 + frame_w):
                r, g, b, a = px[x, y]
                if not a:
                    continue
                bright = r + g + b > 420
                greenish = g > 70 and g - r > 12 and g - b > 12
                if bright or greenish:
                    px[x, y] = (0, 0, 0, 0)


def paste_normalized(
    dst: Image.Image,
    src: Image.Image,
    dst_frame: int,
    target_w: int,
    target_h: int,
    pad_bottom: int = 7,
    x_bias: int = 0,
) -> None:
    box = alpha_bbox(src)
    if not box:
        return
    sprite = src.crop(box)
    scale = min(target_w / sprite.width, target_h / sprite.height)
    size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    sprite = sprite.resize(size, Image.Resampling.NEAREST)
    x = dst_frame * PLAYER_FRAME_W + round((PLAYER_FRAME_W - size[0]) / 2) + x_bias
    y = PLAYER_FRAME_H - pad_bottom - size[1]
    dst.alpha_composite(sprite, (x, y))


def player_cell(raw: Image.Image, row: int, col: int, x_lines: list[int], y_lines: list[int]) -> Image.Image:
    x0 = x_lines[col] + 8
    x1 = x_lines[col + 1] - 8
    y0 = y_lines[row] + 8
    y1 = y_lines[row + 1] - 8
    return keyed_crop(raw, (x0, y0, x1, y1))


def build_player_sheet() -> None:
    raw = Image.open(PLAYER_RAW).convert("RGBA")
    x_lines = bright_line_positions(raw, "x", 8)
    y_lines = bright_line_positions(raw, "y", 3)
    out = Image.new("RGBA", (PLAYER_FRAMES * PLAYER_FRAME_W, PLAYER_FRAME_H), (0, 0, 0, 0))

    paste_normalized(out, player_cell(raw, 0, 0, x_lines, y_lines), 0, 108, 166)
    for frame, col in enumerate(range(1, 8), start=1):
        paste_normalized(out, player_cell(raw, 0, col, x_lines, y_lines), frame, 108, 166)
    paste_normalized(out, player_cell(raw, 0, 7, x_lines, y_lines), 8, 108, 166)
    paste_normalized(out, player_cell(raw, 1, 0, x_lines, y_lines), 9, 112, 160)
    paste_normalized(out, player_cell(raw, 1, 1, x_lines, y_lines), 10, 112, 166)
    paste_normalized(out, player_cell(raw, 1, 2, x_lines, y_lines), 11, 112, 166)
    for dst_frame, col in zip(range(12, 18), [3, 4, 5, 6, 5, 4]):
        paste_normalized(out, player_cell(raw, 1, col, x_lines, y_lines), dst_frame, 120, 166)
    paste_normalized(out, player_cell(raw, 2, 0, x_lines, y_lines), 18, 114, 128)
    for dst_frame, col in zip(range(19, 23), [1, 2, 3, 4]):
        paste_normalized(out, player_cell(raw, 2, col, x_lines, y_lines), dst_frame, 114, 128)
    paste_normalized(out, player_cell(raw, 2, 6, x_lines, y_lines), 23, 120, 128)

    scrub_frame_ground_artifacts(out, PLAYER_FRAME_W, PLAYER_FRAME_H)
    out.save(GEN / "player_sheet_anim.png")


def whip_cell(raw: Image.Image, col: int) -> Image.Image:
    sw, sh = raw.size
    x0 = round(col * sw / WHIP_FRAMES) + 6
    x1 = round((col + 1) * sw / WHIP_FRAMES) - 6
    y0 = round(sh * 0.30)
    y1 = round(sh * 0.74)
    return keyed_crop(raw, (x0, y0, x1, y1))


def paste_whip_normalized(dst: Image.Image, src: Image.Image, dst_frame: int) -> None:
    box = alpha_bbox(src)
    if not box:
        return
    sprite = src.crop(box)
    scale = min(182 / sprite.width, 62 / sprite.height)
    size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    sprite = sprite.resize(size, Image.Resampling.NEAREST)
    x = dst_frame * WHIP_FRAME_W + 6
    y = round((WHIP_FRAME_H - size[1]) / 2)
    dst.alpha_composite(sprite, (x, y))


def build_whip_sheet() -> None:
    raw = Image.open(WHIP_RAW).convert("RGBA")
    out = Image.new("RGBA", (WHIP_FRAMES * WHIP_FRAME_W, WHIP_FRAME_H), (0, 0, 0, 0))
    for col in range(WHIP_FRAMES):
        paste_whip_normalized(out, whip_cell(raw, col), col)
    scrub_frame_ground_artifacts(out, WHIP_FRAME_W, WHIP_FRAME_H)
    out.save(GEN / "whip_sheet.png")


def main() -> None:
    build_player_sheet()
    build_whip_sheet()
    print("sliced player_sheet_anim.png as 24x128x184 and whip_sheet.png as 8x192x72")


if __name__ == "__main__":
    main()
