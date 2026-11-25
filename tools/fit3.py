"""Fit the remaining seven characters to their KaiTi part boxes (auto split)."""

import json
import re

from PIL import Image, ImageDraw, ImageFont

BASE = r"D:\Users\10061\Downloads\wubi"
FONT = r"C:\Windows\Fonts\simkai.ttf"

JOBS = {
    "贠": ("tb", [(0, 2), (2, 6)]),
    "幋": ("tb", [(0, 10), (10, 13)]),
    "燊": ("tb", [(0, 12), (12, 16)]),
    "凅": ("lr", [(0, 2), (2, 10)]),
    "脮": ("lr", [(0, 4), (4, 11)]),
    "秎": ("lr", [(0, 5), (5, 9)]),
    "镠": ("lr", [(0, 5), (5, 16)]),
}


def kai_mask(ch):
    img = Image.new("L", (1024, 1024), 255)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, 900)
    box = draw.textbbox((0, 0), ch, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text(((1024 - w) / 2 - box[0], (1024 - h) / 2 - box[1]), ch, font=font, fill=0)
    return img.point(lambda v: 0 if v > 200 else 255)


def auto_split(mask, direction):
    px = mask.load()
    w, h = mask.size
    if direction == "lr":
        best, at = None, None
        for x in range(w // 3, 2 * w // 3):
            ink = sum(1 for y in range(h) if px[x, y] > 0)
            if best is None or ink < best:
                best, at = ink, x
        return at
    best, at = None, None
    for y in range(h // 3, 2 * h // 3):
        ink = sum(1 for x in range(w) if px[x, y] > 0)
        if best is None or ink < best:
            best, at = ink, y
    return at


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


for ch, (direction, ranges) in JOBS.items():
    path = f"{BASE}/data/chars/{ch}.json"
    d = json.load(open(path, encoding="utf-8"))
    if "boost" in d and len(d.get("_fitted", [])) == d["strokes"].__len__():
        pass
    fs_backup = f"{path}.bak-fit"
    open(fs_backup, "w", encoding="utf-8").write(open(path, encoding="utf-8").read())

    mask = kai_mask(ch)
    split = auto_split(mask, direction)
    boxes = part_boxes(mask, direction, split)
    print(ch, "split", split, "boxes", boxes)

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
    print(ch, "fitted, scale", round(sx, 2), round(sy, 2))
