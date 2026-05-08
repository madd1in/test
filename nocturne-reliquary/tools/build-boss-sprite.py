"""Procedural boss sprite sheet generator for Nocturne Reliquary.

Layout matches what game.js expects:
  900 x 1440 image
  6 rows of 240 px height, 3 cols of 300 px width
  game uses boss.row = 5 (last row), frames 0..2:
    frame 0: idle (default)
    frame 1: cast (spell volley)
    frame 2: dash (forward lunge)

We also clone the row 5 content into rows 0..4 so any draw call to a
different row still produces a usable silhouette.
"""

from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "assets" / "generated"

SHEET_W = 900
SHEET_H = 1440
FRAME_W = 300
FRAME_H = 240
COLS = 3
ROWS = 6


# Palette (gothic vampire-lord, crimson + ash + bone)
SKIN = (216, 198, 198)
SKIN_SHADE = (162, 138, 142)
ROBE = (102, 24, 32)
ROBE_DARK = (62, 12, 18)
ROBE_HIGH = (158, 50, 60)
CAPE = (28, 12, 18)
CAPE_TRIM = (200, 168, 102)
CROWN = (218, 178, 92)
CROWN_DARK = (132, 96, 38)
EYE = (252, 78, 78)
ORB = (240, 102, 76)
ORB_GLOW = (255, 188, 130)
SHADOW = (10, 6, 10)
HAIR = (24, 12, 18)


def vert_grad(draw: ImageDraw.ImageDraw, box, top, bot):
    x0, y0, x1, y1 = box
    h = max(1, y1 - y0)
    for i in range(h):
        t = i / max(1, h - 1)
        col = (
            round(top[0] + (bot[0] - top[0]) * t),
            round(top[1] + (bot[1] - top[1]) * t),
            round(top[2] + (bot[2] - top[2]) * t),
        )
        draw.line((x0, y0 + i, x1, y0 + i), fill=col)


def draw_cape(d: ImageDraw.ImageDraw, cx: int, top: int, bot: int, spread: int, sway: int = 0):
    # Cape silhouette: sweeping shape behind the body.
    poly = [
        (cx - spread + sway, top),
        (cx + spread + sway, top),
        (cx + spread + 6 + sway // 2, bot - 18),
        (cx + 28 + sway // 3, bot),
        (cx - 28 + sway // 3, bot),
        (cx - spread - 6 + sway // 2, bot - 18),
    ]
    d.polygon(poly, fill=CAPE, outline=SHADOW)
    # Inner lining (lighter trim along edge)
    inner = [(p[0] + (8 if i in (1, 2) else -8), p[1]) for i, p in enumerate(poly)]
    d.line([poly[0], poly[5]], fill=CAPE_TRIM, width=2)
    d.line([poly[1], poly[2]], fill=CAPE_TRIM, width=2)
    # Subtle vertical folds
    for fx in (-spread // 2, 0, spread // 2):
        d.line((cx + fx + sway // 2, top + 8, cx + fx + sway // 2 + 4, bot - 14), fill=(50, 22, 28), width=2)


def draw_robe(d: ImageDraw.ImageDraw, cx: int, top: int, bot: int, lean: int = 0):
    # Lower robe (wide flowing skirt)
    poly = [
        (cx - 30 + lean, top),
        (cx + 30 + lean, top),
        (cx + 78 + lean // 2, bot),
        (cx - 78 + lean // 2, bot),
    ]
    d.polygon(poly, fill=ROBE, outline=SHADOW)
    # Inner shading
    d.polygon([
        (cx - 24 + lean, top + 4),
        (cx + 6 + lean, top + 4),
        (cx + 32 + lean // 2, bot - 4),
        (cx - 28 + lean // 2, bot - 4),
    ], fill=ROBE_DARK)
    # Highlight strip along center
    d.line((cx + lean, top + 4, cx + lean // 2, bot - 6), fill=ROBE_HIGH, width=3)
    # Trim band at hem
    d.rectangle((cx - 78 + lean // 2, bot - 8, cx + 78 + lean // 2, bot - 2), fill=CROWN)
    d.line((cx - 78 + lean // 2, bot - 2, cx + 78 + lean // 2, bot - 2), fill=CROWN_DARK)


def draw_torso(d: ImageDraw.ImageDraw, cx: int, top: int, bot: int, lean: int = 0):
    poly = [
        (cx - 22 + lean, top),
        (cx + 22 + lean, top),
        (cx + 28, bot),
        (cx - 28, bot),
    ]
    d.polygon(poly, fill=ROBE, outline=SHADOW)
    # Cuirass / chest plate suggestion
    d.rectangle((cx - 18 + lean // 2, top + 8, cx + 18 + lean // 2, bot - 6), fill=ROBE_DARK)
    # Gold clasp
    d.ellipse((cx - 6 + lean // 2, top + 14, cx + 6 + lean // 2, top + 26), fill=CROWN)
    d.ellipse((cx - 3 + lean // 2, top + 17, cx + 3 + lean // 2, top + 23), fill=CROWN_DARK)


def draw_head(d: ImageDraw.ImageDraw, cx: int, head_top: int, eye_intensity: float = 1.0):
    head_h = 56
    head_w = 48
    head_box = (cx - head_w // 2, head_top, cx + head_w // 2, head_top + head_h)
    # Hair shadow / crown base
    d.ellipse((head_box[0] - 4, head_box[1] - 6, head_box[2] + 4, head_box[1] + 12), fill=HAIR)
    # Skin
    d.ellipse(head_box, fill=SKIN, outline=SHADOW)
    # Cheek shadow
    d.ellipse((cx - 22, head_top + 24, cx - 4, head_top + 42), fill=SKIN_SHADE)
    d.ellipse((cx + 4, head_top + 24, cx + 22, head_top + 42), fill=SKIN_SHADE)
    # Eyes (glow scales with eye_intensity)
    eye_r = max(2, round(3 * eye_intensity))
    glow_r = round(7 * eye_intensity)
    for ex in (cx - 10, cx + 10):
        # outer glow
        d.ellipse((ex - glow_r, head_top + 22 - glow_r // 2, ex + glow_r, head_top + 22 + glow_r // 2),
                  fill=(180, 30, 30))
        # core
        d.ellipse((ex - eye_r, head_top + 22 - eye_r, ex + eye_r, head_top + 22 + eye_r), fill=EYE)
    # Mouth (faint line)
    d.line((cx - 6, head_top + 42, cx + 6, head_top + 42), fill=ROBE_DARK, width=2)
    # Crown of horns/points
    pts = [
        (cx - 22, head_top + 4), (cx - 14, head_top - 12), (cx - 6, head_top + 4),
        (cx + 6, head_top + 4), (cx + 14, head_top - 12), (cx + 22, head_top + 4),
    ]
    d.polygon(pts, fill=CROWN, outline=CROWN_DARK)
    # Center crown gem
    d.ellipse((cx - 4, head_top + 4, cx + 4, head_top + 10), fill=EYE)


def draw_arm(d: ImageDraw.ImageDraw, x0: int, y0: int, x1: int, y1: int, hand_color=SKIN):
    # Sleeve
    d.line((x0, y0, x1, y1), fill=ROBE, width=18)
    # Shading
    d.line((x0 + 2, y0 + 2, x1 + 2, y1 + 2), fill=ROBE_DARK, width=10)
    # Hand
    d.ellipse((x1 - 9, y1 - 9, x1 + 9, y1 + 9), fill=hand_color, outline=SHADOW)


def draw_orb(d: ImageDraw.ImageDraw, x: int, y: int, r: int, intensity: float = 1.0):
    # Outer halo
    halo_r = round(r * 1.6 * intensity)
    d.ellipse((x - halo_r, y - halo_r, x + halo_r, y + halo_r),
              fill=(int(200 * intensity), int(80 * intensity), int(60 * intensity)))
    # Mid
    d.ellipse((x - r, y - r, x + r, y + r), fill=ORB)
    # Bright core
    core = max(2, r - 4)
    d.ellipse((x - core, y - core, x + core, y + core), fill=ORB_GLOW)
    # Tiny highlight
    d.ellipse((x - r + 2, y - r + 2, x - r + 7, y - r + 7), fill=(255, 240, 220))


def draw_idle(frame: Image.Image, scale: float = 1.0):
    d = ImageDraw.Draw(frame)
    cx = FRAME_W // 2
    bot = FRAME_H - 8
    # Cape behind everything
    draw_cape(d, cx, top=70, bot=bot, spread=86)
    # Robe (skirt)
    draw_robe(d, cx, top=130, bot=bot)
    # Torso
    draw_torso(d, cx, top=86, bot=130)
    # Arms — hanging
    draw_arm(d, cx - 22, 100, cx - 56, 158)
    draw_arm(d, cx + 22, 100, cx + 56, 158)
    # Orb in right hand
    draw_orb(d, cx + 56, 158, r=12, intensity=0.85)
    # Head
    draw_head(d, cx, head_top=42, eye_intensity=0.85)
    # Soft floor shadow
    sd = ImageDraw.Draw(frame)
    sd.ellipse((cx - 78, bot - 6, cx + 78, bot + 6), fill=(0, 0, 0, 130))


def draw_cast(frame: Image.Image):
    d = ImageDraw.Draw(frame)
    cx = FRAME_W // 2
    bot = FRAME_H - 8
    # Cape spread wider (windswept)
    draw_cape(d, cx, top=66, bot=bot, spread=104, sway=8)
    draw_robe(d, cx, top=130, bot=bot)
    draw_torso(d, cx, top=84, bot=132)
    # Arms raised outward
    draw_arm(d, cx - 22, 100, cx - 88, 64)
    draw_arm(d, cx + 22, 100, cx + 88, 64)
    # Both hands radiate orbs
    draw_orb(d, cx - 88, 64, r=14, intensity=1.2)
    draw_orb(d, cx + 88, 64, r=14, intensity=1.2)
    # Center glow streak
    for r in (60, 44, 28, 14):
        alpha = 220 - r * 2
        col = (255, 110, 80) if r > 28 else (255, 220, 180)
        d.ellipse((cx - r, 100 - r, cx + r, 100 + r), outline=col, width=2)
    # Head — eyes blazing
    draw_head(d, cx, head_top=40, eye_intensity=1.4)


def draw_dash(frame: Image.Image):
    d = ImageDraw.Draw(frame)
    cx = FRAME_W // 2
    bot = FRAME_H - 8
    lean = 8  # forward lean
    # Cape billowing back
    draw_cape(d, cx - 4, top=72, bot=bot, spread=110, sway=-26)
    # Speed lines behind
    for i, y in enumerate((110, 130, 150, 170, 195)):
        d.line((cx - 130 - i * 4, y, cx - 60, y), fill=(180, 60, 50), width=2)
    draw_robe(d, cx + lean, top=132, bot=bot, lean=lean)
    draw_torso(d, cx, top=84, bot=130, lean=lean)
    # Forward extended arm w/ orb leading the dash
    draw_arm(d, cx + 18, 102, cx + 100, 118)
    draw_orb(d, cx + 100, 118, r=16, intensity=1.5)
    # Trailing arm back
    draw_arm(d, cx - 14, 100, cx - 60, 132)
    # Head leaning forward
    draw_head(d, cx + lean, head_top=42, eye_intensity=1.2)


def add_floor_shadow(frame: Image.Image):
    """Soft shadow under the figure to ground them."""
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    cx = FRAME_W // 2
    bot = FRAME_H - 6
    od.ellipse((cx - 84, bot - 8, cx + 84, bot + 6), fill=(0, 0, 0, 120))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=3))
    frame.alpha_composite(overlay)


def make_frame(kind: str) -> Image.Image:
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    add_floor_shadow(img)
    if kind == "idle":
        draw_idle(img)
    elif kind == "cast":
        draw_cast(img)
    elif kind == "dash":
        draw_dash(img)
    return img


def main():
    GEN.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))
    frames = [make_frame("idle"), make_frame("cast"), make_frame("dash")]
    # Replicate each pose into all 6 rows so any boss.row works.
    for row in range(ROWS):
        for col in range(COLS):
            sheet.alpha_composite(frames[col], (col * FRAME_W, row * FRAME_H))
    out_path = GEN / "boss_sheet_anim.png"
    sheet.save(out_path)
    print(f"Wrote {out_path} ({SHEET_W}x{SHEET_H}, 3 poses across {ROWS} rows)")


if __name__ == "__main__":
    main()
