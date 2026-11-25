"""Pick 10 more characters to fix: varied IDS structure, strokes close to KaiTi."""

import json
import os
import random
import re

from PIL import Image, ImageDraw, ImageFont

BASE = r"D:\Users\10061\Downloads\wubi"
FONT = r"C:\Windows\Fonts\simkai.ttf"
IDS = os.path.join(BASE, "tools", "ids.txt")
DICT = r"D:\Users\10061\Downloads\Hermes\五笔码表\86\wubi.dict.yaml"

tables = json.load(open(os.path.join(BASE, "tools", "tables.json"), encoding="utf-8"))
coded = set(tables["v86"])

rime = {}
for line in open(DICT, encoding="utf-8"):
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 2:
        continue
    ch, code = parts[0].strip(), parts[1].strip()
    if 1 <= len(code) <= 4 and code.isalpha() and len(ch) == 1 and ch not in rime:
        rime[ch] = code

ids = {}
for line in open(IDS, encoding="utf-8"):
    if line.startswith("#"):
        continue
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 3:
        continue
    cp, ch, expr = parts[0], parts[1], parts[2]
    if len(ch) == 1 and cp.startswith("U+"):
        ids.setdefault(ch, expr)

files = [f[:-5] for f in os.listdir(os.path.join(BASE, "data", "chars")) if f.endswith(".json")]
DONE = set("贠菓幋燊凅坘脮馺秎镠")
extras = [c for c in files if c not in coded and c not in DONE and c in rime and "\u4e00" <= c <= "\u9fff"]

random.seed(20261122)
sample = random.sample(extras, min(600, len(extras)))


def kai_bbox(ch):
    img = Image.new("L", (1024, 1024), 255)
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT, 900)
    b = d.textbbox((0, 0), ch, font=f)
    w, h = b[2] - b[0], b[3] - b[1]
    d.text(((1024 - w) / 2 - b[0], (1024 - h) / 2 - b[1]), ch, font=f, fill=0)
    return img.point(lambda v: 0 if v > 200 else 255).getbbox()


def data_bbox(ch):
    d = json.load(open(os.path.join(BASE, "data", "chars", f"{ch}.json"), encoding="utf-8"))
    xs, ys = [], []
    for s in d["medians"]:
        for x, y in s:
            xs.append(x)
            ys.append(900 - y)
    return (min(xs), min(ys), max(xs), max(ys))


rows = []
for ch in sample:
    expr = ids.get(ch, "")
    op = expr[0] if expr and expr[0] in "⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻" else ""
    if not op:
        continue
    try:
        k = kai_bbox(ch); d = data_bbox(ch)
    except Exception:
        continue
    kw, kh = k[2] - k[0], k[3] - k[1]
    dw, dh = d[2] - d[0], d[3] - d[1]
    if kw < 250 or kh < 250:
        continue
    score = abs(dw / kw - 1) + abs(dh / kh - 1)
    rows.append((op, score, ch, rime[ch], expr))

rows.sort(key=lambda r: r[1])
buckets = {}
for op, score, ch, code, expr in rows:
    buckets.setdefault(op, []).append((score, ch, code, expr))

out = []
for op, items in buckets.items():
    for score, ch, code, expr in items[:2]:
        out.append((op, round(score, 3), ch, code, expr))

out.sort(key=lambda r: r[1])
for op, score, ch, code, expr in out[:10]:
    print(f"{ch}  {code:<5} {op} {expr}  score={score}")
json.dump([{"ch": ch, "code": code, "expr": expr, "op": op} for op, score, ch, code, expr in out[:10]],
          open(os.path.join(BASE, "tools", "next-ten.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

