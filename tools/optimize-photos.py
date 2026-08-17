#!/usr/bin/env python3
"""
Joyful Noise photo optimizer.

Run this any time you add photos to assets/. Camera photos are 5-15 MB each,
which made the old site take ~51 MB to load the homepage. This shrinks them to
the size they're actually displayed at, which is roughly 100x smaller with no
visible difference.

USAGE
    pip install pillow
    python3 tools/optimize-photos.py            # optimize anything oversized
    python3 tools/optimize-photos.py --check    # just report, change nothing

WHAT IT DOES
  - Backs up anything it touches into assets/_originals/ (gitignored, so the
    full-resolution copies stay on your laptop but never bloat the repo).
  - Skips files that are already small enough, so it's safe to re-run.
  - Applies EXIF rotation before stripping metadata, so photos never come out
    sideways.
  - For gallery photos it also writes a bigger copy into gallery/large/, which
    is what the lightbox opens when someone taps a photo.

If you add a NEW folder of photos, add it to TARGETS below.
"""

import os
import shutil
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow isn't installed. Run:  pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINALS = os.path.join(ROOT, "assets", "_originals")

# folder (relative to repo root)          max width   jpeg quality
TARGETS = [
    ("assets/images",                          2200, 82),   # groupphoto.jpg etc.
    ("assets/images/gallery",                   900, 82),   # homepage strip thumbnails
    ("assets/images/history",                   700, 82),   # about-page year strip
    ("assets/images/polaroids",                 400, 82),   # about-page scatter
    ("assets/members",                          600, 82),   # member cards
]

# gallery thumbnails also get a larger copy for the lightbox
LIGHTBOX_SRC = "assets/images/gallery"
LIGHTBOX_OUT = "assets/images/gallery/large"
LIGHTBOX_MAX = 1800

CHECK_ONLY = "--check" in sys.argv


def jpegs_in(folder):
    """Direct children only, so nested folders don't get processed twice."""
    d = os.path.join(ROOT, folder)
    if not os.path.isdir(d):
        return []
    return sorted(
        os.path.join(d, f) for f in os.listdir(d)
        if f.lower().endswith((".jpg", ".jpeg")) and os.path.isfile(os.path.join(d, f))
    )


def backup(path):
    rel = os.path.relpath(path, os.path.join(ROOT, "assets"))
    dest = os.path.join(ORIGINALS, rel)
    if not os.path.exists(dest):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(path, dest)


def shrink(path, max_w, quality, out_path=None):
    im = ImageOps.exif_transpose(Image.open(path))   # bake rotation in first
    im = im.convert("RGB")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(out_path or path, "JPEG", quality=quality,
            optimize=True, progressive=True, subsampling=1)
    return im.size


def main():
    saved = touched = 0

    for folder, max_w, q in TARGETS:
        for path in jpegs_in(folder):
            before = os.path.getsize(path)
            with Image.open(path) as probe:
                w, h = ImageOps.exif_transpose(probe).size
            # Already at (or under) the target width and not bloated? Leave it
            # alone. Re-encoding an already-compressed JPEG degrades it slightly
            # every time, so this script must be a genuine no-op on re-runs.
            if w <= max_w and before <= 900_000:
                continue
            name = os.path.relpath(path, ROOT)
            if CHECK_ONLY:
                print(f"  would shrink  {before // 1024:>6} KB  {w}x{h}  {name}")
                touched += 1
                continue
            backup(path)
            nw, nh = shrink(path, max_w, q)
            after = os.path.getsize(path)
            saved += before - after
            touched += 1
            print(f"  {before // 1024:>6} KB -> {after // 1024:>5} KB   {nw}x{nh}  {name}")

    # lightbox copies for any gallery photo missing one
    if not CHECK_ONLY:
        os.makedirs(os.path.join(ROOT, LIGHTBOX_OUT), exist_ok=True)
        for path in jpegs_in(LIGHTBOX_SRC):
            name = os.path.basename(path)
            out = os.path.join(ROOT, LIGHTBOX_OUT, name)
            if os.path.exists(out):
                continue
            # prefer the full-resolution backup if we have one
            src = os.path.join(ORIGINALS, "images", "gallery", name)
            if not os.path.exists(src):
                src = path
            nw, nh = shrink(src, LIGHTBOX_MAX, 84, out_path=out)
            print(f"  lightbox copy   {nw}x{nh}  {os.path.relpath(out, ROOT)}")

    if not touched:
        print("Everything is already optimized. Nothing to do.")
    elif CHECK_ONLY:
        print(f"\n{touched} file(s) would be optimized. Re-run without --check to do it.")
    else:
        print(f"\nDone. {touched} file(s) optimized, {saved / 1048576:.1f} MB saved.")
        print("Full-resolution copies are safe in assets/_originals/ (gitignored).")


if __name__ == "__main__":
    main()
