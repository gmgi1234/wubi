"""Prototype: font glyph -> skeleton -> stroke branches -> SVG paths + medians.

Usage: python font2strokes.py 王 [font]
Outputs tools/font-strokes/<char>.json with {strokes:[path...], medians:[[[x,y]...]]}
"""

import json
import math
import os
import sys

import freetype
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage.morphology import skeletonize

BASE = r"D:\Users\10061\Downloads\wubi"
OUT = os.path.join(BASE, "tools", "font-strokes")
os.makedirs(OUT, exist_ok=True)
SIZE = 1024


def glyph_bitmap(ch, font_path):
    face = freetype.Face(font_path)
    face.set_pixel_sizes(0, SIZE)
    face.load_char(ch, freetype.FT_LOAD_RENDER | freetype.FT_LOAD_NO_HINTING)
    bm = face.glyph.bitmap
    arr = np.array(bm.buffer, dtype=np.uint8).reshape(bm.rows, bm.width)  # row 0 = top
    img = np.zeros((SIZE, SIZE), dtype=np.uint8)
    x0 = face.glyph.bitmap_left
    y0 = 900 - face.glyph.bitmap_top
    h, w = arr.shape
    img[max(0, y0):max(0, y0) + h, max(0, x0):max(0, x0) + w] = arr
    return img


def branch_order(pixels):
    """Order a branch (set of pixels) into a polyline from one end to the other."""
    pix = set(map(tuple, pixels))
    if len(pix) == 1:
        return [next(iter(pix))]
    nbrs = lambda p: [(p[0] + dx, p[1] + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)
                      if (dx or dy) and (p[0] + dx, p[1] + dy) in pix]
    ends = [p for p in pix if len(nbrs(p)) == 1]
    start = ends[0] if ends else next(iter(pix))
    order = [start]
    prev = None
    cur = start
    while True:
        cand = [q for q in nbrs(cur) if q != prev]
        if not cand:
            break
        nxt = cand[0]
        order.append(nxt)
        prev, cur = cur, nxt
        if cur in ends and len(order) > 1:
            break
        if len(order) > len(pix):
            break
    return order


def polyline(points, step=6):
    pts = points[::step]
    if points[-1] != pts[-1]:
        pts.append(points[-1])
    return pts


def stroke_polygon(pts, widths, cap_points=6):
    """Offset a polyline into a closed polygon with round caps."""
    left, right = [], []
    n = len(pts)
    for i, (x, y) in enumerate(pts):
        if i == 0:
            dx, dy = pts[1][0] - x, pts[1][1] - y
        elif i == n - 1:
            dx, dy = x - pts[-2][0], y - pts[-2][1]
        else:
            dx, dy = pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]
        norm = math.hypot(dx, dy) or 1
        nx, ny = -dy / norm, dx / norm
        r = widths[i]
        left.append((x + nx * r, y + ny * r))
        right.append((x - nx * r, y - ny * r))
    poly = left + right[::-1]
    d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in poly) + " Z"
    return d


def extract(ch, font_path):
    img = glyph_bitmap(ch, font_path)
    mask = img > 40
    np.save(os.path.join(OUT, f"{ch}-mask.npy"), mask)
    Image.fromarray((mask * 255).astype(np.uint8)).save(os.path.join(OUT, f"{ch}-bitmap.png"))

    skel = skeletonize(mask)
    dist = ndimage.distance_transform_edt(mask)

    # neighbour count on the skeleton
    k = np.ones((3, 3))
    counts = ndimage.convolve(skel.astype(np.uint8), k, mode="constant") - skel
    junctions = skel & (counts >= 3)

    branches = skel & ~junctions
    labels, n = ndimage.label(branches, structure=np.ones((3, 3)))
    print(f"{ch}: skeleton px={int(skel.sum())} junctions={int(junctions.sum())} branches={n}")

    strokes, medians = [], []
    for i in range(1, n + 1):
        ys, xs = np.where(labels == i)
        if len(xs) < 12:
            continue
        order = branch_order(list(zip(xs.tolist(), ys.tolist())))
        if len(order) < 6:
            continue
        pts = polyline(order, step=max(3, len(order) // 8))
        widths = []
        for x, y in pts:
            w = dist[y, x]
            widths.append(max(2.0, float(w) * 0.9))
        # smooth widths
        if len(widths) >= 3:
            widths = [widths[0]] + [(widths[i - 1] + widths[i] + widths[i + 1]) / 3 for i in range(1, len(widths) - 1)] + [widths[-1]]
        strokes.append(stroke_polygon(pts, widths))
        medians.append([[x, 900 - y] for x, y in pts])

    out = {"strokes": strokes, "medians": medians}
    path = os.path.join(OUT, f"{ch}.json")
    json.dump(out, open(path, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"  -> {len(strokes)} strokes, saved {path}")


if __name__ == "__main__":
    chars = sys.argv[1:] or ["王"]
    font = r"C:\Windows\Fonts\simkai.ttf"
    for ch in chars:
        extract(ch, font)
