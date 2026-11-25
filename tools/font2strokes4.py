"""Stroke extraction v4: pair branch ends by proximity + direction continuity."""

import glob
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


def n8(p, pix):
    return [(p[0] + dx, p[1] + dy) for dx, dy in NB8 if (p[0] + dx, p[1] + dy) in pix]


def prune(skel, max_len=30):
    pix = set(map(tuple, np.argwhere(skel)))
    for p in list(pix):
        if len(n8(p, pix)) != 1:
            continue
        path, prev, cur = [p], None, p
        while len(path) <= max_len:
            cand = [q for q in n8(cur, pix) if q != prev]
            if len(cand) != 1:
                break
            prev, cur = cur, cand[0]
            path.append(cur)
        if len(path) <= max_len and len(n8(cur, pix)) > 2:
            for q in path[:-1]:
                skel[q[1], q[0]] = False
    return skel


def walk(start, pix):
    path, seen = [start], {start}
    cur = start
    while True:
        cand = [q for q in n8(cur, pix) if q not in seen]
        if not cand:
            break
        cand.sort(key=lambda q: abs(q[0] - cur[0]) + abs(q[1] - cur[1]))
        nxt = cand[0]
        path.append(nxt)
        seen.add(nxt)
        cur = nxt
    return path


def direction(pts, at_start, span=14):
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
    skel = prune(skeletonize(mask))

    counts = ndimage.convolve(skel.astype(np.uint8), np.ones((3, 3)), mode="constant") - skel
    junction = skel & (counts >= 3)
    branch_mask = skel & ~junction
    labels, n = ndimage.label(branch_mask, structure=np.ones((3, 3)))

    branches = []
    for i in range(1, n + 1):
        ys, xs = np.where(labels == i)
        if len(xs) < 10:
            continue
        pix = set(zip(xs.tolist(), ys.tolist()))
        ends = [p for p in pix if len(n8(p, pix)) == 1]
        if len(ends) != 2:
            continue
        path = walk(ends[0], pix)
        if len(path) < 5 or path[-1] != ends[1] and len(path) < 5:
            pass
        branches.append(path)

    # pair ends: close in space + directions roughly opposite
    ends = []
    for bi, path in enumerate(branches):
        for ei, p in enumerate((path[0], path[-1])):
            ends.append((bi, ei, np.array(p, dtype=float), direction(path, ei == 0)))

    partner = {}
    cand = []
    for i in range(len(ends)):
        for j in range(i + 1, len(ends)):
            a, b = ends[i], ends[j]
            if a[0] == b[0]:
                continue
            dist = float(np.linalg.norm(a[2] - b[2]))
            if dist > 12:
                continue
            # a's outward direction is "away from a"; continuation means b is roughly opposite
            dot = float(np.dot(a[3], b[3]))
            score = dist * 0.5 + (dot + 1.0)  # prefer close & aligned
            cand.append((score, i, j))
    cand.sort(key=lambda t: t[0])
    used = set()
    for score, i, j in cand:
        if i in used or j in used:
            continue
        a, b = ends[i], ends[j]
        if float(np.dot(a[3], b[3])) > 0.1:
            continue
        used.update((i, j))
        partner[(a[0], a[1])] = (b[0], b[1])
        partner[(b[0], b[1])] = (a[0], a[1])

    visited, strokes = set(), []
    starts = [(bi, ei) for bi in range(len(branches)) for ei in (0, 1) if (bi, ei) not in partner]
    for start in starts:
        if start[0] in visited:
            continue
        chain, cur, cend = [], start[0], start[1]
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
    for bi in range(len(branches)):
        if bi not in visited:
            strokes.append([(bi, 1)])

    total = sum(len(branches[b]) for b, _ in (c for s in strokes for c in s))
    print(f"{ch}: branches={len(branches)} pairs={len(partner)//2} strokes={len(strokes)}")
    return branches, strokes


if __name__ == "__main__":
    for ch in sys.argv[1:] or ["王"]:
        extract(ch)

