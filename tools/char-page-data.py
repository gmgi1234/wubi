"""Gather data for one character page: common words + related characters."""

import json
import sys

from opencc import OpenCC

BASE = r"D:\Users\10061\Downloads\wubi"
UNION = BASE + r"\qingfeng\WindInput\schemas\dicts\wubi_union.dict.yaml"
SIMPLIFIED_WORDS = BASE + r"\qingfeng\WindInput\schemas\dicts\wubi_union.dict.yaml"

t2s = OpenCC('t2s')
s2t = OpenCC('s2t')

ch = sys.argv[1]

with open(BASE + r"\tools\tables.json", encoding="utf-8") as fh:
    tables = json.load(fh)
v86 = tables["v86"]

simp = t2s.convert(ch)
entry = v86.get(ch) or v86.get(simp) or {}
roots = entry.get("r") or []
first_root = roots[0] if roots else None

# words containing the simplified form, ranked by weight
words = []
with open(UNION, encoding="utf-8") as fh:
    for line in fh:
        if line.startswith("#") or line.startswith("-") or line.startswith(" "):
            continue
        parts = line.strip().split("\t")
        if len(parts) < 3:
            continue
        text = parts[0]
        if simp not in text:
            continue
        n = len(text)
        if n < 2 or n > 4:
            continue
        try:
            weight = int(float(parts[2]))
        except ValueError:
            weight = 0
        words.append((weight, text))

words.sort(key=lambda t: -t[0])
seen = set()
picked = []
for weight, text in words:
    if text in seen:
        continue
    seen.add(text)
    picked.append(text)
    if len(picked) >= 8:
        break

display_words = [w if simp == ch else s2t.convert(w) for w in picked]

# related characters: same first root
related = []
if first_root:
    for c, e in v86.items():
        if c == ch or c == simp:
            continue
        r = e.get("r") or []
        if r and r[0] == first_root:
            related.append(c)
        if len(related) >= 8:
            break

print(json.dumps({
    "char": ch,
    "simp": simp,
    "roots": roots,
    "first_root": first_root,
    "words": display_words,
    "related": related,
}, ensure_ascii=False))

