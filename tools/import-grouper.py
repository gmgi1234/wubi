"""Import a branch-grouper export and rebuild clean stroke outlines from the medians.

The grouper's own polygon is jagged (merged branches leave jumps), so we ignore the
exported `d` and rebuild each stroke from its median line + font stroke widths.
"""

import json
import math
import os
import sys

import freetype
import numpy as np
from PIL import Image
from scipy import ndimage

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


def smooth(points, window=5):
    if len(points) < window:
        return points
    out = []
    half = window // 2
    for i in range(len(points)):
        lo, hi = max(0, i - half), min(len(points), i + half + 1)
        seg = points[lo:hi]
        out.append([sum(p[0] for p in seg) / len(seg), sum(p[1] for p in seg) / len(seg)])
    return out


def simplify(points, eps=2.0):
    if len(points) < 3:
        return points
    # Ramer-Douglas-Peucker
    def rdp(pts):
        if len(pts) < 3:
            return pts
        (x1, y1), (x2, y2) = pts[0], pts[-1]
        dmax, idx = 0.0, 0
        for i in range(1, len(pts) - 1):
            x0, y0 = pts[i]
            num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
            den = math.hypot(y2 - y1, x2 - x1) or 1
            d = num / den
            if d > dmax:
                dmax, idx = d, i
        if dmax > eps:
            return rdp(pts[:idx + 1])[:-1] + rdp(pts[idx:])
        return [pts[0], pts[-1]]
    return rdp(points)


def outline(pts, widths, cap_steps=6):
    n = len(pts)
    left, right = [], []
    normals = []
    for i, (x, y) in enumerate(pts):
        if i == 0:
            dx, dy = pts[1][0] - x, pts[1][1] - y
        elif i == n - 1:
            dx, dy = x - pts[-2][0], y - pts[-2][1]
        else:
            dx, dy = pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        normals.append((nx, ny))
        r = widths[i]
        left.append((x + nx * r, y + ny * r))
        right.append((x - nx * r, y - ny * r))

    def cap(center, normal, r, forward):
        (nx, ny) = normal
        ang0 = math.atan2(ny, nx)
        pts_arc = []
        for k in range(1, cap_steps):
            a = ang0 + (math.pi * k / cap_steps) * forward
            pts_arc.append((center[0] + math.cos(a) * r, center[1] + math.sin(a) * r))
        return pts_arc

    poly = left + cap(pts[-1], normals[-1], widths[-1], 1) + right[::-1] + cap(pts[0], normals[0], widths[0], -1)
    return poly


def main(src, ch):
    data = json.load(open(src, encoding="utf-8"))
    dist = glyph_dist(ch)
    strokes, medians_out = [], []
    for s in data["strokes"]:
        pts = [[float(x), float(y)] for x, y in s["medians"]]
        pts = smooth(pts, 5)
        pts = simplify(pts, 2.0)
        # resample to a reasonable step
        widths = []
        for x, y in pts:
            row = int(round(900 - y))
            col = int(round(x))
            row = min(SIZE - 1, max(0, row))
            col = min(SIZE - 1, max(0, col))
            r = float(dist[row, col])
            widths.append(max(2.5, r))
        # smooth widths
        if len(widths) >= 3:
            widths = [widths[0]] + [(widths[i - 1] + widths[i] + widths[i + 1]) / 3 for i in range(1, len(widths) - 1)] + [widths[-1]]
        poly = outline(pts, widths)
        d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in poly) + " Z"
        strokes.append(d)
        medians_out.append([[round(x, 1), round(y, 1)] for x, y in pts])

    target = os.path.join(BASE, "data", "chars", f"{ch}.json")
    if not os.path.exists(target + ".bak-grouper"):
        import shutil
        shutil.copyfile(target, target + ".bak-grouper")
    json.dump({"strokes": strokes, "medians": medians_out}, open(target, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{ch}: rebuilt {len(strokes)} strokes from medians")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
