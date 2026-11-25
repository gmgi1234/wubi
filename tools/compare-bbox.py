"""Compare each glyph's ink bbox with a KaiTi reference at 1024x1024."""

import json
import sys

from PIL import Image, ImageDraw, ImageFont

BASE = r"D:\Users\10061\Downloads\wubi"
FONT = r"C:\Windows\Fonts\simkai.ttf"
CHARS = sys.argv[1:] or ["陈", "做", "想", "鼻", "还", "圆", "马", "森", "坐", "酱"]


def kai_bbox(ch):
    img = Image.new("L", (1024, 1024), 255)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, 900)
    box = draw.textbbox((0, 0), ch, font=font)
    w = box[2] - box[0]
    h = box[3] - box[1]
    x = (1024 - w) / 2 - box[0]
    y = (1024 - h) / 2 - box[1]
    draw.text((x, y), ch, font=font, fill=0)
    ink = img.point(lambda v: 0 if v > 200 else 255).getbbox()
    return ink


def data_bbox(ch):
    with open(rf"{BASE}\data\chars\{ch}.json", encoding="utf-8") as fh:
        d = json.load(fh)
    xs, ys = [], []
    for stroke in d["medians"]:
        for px, py in stroke:
            xs.append(px)
            ys.append(py)
    # medians use y-up; flip to image coords
    return (min(xs), 900 - max(ys), max(xs), 900 - min(ys))


print(f"{'字':<4}{'楷体 w×h':<12}{'数据 w×h':<12}{'宽比':<8}{'高比':<8}{'中心偏移'}")
for ch in CHARS:
    kx0, ky0, kx1, ky1 = kai_bbox(ch)
    dx0, dy0, dx1, dy1 = data_bbox(ch)
    kw, kh = kx1 - kx0, ky1 - ky0
    dw, dh = dx1 - dx0, dy1 - dy0
    cx = ((dx0 + dx1) - (kx0 + kx1)) / 2
    cy = ((dy0 + dy1) - (ky0 + ky1)) / 2
    print(f"{ch:<4}{kw}×{kh:<8}{dw}×{dh:<8}{dw / kw:<8.2f}{dh / kh:<8.2f}{cx:.0f},{cy:.0f}")

