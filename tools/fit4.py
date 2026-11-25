"""Fit the next batch of characters (straight 左右/上下/三分 structures)."""

import json
import re

from PIL import Image, ImageDraw, ImageFont

BASE = r"D:\Users\10061\Downloads\wubi"
FONT = r"C:\Windows\Fonts\simkai.ttf"

JOBS = {
    "鶧": ("lr", [(0, 8), (8, 19)]),
    "籿": ("lr", [(0, 6), (6, 9)]),
    "藙": ("tb", [(0, 3), (3, 18)]),
    "嶊": ("lr", [(0, 3), (3, 14)]),
    "麡": ("lr", [(0, 11), (11, 25)]),
    "蒆": ("tb3", [(0, 3), (3, 9), (9, 12)]),
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
    if direction in ("lr",):
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


def boxes_for(mask, direction):
    w, h = mask.size
    if direction == "lr":
        s = auto_split(mask, "lr")
        left = mask.crop((0, 0, s, h)).getbbox()
        right = mask.crop((s, 0, w, h)).getbbox()
        right = None if right is None else (right[0] + s, right[1], right[2] + s, right[3])
        return [left, right]
    if direction == "tb":
        s = auto_split(mask, "tb")
        top = mask.crop((0, 0, w, s)).getbbox()
        bot = mask.crop((0, s, w, h)).getbbox()
        bot = None if bot is None else (bot[0], bot[1] + s, bot[2], bot[3] + s)
        return [top, bot]
    # tb3: 三分（上、中、下）：按墨迹行谷找两条分界线
    px = mask.load()
    prof = [sum(1 for x in range(w) if px[x, y] > 0) for y in range(h)]
    thirds = [(i, prof[i]) for i in range(h // 6, 5 * h // 6)]
    thirds.sort(key=lambda t: t[1])
    cuts = sorted({thirds[0][0], thirds[1][0]})
    if cuts[1] - cuts[0] < 40:
        cuts = [h // 3, 2 * h // 3]
    a, b = cuts
    top = mask.crop((0, 0, w, a)).getbbox()
    mid = mask.crop((0, a, w, b)).getbbox()
    mid = None if mid is None else (mid[0], mid[1] + a, mid[2], mid[3] + a)
    bot = mask.crop((0, b, w, h)).getbbox()
    bot = None if bot is None else (bot[0], bot[1] + b, bot[2], bot[3] + b)
    return [top, mid, bot]


def data_bbox(medians, start, end):
    xs, ys = [], []
    for s in medians[start:end]:
        for x, y in s:
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
    open(f"{path}.bak-fit", "w", encoding="utf-8").write(open(path, encoding="utf-8").read())

    mask = kai_mask(ch)
    targets = boxes_for(mask, direction)
    print(ch, "targets", targets)

    new_strokes = list(d["strokes"])
    new_medians = list(d["medians"])
    for (start, end), target in zip(ranges, targets):
        if target is None:
            continue
        db = data_bbox(d["medians"], start, end)
        sx = (target[2] - target[0]) / max(1, db[2] - db[0])
        sy = (target[3] - target[1]) / max(1, db[3] - db[1])

        def make(sx, sy, db, target):
            def fn(x, y):
                y_img = 900 - y
                return target[0] + (x - db[0]) * sx, 900 - (target[1] + (y_img - db[1]) * sy)
            return fn

        fn = make(sx, sy, db, target)
        for idx in range(start, end):
            new_strokes[idx] = transform_numbers(d["strokes"][idx], fn)
            new_medians[idx] = [[round(fn(x, y)[0], 1), round(fn(x, y)[1], 1)] for x, y in d["medians"][idx]]

    json.dump({"strokes": new_strokes, "medians": new_medians, "boost": 5},
              open(path, "w", encoding="utf-8"), ensure_ascii=False)
    print(ch, "fitted")
