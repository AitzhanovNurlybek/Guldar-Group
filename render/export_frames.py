"""
Готовит кадры фото-рендера для сайта: PNG из кэша → AVIF (с прозрачностью) для десктопа и телефона + WebP-постеры.
AVIF вдвое легче WebP при том же качестве; постер — первый кадр для мгновенной картинки и старых браузеров.

Запуск: python render/export_frames.py
"""

import glob
import os
import sys

from PIL import Image

CACHE = os.path.join(os.path.expanduser("~"), "render-cache", "guldar", "frames")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "public", "scene")
SETS = {"d": ((1320, 1200), 55), "m": ((880, 800), 50)}


def main():
    frames = sorted(glob.glob(os.path.join(CACHE, "f*.png")))
    if not frames:
        print("нет кадров в", CACHE)
        return 1
    total = {k: 0 for k in SETS}
    for n, path in enumerate(frames, 1):
        im = Image.open(path).convert("RGBA")
        for key, (size, q) in SETS.items():
            os.makedirs(os.path.join(OUT, key), exist_ok=True)
            dst = os.path.join(OUT, key, f"{n:03d}.avif")
            im.resize(size, Image.LANCZOS).save(dst, "AVIF", quality=q, speed=4)
            total[key] += os.path.getsize(dst)
            if n == 1:
                im.resize(size, Image.LANCZOS).save(os.path.join(OUT, f"poster-{key}.webp"), "WEBP", quality=78, method=6)
    for key, b in total.items():
        print(f"{key}: {len(frames)} кадров, {b / 1e6:.1f} МБ")
    return 0


if __name__ == "__main__":
    sys.exit(main())
