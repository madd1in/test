from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites"
SLOT = 256
ALPHA_THRESHOLD = 18


def green_strength(r, g, b):
    return g - max(r, b)


def remove_green_matte(image):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        r, g, b, a = pixels[index:index + 4]
        strength = green_strength(r, g, b)
        hard_key = g > 126 and r < 158 and b < 160 and strength > 28
        soft_key = g > 82 and g > r * 1.14 and g > b * 1.08 and strength > 18
        scanline_key = g > 110 and strength > 18 and a <= 244
        if a <= 10 or hard_key or scanline_key:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
            continue
        if soft_key:
            fade = min(0.88, max(0.32, (strength - 18) / 76))
            pixels[index + 3] = max(0, min(a, int(a * (1 - fade))))
        if pixels[index + 3] > 0 and strength > 10:
            pixels[index + 1] = min(g, int(max(r, b) * 0.88 + 18))
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def finalize_alpha(image):
    image = image.convert("RGBA")
    pixels = bytearray(image.tobytes())
    for index in range(0, len(pixels), 4):
        r, g, b, a = pixels[index:index + 4]
        strength = green_strength(r, g, b)
        neon_key = g > 140 and r < 130 and b < 150 and strength > 30
        weak_green = a <= 190 and g > 82 and g > r * 1.16 and g > b * 1.1 and strength > 18
        if a <= 28 or neon_key or weak_green:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
            continue
        if strength > 10:
            pixels[index + 1] = min(g, int(max(r, b) * 0.9 + 14))
    return Image.frombytes("RGBA", image.size, bytes(pixels))


def alpha_bbox(image, threshold=ALPHA_THRESHOLD):
    return image.getchannel("A").point(lambda a: 255 if a > threshold else 0).getbbox()


def crop_with_padding(image, box):
    x0, y0, x1, y1 = box
    width = max(1, x1 - x0)
    height = max(1, y1 - y0)
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    source_box = (
        max(0, x0),
        max(0, y0),
        min(image.width, x1),
        min(image.height, y1),
    )
    if source_box[0] >= source_box[2] or source_box[1] >= source_box[3]:
        return out
    paste_at = (source_box[0] - x0, source_box[1] - y0)
    out.alpha_composite(image.crop(source_box), paste_at)
    return out


def components(image, threshold=ALPHA_THRESHOLD):
    width, height = image.size
    alpha = image.getchannel("A").tobytes()
    visited = bytearray(width * height)
    found = []
    for start in range(width * height):
        if visited[start] or alpha[start] <= threshold:
            continue
        queue = deque([start])
        visited[start] = 1
        pixels = []
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0
        while queue:
            current = queue.pop()
            pixels.append(current)
            x = current % width
            y = current // width
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
            for nxt in (current - 1, current + 1, current - width, current + width):
                if nxt < 0 or nxt >= width * height or visited[nxt] or alpha[nxt] <= threshold:
                    continue
                if (nxt == current - 1 and x == 0) or (nxt == current + 1 and x == width - 1):
                    continue
                visited[nxt] = 1
                queue.append(nxt)
        area = len(pixels)
        if area < 18:
            continue
        found.append({
            "pixels": pixels,
            "area": area,
            "bbox": (min_x, min_y, max_x + 1, max_y + 1),
            "center": ((min_x + max_x + 1) / 2, (min_y + max_y + 1) / 2),
        })
    return found


def expanded(box, amount, limit_w, limit_h):
    return (
        max(0, box[0] - amount),
        max(0, box[1] - amount),
        min(limit_w, box[2] + amount),
        min(limit_h, box[3] + amount),
    )


def boxes_intersect(a, b):
    return a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1]


def select_frame_components(crop, target_center, slot_w, slot_h):
    items = components(crop)
    if not items:
        return crop
    cx, cy = target_center
    frame_rect = (
        cx - slot_w / 2,
        cy - slot_h / 2,
        cx + slot_w / 2,
        cy + slot_h / 2,
    )

    def score(item):
        ix, iy = item["center"]
        distance = ((ix - cx) ** 2 + (iy - cy) ** 2) ** 0.5
        return item["area"] / (1 + distance * 0.045)

    best = max(items, key=score)
    best_box = expanded(best["bbox"], 46, crop.width, crop.height)
    keep = []
    for item in items:
        ix, iy = item["center"]
        distance = ((ix - cx) ** 2 + (iy - cy) ** 2) ** 0.5
        near_target = distance <= max(slot_w * 0.72, slot_h * 0.7)
        overlaps_body = boxes_intersect(item["bbox"], best_box)
        overlaps_frame = boxes_intersect(item["bbox"], frame_rect)
        big_piece = item["area"] >= best["area"] * 0.08
        if item is best or overlaps_body or (near_target and (overlaps_frame or big_piece)):
            keep.append(item)

    pixels = bytearray(crop.tobytes())
    mask = bytearray(crop.width * crop.height)
    for item in keep:
        for pixel in item["pixels"]:
            mask[pixel] = 1
    for pixel_index, allowed in enumerate(mask):
        if allowed:
            continue
        byte_index = pixel_index * 4
        pixels[byte_index:byte_index + 4] = b"\x00\x00\x00\x00"
    return Image.frombytes("RGBA", crop.size, bytes(pixels))


def paste_normalized(source, target, slot_x, slot_y, target_h, max_w, bottom_pad):
    source = finalize_alpha(source)
    bbox = alpha_bbox(source)
    if not bbox:
        return {"visible": 0, "bbox": None}
    sprite = source.crop(bbox)
    scale = target_h / max(1, sprite.height)
    if sprite.width * scale > max_w:
        scale = max_w / max(1, sprite.width)
    width = max(1, round(sprite.width * scale))
    height = max(1, round(sprite.height * scale))
    sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
    sprite = finalize_alpha(sprite)
    x = slot_x + (SLOT - width) // 2
    y = slot_y + SLOT - height - bottom_pad
    target.alpha_composite(sprite, (x, y))
    return {"visible": visible_pixels(sprite), "bbox": bbox}


def visible_pixels(image):
    return sum(1 for alpha in image.getchannel("A").tobytes() if alpha > ALPHA_THRESHOLD)


def component_group_image(source, group):
    x0 = min(item["bbox"][0] for item in group)
    y0 = min(item["bbox"][1] for item in group)
    x1 = max(item["bbox"][2] for item in group)
    y1 = max(item["bbox"][3] for item in group)
    width = max(1, x1 - x0)
    height = max(1, y1 - y0)
    source_pixels = source.tobytes()
    out = bytearray(width * height * 4)
    for item in group:
        for pixel in item["pixels"]:
            sx = pixel % source.width
            sy = pixel // source.width
            target_index = ((sy - y0) * width + sx - x0) * 4
            source_index = pixel * 4
            out[target_index:target_index + 4] = source_pixels[source_index:source_index + 4]
    return Image.frombytes("RGBA", (width, height), bytes(out))


def prune_cell_components(cell):
    items = components(cell, threshold=ALPHA_THRESHOLD)
    if len(items) <= 1:
        return cell
    best = max(items, key=lambda item: item["area"])
    best_box = expanded(best["bbox"], 74, cell.width, cell.height)
    bx, by = best["center"]
    keep = []
    for item in items:
        ix, iy = item["center"]
        distance = ((ix - bx) ** 2 + (iy - by) ** 2) ** 0.5
        useful = item["area"] >= max(80, best["area"] * 0.026)
        near_body = boxes_intersect(item["bbox"], best_box) or distance <= 104
        central_effect = 36 <= ix <= cell.width - 36 and item["area"] >= max(52, best["area"] * 0.012)
        if item is best or (useful and near_body) or (central_effect and distance <= 132):
            keep.append(item)
    pixels = bytearray(cell.tobytes())
    mask = bytearray(cell.width * cell.height)
    for item in keep:
        for pixel in item["pixels"]:
            mask[pixel] = 1
    for pixel_index, allowed in enumerate(mask):
        if allowed:
            continue
        byte_index = pixel_index * 4
        pixels[byte_index:byte_index + 4] = b"\x00\x00\x00\x00"
    return Image.frombytes("RGBA", cell.size, bytes(pixels))


def row_for_component(item, source_h, rows):
    row_h = source_h / rows
    return max(0, min(rows - 1, int(item["center"][1] / row_h)))


def rebuild_sheet_by_components(source_name, target_name, cols, rows, row_targets, row_max_widths, row_bottom_pads, row_min_body_areas):
    source = finalize_alpha(remove_green_matte(Image.open(SPRITES / source_name)))
    out = Image.new("RGBA", (cols * SLOT, rows * SLOT), (0, 0, 0, 0))
    source_w, source_h = source.size
    cell_h = source_h / rows
    all_components = components(source, threshold=ALPHA_THRESHOLD)
    grouped_by_row = [[] for _ in range(rows)]
    for item in all_components:
        grouped_by_row[row_for_component(item, source_h, rows)].append(item)
    stats = []
    for row in range(rows):
        row_components = grouped_by_row[row]
        bodies = [item for item in row_components if item["area"] >= row_min_body_areas[row]]
        if len(bodies) < cols:
            bodies = sorted(row_components, key=lambda item: item["area"], reverse=True)[:cols]
        else:
            bodies = sorted(bodies, key=lambda item: item["area"], reverse=True)[:cols]
        bodies = sorted(bodies, key=lambda item: item["center"][0])
        assignments = [[body] for body in bodies]
        for item in row_components:
            if item in bodies or not bodies:
                continue
            ix, iy = item["center"]
            nearest = min(
                range(len(bodies)),
                key=lambda index: abs(ix - bodies[index]["center"][0]) + abs(iy - bodies[index]["center"][1]) * 0.32,
            )
            body = bodies[nearest]
            bx, by = body["center"]
            body_box = expanded(body["bbox"], 78, source_w, source_h)
            near_body = boxes_intersect(item["bbox"], body_box)
            same_pose_band = abs(ix - bx) <= source_w / cols * 0.62 and abs(iy - by) <= cell_h * 0.7
            useful_piece = item["area"] >= max(24, body["area"] * 0.012)
            if useful_piece and (near_body or same_pose_band):
                assignments[nearest].append(item)
        for col in range(cols):
            if col >= len(assignments):
                stats.append((row, col, 0))
                continue
            selected = component_group_image(source, assignments[col])
            stat = paste_normalized(
                selected,
                out,
                col * SLOT,
                row * SLOT,
                row_targets[row],
                row_max_widths[row],
                row_bottom_pads[row],
            )
            stats.append((row, col, stat["visible"]))
    out = finalize_alpha(out)
    out.save(SPRITES / target_name)
    weak = [item for item in stats if item[2] < 8000]
    print(f"wrote {target_name} frames={len(stats)} weak={weak[:8]}")
    return out


def tighten_existing_sheet(source_name, target_name, cols, rows, pad=8):
    source = finalize_alpha(Image.open(SPRITES / source_name))
    out = Image.new("RGBA", (cols * SLOT, rows * SLOT), (0, 0, 0, 0))
    stats = []
    for row in range(rows):
        for col in range(cols):
            cell = source.crop((col * SLOT, row * SLOT, (col + 1) * SLOT, (row + 1) * SLOT))
            cell = finalize_alpha(cell)
            cell = prune_cell_components(cell)
            bbox = alpha_bbox(cell)
            if not bbox:
                stats.append((row, col, 0, 0))
                continue
            sprite = cell.crop(bbox)
            target_w = SLOT - pad * 2
            target_h = SLOT - pad * 2
            edge_touching = bbox[0] <= 2 or bbox[1] <= 2 or bbox[2] >= SLOT - 2 or bbox[3] >= SLOT - 2
            scale = min(1, target_w / max(1, sprite.width), target_h / max(1, sprite.height))
            if edge_touching:
                scale = min(scale, 0.965)
            width = max(1, round(sprite.width * scale))
            height = max(1, round(sprite.height * scale))
            sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
            sprite = finalize_alpha(sprite)
            original_cx = (bbox[0] + bbox[2]) / 2
            original_bottom = bbox[3]
            x = round(original_cx - width / 2)
            y = round(original_bottom - height)
            x = max(pad, min(SLOT - width - pad, x))
            y = max(pad, min(SLOT - height - pad, y))
            out.alpha_composite(sprite, (col * SLOT + x, row * SLOT + y))
            stats.append((row, col, visible_pixels(sprite), int(edge_touching)))
    out = finalize_alpha(out)
    out.save(SPRITES / target_name)
    weak = [item for item in stats if item[2] < 8000]
    edge_fixed = sum(item[3] for item in stats)
    print(f"wrote {target_name} frames={len(stats)} edge_fixed={edge_fixed} weak={weak[:8]}")
    return out


def main():
    tighten_existing_sheet(
        "enemy_anim_imagen_hd_sheet_clean_v2.png",
        "enemy_anim_imagen_hd_sheet_clean_v3.png",
        cols=8,
        rows=7,
        pad=9,
    )
    tighten_existing_sheet(
        "gothic_enemy_anim_imagen_hd_clean.png",
        "gothic_enemy_anim_imagen_hd_clean_v2.png",
        cols=8,
        rows=2,
        pad=10,
    )


if __name__ == "__main__":
    main()
