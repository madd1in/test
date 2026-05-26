from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "assets" / "imagen" / "sources"
LAYERS = ROOT / "assets" / "imagen" / "layers"


@dataclass(frozen=True)
class Cutout:
    source: str
    output: str
    key: tuple[int, int, int] | None = None
    threshold: float = 72
    feather: float = 55
    max_edge: int = 1024


CUTOUTS = [
    Cutout("lab-tank-squid-source.png", "lab-tank-squid.png", max_edge=1050),
    Cutout("professor-source.png", "professor.png", max_edge=760),
    Cutout("chef-source.png", "chef.png", max_edge=820),
    Cutout("yeast-gel-source.png", "yeast-gel.png", key=(255, 0, 255), threshold=82, feather=58, max_edge=520),
    Cutout("guard-source.png", "guard.png", max_edge=820),
]


def sampled_border_key(rgb: np.ndarray) -> np.ndarray:
    strips = [
        rgb[:12, :, :],
        rgb[-12:, :, :],
        rgb[:, :12, :],
        rgb[:, -12:, :],
    ]
    border = np.concatenate([strip.reshape(-1, 3) for strip in strips], axis=0)
    return np.median(border, axis=0)


def remove_key(cutout: Cutout) -> None:
    image = Image.open(SOURCES / cutout.source).convert("RGBA")
    rgba = np.asarray(image).astype(np.float32)
    rgb = rgba[:, :, :3]
    key = np.array(cutout.key, dtype=np.float32) if cutout.key else sampled_border_key(rgb)

    distance = np.linalg.norm(rgb - key, axis=2)
    alpha = np.clip((distance - cutout.threshold) / cutout.feather, 0, 1)
    alpha = (alpha ** 0.85) * 255

    original_alpha = rgba[:, :, 3]
    rgba[:, :, 3] = np.minimum(original_alpha, alpha)

    # Despill only where the matte edge is soft.
    edge = (rgba[:, :, 3] > 0) & (rgba[:, :, 3] < 250)
    if key[1] > key[0] and key[1] > key[2]:
        rgba[:, :, 1][edge] = np.minimum(rgba[:, :, 1][edge], (rgba[:, :, 0][edge] + rgba[:, :, 2][edge]) * 0.72)
    if key[0] > 220 and key[2] > 220 and key[1] < 80:
        rgba[:, :, 0][edge] *= 0.82
        rgba[:, :, 2][edge] *= 0.82

    matte = rgba[:, :, 3] > 8
    if matte.any():
        ys, xs = np.where(matte)
        pad = 18
        left = max(int(xs.min()) - pad, 0)
        right = min(int(xs.max()) + pad + 1, rgba.shape[1])
        top = max(int(ys.min()) - pad, 0)
        bottom = min(int(ys.max()) + pad + 1, rgba.shape[0])
        rgba = rgba[top:bottom, left:right, :]

    out = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")
    scale = min(1, cutout.max_edge / max(out.size))
    if scale < 1:
        out = out.resize((round(out.width * scale), round(out.height * scale)), Image.Resampling.LANCZOS)

    LAYERS.mkdir(parents=True, exist_ok=True)
    out.save(LAYERS / cutout.output, optimize=True)


def main() -> None:
    for cutout in CUTOUTS:
        remove_key(cutout)
        output = LAYERS / cutout.output
        with Image.open(output) as image:
            alpha = np.asarray(image.getchannel("A"))
            transparent_corners = [
                alpha[0, 0],
                alpha[0, -1],
                alpha[-1, 0],
                alpha[-1, -1],
            ]
            if max(transparent_corners) > 12:
                raise RuntimeError(f"{cutout.output} still has opaque corners")
            print(f"{cutout.output}: {image.width}x{image.height}, alpha ok")


if __name__ == "__main__":
    main()
