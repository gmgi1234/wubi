"""Stroke extraction v3: skeleton graph + junction pairing by direction.

Goal: 王 -> 4 strokes, 永 -> 5 strokes.
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
NB8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


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


def neighbours4(p, pix):
    return [(p[0] + dx, p[1] + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            if (p[0] + dx, p[1] + dy) in pix]


def neighbours8(p, pix):
    return [(p[0] + dx, p[1] + dy) for dx, dy in NB8 if (p[0] + dx, p[1] + dy) in pix]


def prune_spurs(skel, max_len=12):
    skel = skel.copy()
    for _ in range(3):
        changed = False
        pix = set(map(tuple, np.argwhere(skel)))
        for p in list(pix):
            nb = neighbours8(p, pix)
            if len(nb) == 1:  # endpoint: walk until junction
                path = [p]
                cur, prev = p, None
                while len(path) <= max_len:
                    cand = [q for q in neighbours8(cur, pix) if q != prev]
                    if len(cand) != 1:
                        break
                    prev, cur = cur, cand[0]
                    path.append(cur)
                if len(path) <= max_len and len(neighbours8(cur, pix)) > 2:
                    for q in path[:-1]:
                        skel[q[1], q[0]] = False
                    changed = True
        if not changed:
            break
    return skel


def order_path(start, pix):
    path, seen = [start], {start}
    cur, prev = start, None
    while True:
        cand = [q for q in neighbours8(cur, pix) if q not in seen]
        if not cand:
            break
        # prefer 4-neighbours to keep the line tidy
        cand.sort(key=lambda q: (abs(q[0] - cur[0]) + abs(q[1] - cur[1])))
        nxt = cand[0]
        path.append(nxt)
        seen.add(nxt)
        prev, cur = cur, nxt
    return path


def direction(pts, at_start, span=12):
    sub = pts[:span] if at_start else pts[-span:]
    if len(sub) < 2:
        return np.array([0.0, 0.0])
    (x0, y0), (x1, y1) = sub[0], sub[-1]
    v = np.array([x1 - x0, y1 - y0], dtype=float)
    n = np.linalg.norm(v) or 1.0
    return v / n


def extract(ch):
    img = glyph_bitmap(ch)
    mask = img > 40
    skel = prune_spurs(skeletonize(mask))

    counts = ndimage.convolve(skel.astype(np.uint8), np.ones((3, 3)), mode="constant") - skel
    junction = skel & (counts >= 3)
    branch_mask = skel & ~junction
    labels, n = ndimage.label(branch_mask, structure=np.ones((3, 3)))

    branches = {}
    ends_by_junction = defaultdict(list)
    junction2 = ndimage.binary_dilation(junction, iterations=2)
    jlabels, jn = ndimage.label(junction2, structure=np.ones((3, 3)))

    for i in range(1, n + 1):
        ys, xs = np.where(labels == i)
        if len(xs) < 8:
            continue
        pix = set(zip(xs.tolist(), ys.tolist()))
        ends = [p for p in pix if len(neighbours8(p, pix)) == 1]
        if len(ends) < 2:
            continue
        a = ends[0]
        path = order_path(a, pix)
        if len(path) < 4:
            continue
        branches[i] = path
        for ei, e in enumerate((path[0], path[-1])):
            jl = 0
            for dx in range(-2, 3):
                for dy in range(-2, 3):
                    xx, yy = e[0] + dx, e[1] + dy
                    if 0 <= yy < SIZE and 0 <= xx < SIZE and jlabels[yy, xx]:
                        jl = jlabels[yy, xx]
                        break
                if jl:
                    break
            if jl:
                d = direction(path, ei == 0)
                ends_by_junction[jl].append((i, ei, d))

    # pair branch ends at each junction: best continuation = most opposite directions
    partner = {}
    for jl, items in ends_by_junction.items():
        used = set()
        pairs = []
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                if i in used or j in used:
                    continue
                a, b = items[i], items[j]
                if a[0] == b[0]:
                    continue
                pairs.append((float(np.dot(a[2], b[2])), i, j))
        pairs.sort(key=lambda t: t[0])  # most negative dot first
        for dot, i, j in pairs:
            if i in used or j in used:
                continue
            if dot > -0.35:  # not a continuation
                continue
            used.update((i, j))
            a, b = items[i], items[j]
            partner[(a[0], a[1])] = (b[0], b[1])
            partner[(b[0], b[1])] = (a[0], a[1])

    # walk strokes
    visited = set()
    strokes = []
    starts = []
    for bi in branches:
        for ei in (0, 1):
            if (bi, ei) not in partner:
                starts.append((bi, ei))
    for start in starts:
        if start[0] in visited:
            continue
        chain = []
        cur, cend = start
        while True:
            if cur in visited:
                break
            visited.add(cur)
            chain.append((cur, 1 if cend == 0 else -1))
            nxt = partner.get((cur, 1 - cend))
            if not nxt or nxt[0] in visited:
                break
            cur, cend = nxt
        strokes.append(chain)
    # closed loops / missed branches
    for bi in branches:
        if bi not in visited:
            strokes.append([(bi, 1)])

    print(f"{ch}: junction_n={jn} branches={len(branches)} strokes={len(strokes)} "
          f"lens={[sum(len(branches[b]) for b, _ in c) for c in strokes]}")
    return branches, strokes


if __name__ == "__main__":
    for ch in sys.argv[1:] or ["王"]:
        extract(ch)

