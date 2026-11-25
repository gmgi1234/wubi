"""Batch-build per-character metadata (words + related chars) for many characters."""

import json
import sys

from opencc import OpenCC

BASE = r"D:\Users\10061\Downloads\wubi"
UNION = BASE + r"\qingfeng\WindInput\schemas\dicts\wubi_union.dict.yaml"
t2s = OpenCC('t2s')
s2t = OpenCC('s2t')

with open(BASE + r"\tools\tables.json", encoding="utf-8") as fh:
    tables = json.load(fh)
v86 = tables["v86"]

chars = json.load(open(BASE + r"\tools\char-ranking.json", encoding="utf-8"))
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
# 全部有码表的字：先按常用度排序，再补上其余的
ordered = [c for c in chars if c in v86]
rest = [c for c in v86 if c not in set(ordered)]
chars = ordered + rest
if limit:
    chars = chars[:limit]

# index words by every character they contain
by_char = {}
with open(UNION, encoding="utf-8") as fh:
    for line in fh:
        if line.startswith("#") or line.startswith("-") or line.startswith(" "):
            continue
        parts = line.strip().split("\t")
        if len(parts) < 3:
            continue
        text = parts[0]
        n = len(text)
        if n < 2 or n > 4:
            continue
        try:
            weight = int(float(parts[2]))
        except ValueError:
            weight = 0
        for ch in set(text):
            by_char.setdefault(ch, []).append((weight, text))

# related: same first root
by_root = {}
for c, e in v86.items():
    r = e.get("r") or []
    if r:
        by_root.setdefault(r[0], []).append(c)

out = {}
for ch in chars:
    simp = t2s.convert(ch)
    entry = v86.get(ch) or v86.get(simp) or {}
    roots = entry.get("r") or []
    first_root = roots[0] if roots else None

    words = sorted(by_char.get(simp, []), key=lambda t: -t[0])
    picked, seen = [], set()
    for weight, text in words:
        if text in seen:
            continue
        seen.add(text)
        picked.append(text if simp == ch else s2t.convert(text))
        if len(picked) >= 8:
            break

    related = []
    if first_root:
        for c2 in by_root.get(first_root, []):
            if c2 in (ch, simp):
                continue
            related.append(c2)
            if len(related) >= 8:
                break

    out[ch] = {"simp": simp, "words": picked, "related": related}

json.dump(out, open(BASE + r"\tools\char-meta.json", "w", encoding="utf-8"), ensure_ascii=False)
print("meta built for", len(out), "chars")
