"""Print candidate split lines (rows/cols) and part boxes for a KaiTi glyph."""

import sys

from PIL import Image, ImageDraw, ImageFont

FONT = r"C:\Windows\Fonts\simkai.ttf"


def mask_for(ch):
    img = Image.new("L", (1024, 1024), 255)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, 900)
    box = draw.textbbox((0, 0), ch, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text(((1024 - w) / 2 - box[0], (1024 - h) / 2 - box[1]), ch, font=font, fill=0)
    return img.point(lambda v: 0 if v > 200 else 255)


for ch in sys.argv[1:]:
    m = mask_for(ch)
    px = m.load()
    w, h = m.size
    bb = m.getbbox()
    rows = [(sum(1 for x in range(w) if px[x, y] > 0), y) for y in range(bb[1], bb[3])]
    cols = [(sum(1 for y in range(h) if px[x, y] > 0), x) for x in range(bb[0], bb[2])]
    print("==", ch, "whole", m.getbbox())
    print("  emptiest rows:", sorted(rows)[:6])
    print("  emptiest cols:", sorted(cols)[:6])

