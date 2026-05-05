from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "raw"
GEN = ROOT / "assets" / "generated"

PLAYER_RAW = RAW / "ref_player_frames_20260505.png"
ENEMY_RAW = RAW / "ref_enemy_frames_20260505.png"
BOSS_RAW = RAW / "ref_boss_frames_20260505.png"
TILE_RAW = RAW / "ref_tile_map_20260505.png"

PLAYER_FRAME_W = 128
PLAYER_FRAME_H = 184
PLAYER_FRAMES = 24
WHIP_FRAME_W = 192
WHIP_FRAME_H = 72
WHIP_FRAMES = 8
ENEMY_FRAME_W = 128
ENEMY_FRAME_H = 176
BOSS_FRAME_W = 300
BOSS_FRAME_H = 240
VIEW_W = 960
ROOM_H = 720


def key_black(img: Image.Image, floor: int = 18) -> Image.Image:
    crop = img.convert("RGBA")
    px = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if max(r, g, b) <= floor or (r < 26 and g < 24 and b < 24):
                px[x, y] = (0, 0, 0, 0)
    return crop


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").getbbox()


def remove_small_components(img: Image.Image, keep: int = 5, min_area: int = 24, allow_flat: bool = False) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    seen: set[tuple[int, int]] = set()
    comps: list[list[tuple[int, int]]] = []
    for y in range(rgba.height):
        for x in range(rgba.width):
            if (x, y) in seen or px[x, y][3] == 0:
                continue
            stack = [(x, y)]
            seen.add((x, y))
            comp: list[tuple[int, int]] = []
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= rgba.width or ny >= rgba.height or (nx, ny) in seen:
                        continue
                    if px[nx, ny][3] == 0:
                        continue
                    seen.add((nx, ny))
                    stack.append((nx, ny))
            comps.append(comp)

    candidates: list[list[tuple[int, int]]] = []
    for comp in comps:
        if len(comp) < min_area:
            continue
        xs = [pt[0] for pt in comp]
        ys = [pt[1] for pt in comp]
        comp_w = max(xs) - min(xs) + 1
        comp_h = max(ys) - min(ys) + 1
        if not allow_flat and comp_h < 24 and comp_w > 8:
            continue
        if not allow_flat and comp_h <= 5 and comp_w > 18:
            continue
        if comp_w <= 5 and comp_h > 18:
            continue
        if min(ys) < 8 and len(comp) < 160:
            continue
        candidates.append(comp)

    keepers = sorted(candidates, key=len, reverse=True)[:keep]
    keep_set = {pt for comp in keepers for pt in comp}
    for y in range(rgba.height):
        for x in range(rgba.width):
            if px[x, y][3] and (x, y) not in keep_set:
                px[x, y] = (0, 0, 0, 0)
    return rgba


def crop_center(
    img: Image.Image,
    cx: int,
    cy: int,
    w: int,
    h: int,
    floor: int = 18,
    keep: int = 5,
    min_area: int = 24,
    allow_flat: bool = False,
) -> Image.Image:
    crop = key_black(img.crop((cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2)), floor)
    return remove_small_components(crop, keep=keep, min_area=min_area, allow_flat=allow_flat)


def spread(start: int, end: int, count: int) -> list[int]:
    if count == 1:
        return [start]
    return [round(start + (end - start) * i / (count - 1)) for i in range(count)]


def paste_normalized(
    dst: Image.Image,
    src: Image.Image,
    frame: int,
    frame_w: int,
    frame_h: int,
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
    x = frame * frame_w + round((frame_w - size[0]) / 2) + x_bias
    y = frame_h - pad_bottom - size[1]
    dst.alpha_composite(sprite, (x, y))


def build_player_sheet() -> None:
    raw = Image.open(PLAYER_RAW).convert("RGBA")
    out = Image.new("RGBA", (PLAYER_FRAMES * PLAYER_FRAME_W, PLAYER_FRAME_H), (0, 0, 0, 0))

    specs: list[tuple[int, int, int, int, int, int]] = []
    specs.append((0, 62, 148, 58, 86, 106))
    specs += [(i, x, 148, 62, 88, 108) for i, x in enumerate(spread(470, 900, 8), start=1)]
    specs.append((9, 75, 248, 78, 84, 116))
    specs.append((10, 575, 248, 78, 84, 116))
    specs.append((11, 78, 910, 76, 92, 112))
    for frame, x in enumerate(spread(72, 560, 6), start=12):
        specs.append((frame, x, 464, 104, 84, 122))
    specs.append((18, 75, 355, 70, 76, 116))
    for frame, x in enumerate(spread(760, 1160, 4), start=19):
        specs.append((frame, x, 355, 78, 78, 116))
    specs.append((23, 735, 1000, 112, 84, 118))

    for frame, cx, cy, cw, ch, target_w in specs:
        target_h = 156 if frame != 18 and frame < 23 else 124
        paste_normalized(out, crop_center(raw, cx, cy, cw, ch, keep=4, min_area=48), frame, PLAYER_FRAME_W, PLAYER_FRAME_H, target_w, target_h)

    out.save(GEN / "player_sheet_anim.png")


def build_whip_sheet() -> None:
    raw = Image.open(PLAYER_RAW).convert("RGBA")
    out = Image.new("RGBA", (WHIP_FRAMES * WHIP_FRAME_W, WHIP_FRAME_H), (0, 0, 0, 0))
    for frame, x in enumerate(spread(48, 610, WHIP_FRAMES)):
        src = crop_center(raw, x, 470, 150, 70, 10, keep=8, min_area=10, allow_flat=True)
        paste_normalized(out, src, frame, WHIP_FRAME_W, WHIP_FRAME_H, 182, 64, pad_bottom=4)
    out.save(GEN / "whip_sheet.png")


def build_enemy_sheet() -> None:
    raw = Image.open(ENEMY_RAW).convert("RGBA")
    out = Image.new("RGBA", (4 * ENEMY_FRAME_W, 10 * ENEMY_FRAME_H), (0, 0, 0, 0))
    rows = [
        (spread(48, 190, 4), 155, 78, 112, 92, 130),   # zombie row in game uses skeleton art
        (spread(760, 945, 4), 155, 84, 118, 92, 130),  # skeleton row in game uses zombie art
        (spread(50, 260, 4), 285, 92, 80, 96, 88),
        (spread(760, 965, 4), 285, 94, 92, 96, 100),
        (spread(765, 930, 4), 565, 82, 130, 78, 138),
        (spread(50, 235, 4), 415, 86, 124, 92, 132),
        (spread(55, 245, 4), 545, 88, 126, 88, 132),
        (spread(50, 295, 4), 970, 112, 116, 108, 120),
        (spread(765, 955, 4), 835, 92, 132, 98, 136),
        (spread(760, 965, 4), 970, 96, 78, 98, 88),
    ]
    for row, (xs, cy, cw, ch, target_w, target_h) in enumerate(rows):
        row_img = Image.new("RGBA", (4 * ENEMY_FRAME_W, ENEMY_FRAME_H), (0, 0, 0, 0))
        for col, cx in enumerate(xs):
            src = crop_center(raw, cx, cy, cw, ch, keep=3, min_area=70)
            paste_normalized(row_img, src, col, ENEMY_FRAME_W, ENEMY_FRAME_H, target_w, target_h)
        out.alpha_composite(row_img, (0, row * ENEMY_FRAME_H))
    out.save(GEN / "enemy_sheet_clean.png")


def build_boss_sheet() -> None:
    raw = Image.open(BOSS_RAW).convert("RGBA")
    out = Image.new("RGBA", (3 * BOSS_FRAME_W, BOSS_FRAME_H), (0, 0, 0, 0))
    for frame, cx in enumerate([72, 165, 270]):
        src = crop_center(raw, cx, 872, 178, 238, 12)
        paste_normalized(out, src, frame, BOSS_FRAME_W, BOSS_FRAME_H, 230, 220, pad_bottom=8)
    out.save(GEN / "boss_sheet_anim.png")


def backdrop(src: Image.Image, box: tuple[int, int, int, int], name: str) -> None:
    crop = src.crop(box).convert("RGB")
    fitted = ImageOps.fit(crop, (VIEW_W, ROOM_H), method=Image.Resampling.NEAREST, centering=(0.5, 0.5))
    fitted.save(GEN / name)


def build_backdrops() -> None:
    raw = Image.open(TILE_RAW).convert("RGBA")
    backdrop(raw, (26, 714, 392, 986), "bg_ref_hall.png")
    backdrop(raw, (402, 714, 721, 986), "bg_ref_stairs.png")
    backdrop(raw, (733, 714, 1035, 986), "bg_ref_dungeon.png")
    backdrop(raw, (1050, 714, 1417, 986), "bg_ref_cathedral.png")


def main() -> None:
    GEN.mkdir(parents=True, exist_ok=True)
    build_player_sheet()
    build_whip_sheet()
    build_enemy_sheet()
    build_boss_sheet()
    build_backdrops()
    print("sliced 2026 reference PNGs into player, whip, enemy, boss, and room backdrops")


if __name__ == "__main__":
    main()
