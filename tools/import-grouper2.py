"""Rebuild strokes from a grouper export by matching skeleton branches to each stroke,
chaining them with bridged gaps, then generating clean outlines."""

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


def seg_dist(p, a, b):
    ax, ay = a
    bx, by = b
    px, py = p
    vx, vy = bx - ax, by - ay
    L2 = vx * vx + vy * vy
    if L2 == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * vx + (py - ay) * vy) / L2))
    return math.hypot(px - (ax + t * vx), py - (ay + t * vy))


def poly_dist(p, poly):
    return min(seg_dist(p, poly[i], poly[i + 1]) for i in range(len(poly) - 1)) if len(poly) > 1 else 999


def smooth(points, window=5):
    if len(points) < window:
        return points
    half = window // 2
    out = []
    for i in range(len(points)):
        seg = points[max(0, i - half):min(len(points), i + half + 1)]
        out.append([sum(p[0] for p in seg) / len(seg), sum(p[1] for p in seg) / len(seg)])
    return out


def simplify(pts, eps=1.5):
    if len(pts) < 3:
        return pts

    def rdp(p):
        if len(p) < 3:
            return p
        (x1, y1), (x2, y2) = p[0], p[-1]
        dmax, idx = 0.0, 0
        for i in range(1, len(p) - 1):
            x0, y0 = p[i]
            num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
            den = math.hypot(y2 - y1, x2 - x1) or 1
            d = num / den
            if d > dmax:
                dmax, idx = d, i
        if dmax > eps:
            return rdp(p[:idx + 1])[:-1] + rdp(p[idx:])
        return [p[0], p[-1]]

    return rdp(pts)


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
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        normals.append((nx, ny))
        r = widths[i]
        left.append((x + nx * r, y + ny * r))
        right.append((x - nx * r, y - ny * r))

    def cap(center, normal, r, fwd):
        a0 = math.atan2(normal[1], normal[0])
        return [(center[0] + math.cos(a0 + math.pi * k / cap_steps * fwd) * r,
                 center[1] + math.sin(a0 + math.pi * k / cap_steps * fwd) * r) for k in range(1, cap_steps)]

    poly = left + cap(pts[-1], normals[-1], widths[-1], 1) + right[::-1] + cap(pts[0], normals[0], widths[0], -1)
    return poly


def bridge(a, b, step=6.0):
    d = math.hypot(b[0] - a[0], b[1] - a[1])
    n = max(1, int(d / step))
    return [[a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n] for k in range(1, n)]


def main(src, ch):
    export = json.load(open(src, encoding="utf-8"))
    branches = json.load(open(os.path.join(BASE, "tools", "font-strokes", f"{ch}-branches.json"), encoding="utf-8"))["branches"]
    mask = glyph_mask(ch)
    dist = ndimage.distance_transform_edt(mask)

    strokes, medians_out = [], []
    for st in export["strokes"]:
        target = [[float(x), float(y)] for x, y in st["medians"]]
        # pick branches whose points mostly lie near this stroke
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
        chosen = []
        for bi, cnt in sorted(votes.items(), key=lambda t: -t[1]):
            if cnt >= 2:
                chosen.append([[float(x), float(y)] for x, y in branches[bi]["pts"]])
        if not chosen:
            chosen = [target]
        # chain branches: start with the one nearest to the stroke start
        chosen.sort(key=lambda pts: min(math.hypot(pts[0][0] - target[0][0], pts[0][1] - target[0][1]),
                                        math.hypot(pts[-1][0] - target[0][0], pts[-1][1] - target[0][1])))
        chain = chosen[0][:]
        rest = chosen[1:]
        while rest:
            end = chain[-1]
            best = None
            for i, pts in enumerate(rest):
                for rev in (False, True):
                    p = pts[::-1] if rev else pts
                    d = math.hypot(p[0][0] - end[0], p[0][1] - end[1])
                    if best is None or d < best[0]:
                        best = (d, i, rev)
            _, i, rev = best
            pts = rest.pop(i)
            if rev:
                pts = pts[::-1]
            chain += bridge(chain[-1], pts[0]) + pts
        chain = smooth(chain, 7)
        chain = simplify(chain, 2.0)
        widths = []
        for x, y in chain:
            row = min(SIZE - 1, max(0, int(round(900 - y))))
            col = min(SIZE - 1, max(0, int(round(x))))
            widths.append(max(2.5, float(dist[row, col])))
        if len(widths) >= 3:
            widths = [widths[0]] + [(widths[i - 1] + widths[i] + widths[i + 1]) / 3 for i in range(1, len(widths) - 1)] + [widths[-1]]
        poly = outline(chain, widths)
        strokes.append("M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in poly) + " Z")
        medians_out.append([[round(x, 1), round(y, 1)] for x, y in chain])

    target_path = os.path.join(BASE, "data", "chars", f"{ch}.json")
    if not os.path.exists(target_path + ".bak-grouper"):
        shutil.copyfile(target_path, target_path + ".bak-grouper")
    json.dump({"strokes": strokes, "medians": medians_out}, open(target_path, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{ch}: rebuilt {len(strokes)} strokes")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

