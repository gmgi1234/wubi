"""Test: can we pull a glyph outline out of a KaiTi font?"""

import freetype

FONT = r"C:\Windows\Fonts\simkai.ttf"
face = freetype.Face(FONT)
print("family:", face.family_name, "| glyphs:", face.num_glyphs)

for ch in ["麡", "王", "齊", "鹿"]:
    idx = face.get_char_index(ord(ch))
    face.load_char(ch, freetype.FT_LOAD_NO_SCALE | freetype.FT_LOAD_NO_BITMAP)
    outline = face.glyph.outline
    n_points = len(outline.points)
    n_contours = len(outline.contours)
    tags = set(outline.tags)
    print(f"{ch} U+{ord(ch):04X} glyph={idx} points={n_points} contours={n_contours} tags={tags}")
    if n_points:
        xs = [p[0] for p in outline.points]
        ys = [p[1] for p in outline.points]
        print(f"    bbox=({min(xs)},{min(ys)})-({max(xs)},{max(ys)}) upm={face.units_per_EM}")
