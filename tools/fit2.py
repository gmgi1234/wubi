"""Fit parts with explicit split lines for 菓 (上下) and 坘 (左右)."""

import json
import re

from PIL import Image, ImageDraw, ImageFont

BASE = r"D:\Users\10061\Downloads\wubi"
FONT = r"C:\Windows\Fonts\simkai.ttf"

JOBS = {
    # char: (direction, split, [(start, end), ...])
    "菓": ("tb", 280, [(0, 3), (3, 11)]),
    "坘": ("lr", 350, [(0, 3), (3, 7)]),
}


def kai_mask(ch):
    img = Image.new("L", (1024, 1024), 255)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, 900)
    box = draw.textbbox((0, 0), ch, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text(((1024 - w) / 2 - box[0], (1024 - h) / 2 - box[1]), ch, font=font, fill=0)
    return img.point(lambda v: 0 if v > 200 else 255)


def part_boxes(mask, direction, split):
    w, h = mask.size
    if direction == "lr":
        left = mask.crop((0, 0, split, h)).getbbox()
        right = mask.crop((split, 0, w, h)).getbbox()
        right = None if right is None else (right[0] + split, right[1], right[2] + split, right[3])
        return [left, right]
    top = mask.crop((0, 0, w, split)).getbbox()
    bot = mask.crop((0, split, w, h)).getbbox()
    bot = None if bot is None else (bot[0], bot[1] + split, bot[2], bot[3] + split)
    return [top, bot]


def data_bbox(medians, start, end):
    xs, ys = [], []
    for stroke in medians[start:end]:
        for x, y in stroke:
            xs.append(x)
            ys.append(900 - y)
    return (min(xs), min(ys), max(xs), max(ys))


def transform_numbers(path, fn):
    out = []
    tokens = re.findall(r"[MQLCZ]|-?\d+(?:\.\d+)?", path)
    buf = []
    for tok in tokens:
        if tok.isalpha():
            out.append(tok)
            buf = []
            continue
        buf.append(float(tok))
        if len(buf) == 2:
            x, y = fn(buf[0], buf[1])
            out.append(f"{x:.1f}")
            out.append(f"{y:.1f}")
            buf = []
    return " ".join(out)


for ch, (direction, split, ranges) in JOBS.items():
    path = f"{BASE}/data/chars/{ch}.json"
    d = json.load(open(path, encoding="utf-8"))
    mask = kai_mask(ch)
    boxes = part_boxes(mask, direction, split)
    print(ch, "kai parts", boxes)

    new_strokes = list(d["strokes"])
    new_medians = list(d["medians"])
    for (start, end), target in zip(ranges, boxes):
        if target is None:
            continue
        db = data_bbox(d["medians"], start, end)
        sx = (target[2] - target[0]) / max(1, db[2] - db[0])
        sy = (target[3] - target[1]) / max(1, db[3] - db[1])

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

    out = {"strokes": new_strokes, "medians": new_medians, "boost": 5}
    json.dump(out, open(path, "w", encoding="utf-8"), ensure_ascii=False)
    print(ch, "fitted", len(new_strokes), "strokes, scale", round(sx, 2), round(sy, 2))

