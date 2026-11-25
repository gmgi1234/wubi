"""Dump skeleton branches (polyline + width) for one character, for the grouping tool."""

import json
import math
import os
import sys

import freetype
import numpy as np
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


def prune(skel, max_len=26):
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


def main(ch):
    img = glyph_bitmap(ch)
    mask = img > 40
    skel = prune(skeletonize(mask))
    dist = ndimage.distance_transform_edt(mask)
    counts = ndimage.convolve(skel.astype(np.uint8), np.ones((3, 3)), mode="constant") - skel
    junction = skel & (counts >= 3)
    branch_mask = skel & ~ndimage.binary_dilation(junction, iterations=1)
    labels, n = ndimage.label(branch_mask, structure=np.ones((3, 3)))

    out = []
    for i in range(1, n + 1):
        ys, xs = np.where(labels == i)
        if len(xs) < 12:
            continue
        pix = set(zip(xs.tolist(), ys.tolist()))
        ends = [p for p in pix if len(n8(p, pix)) == 1]
        if len(ends) != 2:
            continue
        path = walk(ends[0], pix)
        step = max(1, len(path) // 24)
        pts = path[::step]
        if pts[-1] != path[-1]:
            pts.append(path[-1])
        out.append({
            "id": len(out),
            "pts": [[round(float(x), 1), round(900 - float(y), 1)] for x, y in pts],
            "w": [round(float(dist[y, x]) * 2, 1) for x, y in pts],
            "len": len(path),
        })

    json.dump({"char": ch, "branches": out}, open(os.path.join(OUT, f"{ch}-branches.json"), "w", encoding="utf-8"),
              ensure_ascii=False)
    print(ch, "branches:", len(out))


if __name__ == "__main__":
    for c in sys.argv[1:] or ["永"]:
        main(c)
