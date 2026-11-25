"""Score characters that lack site codes by how close their strokes are to KaiTi."""

import json
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFont

BASE = r"D:\Users\10061\Downloads\wubi"
FONT = r"C:\Windows\Fonts\simkai.ttf"
DICT = r"D:\Users\10061\Downloads\Hermes\五笔码表\86\wubi.dict.yaml"

tables = json.load(open(os.path.join(BASE, "tools", "tables.json"), encoding="utf-8"))
coded = set(tables["v86"])

rime = {}
for line in open(DICT, encoding="utf-8"):
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 2:
        continue
    ch, code = parts[0].strip(), parts[1].strip()
    if not (1 <= len(code) <= 4) or not code.isalpha():
        continue
    if len(ch) == 1 and ch not in rime:
        rime[ch] = code

files = [f[:-5] for f in os.listdir(os.path.join(BASE, "data", "chars")) if f.endswith(".json")]
extras = [c for c in files if c not in coded and c in rime and "\u4e00" <= c <= "\u9fff"]

random.seed(20261122)
sample = random.sample(extras, min(500, len(extras)))
print("extras:", len(extras), "sampled:", len(sample))


def kai_bbox(ch):
    img = Image.new("L", (1024, 1024), 255)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, 900)
    box = draw.textbbox((0, 0), ch, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text(((1024 - w) / 2 - box[0], (1024 - h) / 2 - box[1]), ch, font=font, fill=0)
    return img.point(lambda v: 0 if v > 200 else 255).getbbox()


def data_bbox(ch):
    d = json.load(open(os.path.join(BASE, "data", "chars", f"{ch}.json"), encoding="utf-8"))
    xs, ys = [], []
    for stroke in d["medians"]:
        for x, y in stroke:
            xs.append(x)
            ys.append(y)
    return (min(xs), 900 - max(ys), max(xs), 900 - min(ys))


rows = []
for ch in sample:
    try:
        k = kai_bbox(ch)
        d = data_bbox(ch)
    except Exception:
        continue
    kw, kh = k[2] - k[0], k[3] - k[1]
    dw, dh = d[2] - d[0], d[3] - d[1]
    if kw < 200 or kh < 200:
        continue
    wr, hr = dw / kw, dh / kh
    cx = ((d[0] + d[2]) - (k[0] + k[2])) / 2
    cy = ((d[1] + d[3]) - (k[1] + k[3])) / 2
    score = abs(wr - 1) + abs(hr - 1) + abs(cx) / 150 + abs(cy) / 150
    rows.append((score, ch, round(wr, 2), round(hr, 2), round(cx), round(cy)))

rows.sort()
print("best 40:")
for r in rows[:40]:
    print(f"  {r[1]}  code={rime[r[1]]:<5} ratio={r[2]}x{r[3]}  shift={r[4]},{r[5]}  score={r[0]:.3f}")
json.dump([{"ch": r[1], "code": rime[r[1]], "score": r[0]} for r in rows[:60]],
          open(os.path.join(BASE, "tools", "good-extras.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
