"""Measure KaiTi part boxes for a character by column split."""

import sys

from PIL import Image, ImageDraw, ImageFont

FONT = r"C:\Windows\Fonts\simkai.ttf"
ch = sys.argv[1]
split = int(sys.argv[2]) if len(sys.argv) > 2 else 471

img = Image.new("L", (1024, 1024), 255)
draw = ImageDraw.Draw(img)
font = ImageFont.truetype(FONT, 900)
box = draw.textbbox((0, 0), ch, font=font)
w, h = box[2] - box[0], box[3] - box[1]
draw.text(((1024 - w) / 2 - box[0], (1024 - h) / 2 - box[1]), ch, font=font, fill=0)
mask = img.point(lambda v: 0 if v > 200 else 255)

left = mask.crop((0, 0, split, 1024)).getbbox()
right = mask.crop((split, 0, 1024, 1024)).getbbox()
right = None if right is None else (right[0] + split, right[1], right[2] + split, right[3])
print("whole:", mask.getbbox())
print("left :", left)
print("right:", right)
for s in (440, 470, 500, 530):
    r = mask.crop((s, 0, 1024, 1024)).getbbox()
    if r:
        print(f"  right from x={s}:", (r[0] + s, r[1], r[2] + s, r[3]))
