#!/usr/bin/env python3
"""Generate the Android launcher icons from Mizano's existing PWA icons.

Run after `cap add android` (the workflow does this on every build, so it is idempotent):

    python3 scripts/android-icons.py [--res android/app/src/main/res] [--src public/icons]

Inputs (already in the repo):
  icon-512.png           -> legacy square launcher icon (Android < 8)
  icon-maskable-512.png  -> adaptive icon foreground and round icon

Resource names are namespaced (mizano_*) so they cannot collide with the Capacitor template's own files;
only ic_launcher.png / ic_launcher_round.png and the two adaptive XMLs (referenced by AndroidManifest) are replaced.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw

# density -> (legacy launcher px = 48dp, adaptive layer px = 108dp)
DENSITIES = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}

# The maskable PNG keeps its artwork inside the central 80%; the adaptive mask shows the central 72dp of 108dp.
# Scaling the whole maskable image to 90dp makes its safe zone exactly fill the visible window.
MASKABLE_DP = 90
LAYER_DP = 108

ADAPTIVE_XML = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/mizano_icon_background"/>
    <foreground android:drawable="@mipmap/mizano_icon_foreground"/>
</adaptive-icon>
"""

COLORS_XML = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="mizano_icon_background">{color}</color>
</resources>
"""


def circle(img: Image.Image) -> Image.Image:
    size = img.width
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    out = img.copy()
    out.putalpha(mask.resize((size, size), Image.LANCZOS))
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--res", default="android/app/src/main/res")
    parser.add_argument("--src", default="public/icons")
    args = parser.parse_args()

    res, src = Path(args.res), Path(args.src)
    legacy = Image.open(src / "icon-512.png").convert("RGBA")
    maskable = Image.open(src / "icon-maskable-512.png").convert("RGBA")
    r, g, b, _ = maskable.getpixel((0, 0))  # full-bleed background colour of the maskable icon
    color = f"#{r:02X}{g:02X}{b:02X}"

    for name, (icon_px, layer_px) in DENSITIES.items():
        d = res / f"mipmap-{name}"
        d.mkdir(parents=True, exist_ok=True)

        legacy.resize((icon_px, icon_px), Image.LANCZOS).save(d / "ic_launcher.png")
        circle(maskable.resize((icon_px, icon_px), Image.LANCZOS)).save(d / "ic_launcher_round.png")

        inner = round(layer_px * MASKABLE_DP / LAYER_DP)
        layer = Image.new("RGBA", (layer_px, layer_px), (0, 0, 0, 0))
        offset = (layer_px - inner) // 2
        layer.paste(maskable.resize((inner, inner), Image.LANCZOS), (offset, offset))
        layer.save(d / "mizano_icon_foreground.png")

    anydpi = res / "mipmap-anydpi-v26"
    anydpi.mkdir(parents=True, exist_ok=True)
    (anydpi / "ic_launcher.xml").write_text(ADAPTIVE_XML)
    (anydpi / "ic_launcher_round.xml").write_text(ADAPTIVE_XML)

    values = res / "values"
    values.mkdir(parents=True, exist_ok=True)
    (values / "mizano_launcher_colors.xml").write_text(COLORS_XML.format(color=color))

    print(f"Wrote Mizano launcher icons to {res} (adaptive background {color})")


if __name__ == "__main__":
    main()
