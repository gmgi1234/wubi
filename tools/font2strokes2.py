"""Prototype v2: font glyph -> skeleton -> branches -> merge at junctions -> strokes.

Branches are merged by continuing through each junction along the smoothest path,
so a stroke that merely crosses another is not split in two.
"""

import json
import math
import os
import sys
from collections import defaultdict

import freetype
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.morphology import skeletonize

BASE = r"D:\Users\10061\Downloads\wubi"
OUT = os.path.join(BASE, "tools", "font-strokes")
os.makedirs(OUT, exist_ok=True)
SIZE = 1024
FONT = r"C:\Windows\Fonts\simkai.ttf"


def glyph_bitmap(ch):
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
    return img


def neighbours(p, pix):
    return [(p[0] + dx, p[1] + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)
            if (dx or dy) and (p[0] + dx, p[1] + dy) in pix]


def order_branch(pix):
    ends = [p for p in pix if len(neighbours(p, pix)) == 1]
    start = ends[0] if ends else next(iter(pix))
    order, seen = [start], {start}
    cur = start
    while True:
        cand = [q for q in neighbours(cur, pix) if q not in seen]
        if not cand:
            break
        nxt = cand[0]
        order.append(nxt)
        seen.add(nxt)
        cur = nxt
    return order


def direction(points, at_start, span=8):
    pts = points[:span] if at_start else points[-span:]
    if len(pts) < 2:
        return (0.0, 0.0)
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy) or 1
    return (dx / n, dy / n)


def merge_branches(branches, junctions):
    """Connect branch ends that continue smoothly through a junction."""
    jlabels, _ = ndimage.label(junctions, structure=np.ones((3, 3)))
    ends_at = defaultdict(list)
    for bi, b in enumerate(branches):
        pts = b[0]
        ends = [pts[0], pts[-1]]
        for ei, e in enumerate(ends):
            lab = 0
            for dx in (-2, -1, 0, 1, 2):
                for dy in (-2, -1, 0, 1, 2):
                    yy, xx = e[1] + dy, e[0] + dx
                    if 0 <= yy < SIZE and 0 <= xx < SIZE and jlabels[yy, xx]:
                        lab = jlabels[yy, xx]
                        break
                if lab:
                    break
            if lab:
                ends_at[lab].append((bi, ei))

    partners = {}
    for lab, items in ends_at.items():
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                a, b = items[i], items[j]
                da = branches[a[0]][2][a[1]]
                db = branches[b[0]][2][b[1]]
                dot = da[0] * db[0] + da[1] * db[1]
                if dot < -0.55:  # roughly opposite directions -> same stroke
                    partners.setdefault(a, []).append((b, -dot))
                    partners.setdefault(b, []).append((a, -dot))

    used = set()
    strokes = []
    for bi in range(len(branches)):
        if bi in used:
            continue
        chain = [(bi, 1)]
        used.add(bi)
        # extend forward from end 1, then backward from end 0
        for end in (1, 0):
            cur, cend = bi, end
            while True:
                cand = partners.get((cur, cend), [])
                nxt = None
                for (other, score) in sorted(cand, key=lambda t: -t[1]):
                    if other[0] not in used:
                        nxt = other
                        break
                if not nxt:
                    break
                used.add(nxt[0])
                if end == 1:
                    chain.append((nxt[0], 1 - nxt[1]))
                else:
                    chain.insert(0, (nxt[0], 1 - nxt[1]))
                cur, cend = nxt[0], nxt[1]
        strokes.append(chain)
    return strokes


def chain_points(chain, branches):
    pts = []
    for bi, forward in chain:
        p = branches[bi][1]
        pts.extend(p if forward else p[::-1])
    return pts


def stroke_polygon(pts, widths):
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
    return "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in poly) + " Z"


def extract(ch):
    img = glyph_bitmap(ch)
    mask = img > 40
    skel = skeletonize(mask)
    dist = ndimage.distance_transform_edt(mask)

    counts = ndimage.convolve(skel.astype(np.uint8), np.ones((3, 3)), mode="constant") - skel
    junctions = skel & (counts >= 3)
    branch_mask = skel & ~junctions
    labels, n = ndimage.label(branch_mask, structure=np.ones((3, 3)))

    branches = []
    for i in range(1, n + 1):
        ys, xs = np.where(labels == i)
        if len(xs) < 10:
            continue
        order = order_branch(set(zip(xs.tolist(), ys.tolist())))
        if len(order) < 5:
            continue
        step = max(2, len(order) // 10)
        pts = order[::step]
        if pts[-1] != order[-1]:
            pts.append(order[-1])
        d0 = direction(pts, True)
        d1 = direction(pts, False)
        branches.append((pts, pts, [d0, d1]))

    chains = merge_branches(branches, junctions)
    print(f"{ch}: branches={len(branches)} strokes={len(chains)}")

    strokes, medians = [], []
    for chain in chains:
        pts = chain_points(chain, branches)
        if len(pts) < 4:
            continue
        widths = []
        for x, y in pts:
            widths.append(max(2.5, float(dist[int(y), int(x)]) * 0.95))
        if len(widths) >= 3:
            widths = [widths[0]] + [(widths[i - 1] + widths[i] + widths[i + 1]) / 3 for i in range(1, len(widths) - 1)] + [widths[-1]]
        strokes.append(stroke_polygon(pts, widths))
        medians.append([[int(x), 900 - int(y)] for x, y in pts])

    out = {"strokes": strokes, "medians": medians}
    json.dump(out, open(os.path.join(OUT, f"{ch}.json"), "w", encoding="utf-8"), ensure_ascii=False)
    Image.fromarray((mask * 255).astype(np.uint8)).save(os.path.join(OUT, f"{ch}-bitmap.png"))


if __name__ == "__main__":
    for ch in sys.argv[1:] or ["王"]:
        extract(ch)
