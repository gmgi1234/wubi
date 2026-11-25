"""Import grouper export v4: build stroke outlines from a rasterised centreline
(draw disks along the path, then trace the contour) — no self-intersections/seams.
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


def glyph_mask(ch):
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
    return img > 40


def unit(v):
    n = math.hypot(v[0], v[1]) or 1.0
    return (v[0] / n, v[1] / n)


def dir_at(pts, end, span=10):
    seg = pts[:span] if end == 0 else pts[-span:]
    return unit((seg[-1][0] - seg[0][0], seg[-1][1] - seg[0][1])) if len(seg) > 1 else (0.0, 0.0)


def bridge(a, b, step=4.0):
    d = math.hypot(b[0] - a[0], b[1] - a[1])
    n = max(1, int(d / step))
    return [[a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n] for k in range(1, n)]


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
    out = []
    for i in range(len(pts)):
        seg = pts[max(0, i - half):min(len(pts), i + half + 1)]
        out.append([sum(p[0] for p in seg) / len(seg), sum(p[1] for p in seg) / len(seg)])
    return out


def raster_outline(pts, widths, tol=1.6):
    img = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(img)
    for (x, y), r in zip(pts, widths):
        row = 900 - y
        draw.ellipse([x - r, row - r, x + r, row + r], fill=255)
    arr = np.array(img) > 127
    contours = measure.find_contours(arr.astype(float), 0.5)
    if not contours:
        return None
    c = max(contours, key=len)
    poly = measure.approximate_polygon(c, tolerance=tol)
    # (row, col) -> data coords (x, 900 - row)
    pts_out = [[float(col), 900.0 - float(row)] for row, col in poly]
    return pts_out


def main(src, ch):
    export = json.load(open(src, encoding="utf-8"))
    branches = json.load(open(os.path.join(BASE, "tools", "font-strokes", f"{ch}-branches.json"), encoding="utf-8"))["branches"]
    mask = glyph_mask(ch)
    dist = ndimage.distance_transform_edt(mask)

    strokes, medians_out = [], []
    for st in export["strokes"]:
        target = [[float(x), float(y)] for x, y in st["medians"]]
        votes = {}
        for p in target:
            best = None
            for bi, b in enumerate(branches):
                for q in b["pts"]:
                    d = math.hypot(p[0] - q[0], p[1] - q[1])
                    if best is None or d < best[0]:
                        best = (d, bi)
            if best and best[0] < 6:
                votes[best[1]] = votes.get(best[1], 0) + 1
        ids = [bi for bi, cnt in votes.items() if cnt >= 2]
        if not ids:
            ids = [max(votes, key=votes.get)] if votes else list(range(len(branches)))

        pool = {bi: [[float(x), float(y)] for x, y in branches[bi]["pts"]] for bi in ids}
        start_bi = min(pool, key=lambda bi: min(math.hypot(pool[bi][0][0] - target[0][0], pool[bi][0][1] - target[0][1]),
                                                math.hypot(pool[bi][-1][0] - target[0][0], pool[bi][-1][1] - target[0][1])))
        first = pool.pop(start_bi)
        if math.hypot(first[-1][0] - target[0][0], first[-1][1] - target[0][1]) < math.hypot(first[0][0] - target[0][0], first[0][1] - target[0][1]):
            first = first[::-1]
        chain = first[:]

        while pool:
            end = chain[-1]
            d_out = dir_at(chain, 1)
            best = None
            for bi, pts in pool.items():
                for rev in (False, True):
                    p = pts[::-1] if rev else pts
                    gap = math.hypot(p[0][0] - end[0], p[0][1] - end[1])
                    dot = d_out[0] * dir_at(p, 0)[0] + d_out[1] * dir_at(p, 0)[1]
                    cost = gap + 120 * (1 - dot)
                    if best is None or cost < best[0]:
                        best = (cost, bi, rev)
            _, bi, rev = best
            pts = pool.pop(bi)
            if rev:
                pts = pts[::-1]
            chain += bridge(chain[-1], pts[0]) + pts

        chain = resample(chain, 3.0)
        chain = smooth(chain, 11)
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
            w2[i] = min(w2[i], w2[i - 1] + lim)
            w2[i] = max(w2[i], w2[i - 1] - lim)

        poly = raster_outline(chain, w2)
        if not poly:
            continue
        strokes.append("M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in poly) + " Z")
        medians_out.append([[round(x, 1), round(y, 1)] for x, y in chain])

    target_path = os.path.join(BASE, "data", "chars", f"{ch}.json")
    if not os.path.exists(target_path + ".bak-grouper"):
        shutil.copyfile(target_path, target_path + ".bak-grouper")
    json.dump({"strokes": strokes, "medians": medians_out}, open(target_path, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{ch}: rebuilt {len(strokes)} strokes (raster outline)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
