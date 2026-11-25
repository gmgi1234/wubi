"""Check which root characters have no glyph in common fonts (i.e. need PUA rendering)."""

import json

from PIL import ImageFont

BASE = r"D:\Users\10061\Downloads\wubi"
tables = json.load(open(BASE + r"\tools\tables.json", encoding="utf-8"))

roots = set()
for ver in ("v86", "v98", "v06"):
    for entry in tables[ver].values():
        for r in entry.get("r") or []:
            roots.add(r)

print("distinct roots:", len(roots))

fonts = {
    "KaiTi": r"C:\Windows\Fonts\simkai.ttf",
    "SimSun": r"C:\Windows\Fonts\simsun.ttc",
    "SegoeUI": r"C:\Windows\Fonts\segoeui.ttf",
}

loaded = {}
for name, path in fonts.items():
    try:
        loaded[name] = ImageFont.truetype(path, 32)
    except Exception as exc:  # noqa
        print("font load failed", name, exc)


def has_glyph(font, ch):
    try:
        mask = font.getmask(ch)
        return mask.getbbox() is not None
    except Exception:
        return False


missing = {}
for r in roots:
    miss = [ch for ch in r if not any(has_glyph(f, ch) for f in loaded.values())]
    if miss:
        missing[r] = miss

print("roots with unrenderable characters:", len(missing))
for r, miss in list(missing.items())[:40]:
    print("  ", r, "->", " ".join(f"{c}(U+{ord(c):04X})" for c in miss))
json.dump(sorted(missing.keys()), open(BASE + r"\tools\roots-missing.json", "w", encoding="utf-8"), ensure_ascii=False)
