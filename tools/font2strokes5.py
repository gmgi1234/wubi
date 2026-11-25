"""Stroke extraction v5: snap branch ends to junction centres, then pair by direction."""

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
SNAP = 42


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


def direction(pts, at_start, span=16):
    sub = pts[:span] if at_start else pts[-span:]
    if len(sub) < 2:
        return np.array([0.0, 0.0])
    (x0, y0), (x1, y1) = sub[0], sub[-1]
    v = np.array([x1 - x0, y1 - y0], dtype=float)
    n = np.linalg.norm(v) or 1.0
    return v / n


def pair_junction(items):
    """items: [(key, dirvec)]; return list of (keyA, keyB) matched pairs."""
    if len(items) < 2:
        return []
    k = len(items)
    best, bestscore = None, None
    # try all pairings for <= 6 items, else greedy
    if k <= 6:
        idx = list(range(k))
        def rec(rem, acc):
            nonlocal best, bestscore
            if not rem:
                score = sum(float(np.dot(items[a][1], items[b][1])) for a, b in acc)
                if bestscore is None or score < bestscore:
                    bestscore, best = score, list(acc)
                return
            a = rem[0]
            for j in rem[1:]:
                rec([x for x in rem[1:] if x != j], acc + [(a, j)])
            if len(rem) % 2 == 1:
                rec(rem[1:], acc)
        rec(idx, [])
        return [(items[a][0], items[b][0]) for a, b in (best or [])]
    pairs, used = [], set()
    cand = []
    for i in range(k):
        for j in range(i + 1, k):
            cand.append((float(np.dot(items[i][1], items[j][1])), i, j))
    cand.sort()
    for dot, i, j in cand:
        if i in used or j in used or dot > -0.1:
            continue
        used.update((i, j))
        pairs.append((items[i][0], items[j][0]))
    return pairs


def extract(ch, save=True, target=None):
    img = glyph_bitmap(ch)
    mask = img > 40
    skel = prune(skeletonize(mask))

    counts = ndimage.convolve(skel.astype(np.uint8), np.ones((3, 3)), mode="constant") - skel
    junction = skel & (counts >= 3)
    jl, jn = ndimage.label(junction, structure=np.ones((3, 3)))
    centers = ndimage.center_of_mass(junction, jl, range(1, jn + 1))
    centers = [(c[1], c[0]) for c in centers]  # (x, y)

    branch_mask = skel & ~ndimage.binary_dilation(junction, iterations=1)
    labels, n = ndimage.label(branch_mask, structure=np.ones((3, 3)))

    branches, ends_at = [], defaultdict(list)
    for i in range(1, n + 1):
        ys, xs = np.where(labels == i)
        if len(xs) < 12:
            continue
        pix = set(zip(xs.tolist(), ys.tolist()))
        ends = [p for p in pix if len(n8(p, pix)) == 1]
        if len(ends) != 2:
            continue
        path = walk(ends[0], pix)
        bi = len(branches)
        branches.append(path)
        for ei, e in enumerate((path[0], path[-1])):
            best_j, best_d = None, None
            for ji, c in enumerate(centers):
                d = math.hypot(e[0] - c[0], e[1] - c[1])
                if best_d is None or d < best_d:
                    best_j, best_d = ji, d
            if best_d is not None and best_d <= SNAP:
                ends_at[best_j].append(((bi, ei), direction(path, ei == 0)))

    partner = {}
    for ji, items in ends_at.items():
        for a, b in pair_junction(items):
            partner[a] = b
            partner[b] = a

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

    # post-merge: stitch strokes whose ends meet and continue smoothly
    for _ in range(6):
        merged = True
        while merged:
            merged = False
            ends = []
            for si, chain in enumerate(strokes):
                pts = []
                for b, f in chain:
                    p = branches[b]
                    pts.extend(p if f == 1 else p[::-1])
                ends.append((si, pts))
            for i in range(len(ends)):
                for j in range(i + 1, len(ends)):
                    si, pi = ends[i]
                    sj, pj = ends[j]
                    if si >= len(strokes) or sj >= len(strokes):
                        continue
                    for ai in (0, 1):
                        for bj in (0, 1):
                            ea = pi[0] if ai == 0 else pi[-1]
                            eb = pj[0] if bj == 0 else pj[-1]
                            if math.hypot(ea[0] - eb[0], ea[1] - eb[1]) > 34:
                                continue
                            da = direction(pi, ai == 0)
                            db = direction(pj, bj == 0)
                            if float(np.dot(da, db)) > -0.35:
                                continue
                            ca = strokes[si] if ai == 1 else [(b, 1 - f) for b, f in strokes[si][::-1]]
                            cb = strokes[sj] if bj == 0 else [(b, 1 - f) for b, f in strokes[sj][::-1]]
                            strokes[si] = ca + cb
                            del strokes[sj]
                            merged = True
                            break
                        if merged:
                            break
                    if merged:
                        break
                if merged:
                    break

    if ch == "永":
        for si in range(len(strokes)):
            for sj in range(si+1, len(strokes)):
                pa, pb = [], []
                for b, f in strokes[si]:
                    pa.extend(branches[b] if f == 1 else branches[b][::-1])
                for b, f in strokes[sj]:
                    pb.extend(branches[b] if f == 1 else branches[b][::-1])
                best = None
                for ai, ea in ((0, pa[0]), (1, pa[-1])):
                    for bj, eb in ((0, pb[0]), (1, pb[-1])):
                        d = math.hypot(ea[0]-eb[0], ea[1]-eb[1])
                        if best is None or d < best[0]:
                            best = (d, ai, bj)
                if best and best[0] < 80:
                    da = direction(pa, best[1] == 0)
                    db = direction(pb, best[2] == 0)
                    print(f"  pair {si}-{sj} dist={best[0]:.0f} dot={float(np.dot(da, db)):.2f}")
        for si, chain in enumerate(strokes):
            pts = []
            for b, f in chain:
                p = branches[b]
                pts.extend(p if f == 1 else p[::-1])
            print("  stroke", si, "n=", len(chain), "from", pts[0], "to", pts[-1], "len", len(pts))
    if target:
        while len(strokes) > target:
            best = None
            polys = []
            for chain in strokes:
                pts = []
                for b, f in chain:
                    q = branches[b]
                    pts.extend(q if f == 1 else q[::-1])
                polys.append(pts)
            for i in range(len(polys)):
                for j in range(i + 1, len(polys)):
                    for ai, ea in ((0, polys[i][0]), (1, polys[i][-1])):
                        for bj, eb in ((0, polys[j][0]), (1, polys[j][-1])):
                            gap = math.hypot(ea[0] - eb[0], ea[1] - eb[1])
                            if gap > 220:
                                continue
                            da = direction(polys[i], ai == 0)
                            db = direction(polys[j], bj == 0)
                            cost = gap + 300 * (1 + float(np.dot(da, db))) / 2
                            if best is None or cost < best[0]:
                                best = (cost, i, j, ai, bj)
            if not best:
                break
            _, i, j, ai, bj = best
            ca = strokes[i] if ai == 1 else [(b, 1 - f) for b, f in strokes[i][::-1]]
            cb = strokes[j] if bj == 0 else [(b, 1 - f) for b, f in strokes[j][::-1]]
            strokes[i] = ca + cb
            del strokes[j]

    polys = []
    for chain in strokes:
        pts = []
        for b, f in chain:
            q = branches[b]
            pts.extend(q if f == 1 else q[::-1])
        polys.append([[int(x), 900 - int(y)] for x, y in pts])
    json.dump({"polylines": polys, "chains": [[[b, f] for b, f in c] for c in strokes]},
              open(os.path.join(OUT, f"{ch}-v5.json"), "w"), ensure_ascii=False)
    print(f"{ch}: branches={len(branches)} junctions={jn} strokes={len(strokes)}")
    return branches, strokes


if __name__ == "__main__":
    for ch in sys.argv[1:] or ["王"]:
        extract(ch, target={"永":5,"王":4,"十":2,"木":4}.get(ch))







