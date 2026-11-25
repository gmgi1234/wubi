"""Import a grouper export that carries branchIds (ordered) and rebuild clean strokes.

Uses the click order directly: branch 1 = stroke start, then each next branch is
attached by the nearer endpoint. Outline comes from rasterising the centreline.
"""

import json
import math
import os
import shutil
import sys

import freetype
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage import measure

BASE = r"D:\Users\10061\Downloads\wubi"
FONT = r"C:\Windows\Fonts\simkai.ttf"
SIZE = 1024


def glyph_dist(ch):
    face = freetype.Face(FONT)
    face.set_pixel_sizes(0, SIZE)
    face.load_char(ch, freetype.FT_LOAD_RENDER | freetype.FT_LOAD_NO_HINTING)
    bm = face.glyph.bitmap
    arr = np.array(bm.buffer, dtype=np.uint8).reshape(bm.rows, bm.width)
    img = np.zeros((SIZE, SIZE), dtype=np.uint8)
    x0 = max(0, face.glyph.bitmap_left)
    y0 = max(0, 900 - face.glyph.bitmap_top)
    h, w = arr.shape
    img[y0:min(SIZE, y0 + h), x0:min(SIZE, x0 + w)] = arr[:min(h, SIZE - y0), :min(w, SIZE - x0)]
    return ndimage.distance_transform_edt(img > 40)


def resample(pts, step=3.0):
    out = [pts[0]]
    for i in range(1, len(pts)):
        a, b = pts[i - 1], pts[i]
        d = math.hypot(b[0] - a[0], b[1] - a[1])
        n = max(1, int(d / step))
        for k in range(1, n + 1):
            out.append([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n])
    return out


def smooth(pts, window=9):
    if len(pts) < window:
        return pts
    half = window // 2
    return [[sum(p[0] for p in pts[max(0, i - half):min(len(pts), i + half + 1)]) / len(pts[max(0, i - half):min(len(pts), i + half + 1)]),
             sum(p[1] for p in pts[max(0, i - half):min(len(pts), i + half + 1)]) / len(pts[max(0, i - half):min(len(pts), i + half + 1)])]
            for i in range(len(pts))]


def raster_outline(pts, widths, tol=1.6):
    img = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(img)
    for (x, y), r in zip(pts, widths):
        row = 900 - y
        draw.ellipse([x - r, row - r, x + r, row + r], fill=255)
    contours = measure.find_contours((np.array(img) > 127).astype(float), 0.5)
    if not contours:
        return None
    poly = measure.approximate_polygon(max(contours, key=len), tolerance=tol)
    return [[float(c), 900.0 - float(r)] for r, c in poly]


def main(src, ch):
    export = json.load(open(src, encoding="utf-8"))
    branches = {b["id"]: [[float(x), float(y)] for x, y in b["pts"]]
                for b in json.load(open(os.path.join(BASE, "tools", "font-strokes", f"{ch}-branches.json"), encoding="utf-8"))["branches"]}
    dist = glyph_dist(ch)

    strokes, medians_out = [], []
    for st in export["strokes"]:
        ids = st.get("branchIds") or []
        if not ids:
            continue
        chain = list(branches[ids[0]])
        for bid in ids[1:]:
            seg = branches[bid]
            end = chain[-1]
            ds = math.hypot(seg[0][0] - end[0], seg[0][1] - end[1])
            de = math.hypot(seg[-1][0] - end[0], seg[-1][1] - end[1])
            if de < ds:
                seg = seg[::-1]
            d = math.hypot(seg[0][0] - end[0], seg[0][1] - end[1])
            n = max(1, int(d / 4.0))
            for k in range(1, n):
                chain.append([end[0] + (seg[0][0] - end[0]) * k / n, end[1] + (seg[0][1] - end[1]) * k / n])
            chain += seg

        chain = resample(chain, 3.0)
        chain = smooth(chain, 9)
        widths = []
        for x, y in chain:
            row = min(SIZE - 1, max(0, int(round(900 - y))))
            col = min(SIZE - 1, max(0, int(round(x))))
            widths.append(max(3.0, float(dist[row, col])))
        w2 = widths[:]
        for i in range(2, len(widths) - 2):
            w2[i] = sorted(widths[i - 2:i + 3])[2]
        for i in range(1, len(w2)):
            lim = 0.10 * max(3.0, w2[i - 1])
            w2[i] = min(max(w2[i], 2.0), w2[i - 1] + lim)
            w2[i] = max(w2[i], w2[i - 1] - lim)
        poly = raster_outline(chain, w2)
        if not poly:
            continue
        strokes.append("M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in poly) + " Z")
        medians_out.append([[round(x, 1), round(y, 1)] for x, y in chain])

    target = os.path.join(BASE, "data", "chars", f"{ch}.json")
    if not os.path.exists(target + ".bak-grouper"):
        shutil.copyfile(target, target + ".bak-grouper")
    json.dump({"strokes": strokes, "medians": medians_out}, open(target, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{ch}: built {len(strokes)} strokes from ordered branch ids")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
