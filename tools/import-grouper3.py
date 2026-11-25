"""Import grouper export v3: curvature-aware fragment ordering + smoothed widths."""

import json
import math
import os
import shutil
import sys

import freetype
import numpy as np
from scipy import ndimage

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


def resample(pts, step=4.0):
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


def outline(pts, widths, cap_steps=8):
    n = len(pts)
    left, right, normals = [], [], []
    for i, (x, y) in enumerate(pts):
        if i == 0:
            dx, dy = pts[1][0] - x, pts[1][1] - y
        elif i == n - 1:
            dx, dy = x - pts[-2][0], y - pts[-2][1]
        else:
            dx, dy = pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]
        nx, ny = unit((-dy, dx))
        normals.append((nx, ny))
        r = widths[i]
        left.append((x + nx * r, y + ny * r))
        right.append((x - nx * r, y - ny * r))

    def cap(c, normal, r, fwd):
        a0 = math.atan2(normal[1], normal[0])
        return [(c[0] + math.cos(a0 + math.pi * k / cap_steps * fwd) * r,
                 c[1] + math.sin(a0 + math.pi * k / cap_steps * fwd) * r) for k in range(1, cap_steps)]

    return left + cap(pts[-1], normals[-1], widths[-1], 1) + right[::-1] + cap(pts[0], normals[0], widths[0], -1)


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
        ids = [bi for bi, cnt in votes.items() if cnt >= 2] or [max(votes, key=votes.get)] if votes else []
        if not ids:
            ids = list(range(len(branches)))

        pool = {bi: [[float(x), float(y)] for x, y in branches[bi]["pts"]] for bi in ids}
        # start with the fragment whose endpoint is closest to the stroke start
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
                    d_in = dir_at(p, 0)
                    dot = d_out[0] * d_in[0] + d_out[1] * d_in[1]
                    cost = gap + 120 * (1 - dot)   # reward continuing in the same direction
                    if best is None or cost < best[0]:
                        best = (cost, bi, rev)
            _, bi, rev = best
            pts = pool.pop(bi)
            if rev:
                pts = pts[::-1]
            chain += bridge(chain[-1], pts[0]) + pts

        chain = resample(chain, 4.0)
        chain = smooth(chain, 9)
        widths = []
        for x, y in chain:
            row = min(SIZE - 1, max(0, int(round(900 - y))))
            col = min(SIZE - 1, max(0, int(round(x))))
            widths.append(max(2.5, float(dist[row, col])))
        # median filter then limit the rate of change
        w2 = widths[:]
        for i in range(2, len(widths) - 2):
            w2[i] = sorted(widths[i - 2:i + 3])[2]
        for i in range(1, len(w2)):
            lim = 0.12 * max(2.5, w2[i - 1])
            if w2[i] > w2[i - 1] + lim:
                w2[i] = w2[i - 1] + lim
            elif w2[i] < w2[i - 1] - lim:
                w2[i] = max(2.0, w2[i - 1] - lim)

        poly = outline(chain, w2)
        strokes.append("M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in poly) + " Z")
        medians_out.append([[round(x, 1), round(y, 1)] for x, y in chain])

    target_path = os.path.join(BASE, "data", "chars", f"{ch}.json")
    if not os.path.exists(target_path + ".bak-grouper"):
        shutil.copyfile(target_path, target_path + ".bak-grouper")
    json.dump({"strokes": strokes, "medians": medians_out}, open(target_path, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{ch}: rebuilt {len(strokes)} strokes")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
