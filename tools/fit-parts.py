"""Fit each component of a character to its KaiTi counterpart.

For 左右 characters the split is a vertical gap column; for 上下 it is a
horizontal gap row. Each component's strokes are scaled/translated so its
bounding box lands on the KaiTi component box.
"""

import json
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont

BASE = r"D:\Users\10061\Downloads\wubi"
FONT = r"C:\Windows\Fonts\simkai.ttf"
OUT = os.path.join(BASE, "tools", "fit")
os.makedirs(OUT, exist_ok=True)

# char -> (direction, [(start, end), ...]) stroke ranges in data order
JOBS = {
    "馺": ("lr", [(0, 10), (10, 13)]),
    "坘": ("lr", [(0, 3), (3, 7)]),
    "菓": ("tb", [(0, 3), (3, 11)]),
}


def kai_mask(ch):
    img = Image.new("L", (1024, 1024), 255)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, 900)
    box = draw.textbbox((0, 0), ch, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text(((1024 - w) / 2 - box[0], (1024 - h) / 2 - box[1]), ch, font=font, fill=0)
    return img.point(lambda v: 0 if v > 200 else 255)


def split_kai(mask, direction):
    w, h = mask.size
    px = mask.load()
    if direction == "lr":
        best, bestx = None, None
        for x in range(w // 3, 2 * w // 3):
            ink = sum(1 for y in range(h) if px[x, y] > 0)
            if best is None or ink < best:
                best, bestx = ink, x
        left = mask.crop((0, 0, bestx, h)).getbbox()
        right = mask.crop((bestx, 0, w, h)).getbbox()
        right = (right[0] + bestx, right[1], right[2] + bestx, right[3])
        return [left, right], bestx, None
    best, besty = None, None
    for y in range(h // 3, 2 * h // 3):
        ink = sum(1 for x in range(w) if px[x, y] > 0)
        if best is None or ink < best:
            best, besty = ink, y
    top = mask.crop((0, 0, w, besty)).getbbox()
    bot = mask.crop((0, besty, w, h)).getbbox()
    bot = (bot[0], bot[1] + besty, bot[2], bot[3] + besty)
    return [top, bot], None, besty


def data_part_bbox(strokes, medians, start, end):
    xs, ys = [], []
    for stroke in medians[start:end]:
        for x, y in stroke:
            xs.append(x)
            ys.append(900 - y)  # data y is up, image y is down
    return (min(xs), min(ys), max(xs), max(ys))


def transform_numbers(path, fn):
    out = []
    nums = []
    tokens = re.findall(r"[MQLCZ]|-?\d+(?:\.\d+)?", path)
    i = 0
    buf = []
    for tok in tokens:
        if tok.isalpha():
            if tok in "MLQC":
                out.append(tok)
                buf = []
            else:  # Z
                out.append(tok)
            continue
        buf.append(float(tok))
        if len(buf) == 2:
            x, y = fn(buf[0], buf[1])
            out.append(f"{x:.1f}")
            out.append(f"{y:.1f}")
            buf = []
    return " ".join(out)


for ch, (direction, ranges) in JOBS.items():
    src = os.path.join(BASE, "data", "chars", f"{ch}.json")
    d = json.load(open(src, encoding="utf-8"))
    mask = kai_mask(ch)
    kb, split_x, split_y = split_kai(mask, direction)

    new_strokes = list(d["strokes"])
    new_medians = list(d["medians"])
    for (start, end), target in zip(ranges, kb):
        if target is None:
            continue
        db = data_part_bbox(d["strokes"], d["medians"], start, end)
        dw, dh = max(1, db[2] - db[0]), max(1, db[3] - db[1])
        tw, th = max(1, target[2] - target[0]), target[3] - target[1]
        sx, sy = tw / dw, th / dh
        # data (x, y_up) -> image (x, 900-y) -> target image -> back to data
        def make(sx, sy, db, target):
            def fn(x, y):
                y_img = 900 - y
                nx = target[0] + (x - db[0]) * sx
                ny_img = target[1] + (y_img - db[1]) * sy
                return nx, 900 - ny_img
            return fn
        fn = make(sx, sy, db, target)
        for idx in range(start, end):
            new_strokes[idx] = transform_numbers(d["strokes"][idx], fn)
            new_medians[idx] = [[round(fn(x, y)[0], 1), round(fn(x, y)[1], 1)] for x, y in d["medians"][idx]]

    fitted = {"strokes": new_strokes, "medians": new_medians}
    json.dump(fitted, open(os.path.join(OUT, f"{ch}.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{ch}: split={'x' if split_x else 'y'}={split_x or split_y} kai parts={kb}")

