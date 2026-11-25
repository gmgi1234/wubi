"""Build the three-version wubi code table workbook."""

import json
import os

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

BASE = r"D:\Users\10061\Downloads\wubi"
OUT = os.path.join(BASE, "tools", "products")
os.makedirs(OUT, exist_ok=True)

with open(os.path.join(BASE, "tools", "tables.json"), encoding="utf-8") as fh:
    data = json.load(fh)

HEADER_FILL = PatternFill("solid", fgColor="1F2937")
HEADER_FONT = Font(color="FFFFFF", bold=True, size=11)
THIN = Side(style="thin", color="D9DDE4")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

wb = Workbook()

def build_sheet(title, table, accent):
    ws = wb.create_sheet(title)
    ws.append(["汉字", "首码", "编码", "字根拆分"])
    for cell in ws[1]:
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
    rows = 0
    for ch, entry in table.items():
        code = entry.get("c", "")
        roots = entry.get("r", [])
        ws.append([ch, code[:1] if code else "", code, " + ".join(roots)])
        rows += 1
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:D{rows + 1}"
    for col, width in enumerate([8, 8, 14, 58], start=1):
        ws.column_dimensions[get_column_letter(col)].width = width
    for row in ws.iter_rows(min_row=1, max_row=rows + 1, min_col=1, max_col=4):
        for cell in row:
            cell.border = BORDER
            cell.alignment = Alignment(horizontal="center" if cell.column <= 3 else "left", vertical="center")
    ws.sheet_properties.tabColor = accent
    return rows

n86 = build_sheet("86版", data["v86"], "E74C3C")
n98 = build_sheet("98版", data["v98"], "F39C12")
n06 = build_sheet("新世纪版", data["v06"], "27AE60")

# Three-version comparison, only rows where the three codes differ
ws = wb.create_sheet("三版对照")
ws.append(["汉字", "86", "98", "新世纪", "差异"])
for cell in ws[1]:
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = Alignment(horizontal="center", vertical="center")

diff_count = 0
all_chars = sorted(set(data["v86"]) | set(data["v98"]) | set(data["v06"]))
for ch in all_chars:
    c86 = data["v86"].get(ch, {}).get("c", "")
    c98 = data["v98"].get(ch, {}).get("c", "")
    c06 = data["v06"].get(ch, {}).get("c", "")
    if len({c86, c98, c06}) == 1:
        continue
    tags = []
    if c86 != c98:
        tags.append("86≠98")
    if c86 != c06:
        tags.append("86≠新世纪")
    if c98 != c06:
        tags.append("98≠新世纪")
    ws.append([ch, c86, c98, c06, "、".join(tags)])
    diff_count += 1

ws.freeze_panes = "A2"
ws.auto_filter.ref = f"A1:E{diff_count + 1}"
for col, width in enumerate([8, 12, 12, 12, 28], start=1):
    ws.column_dimensions[get_column_letter(col)].width = width
for row in ws.iter_rows(min_row=1, max_row=diff_count + 1, min_col=1, max_col=5):
    for cell in row:
        cell.border = BORDER
        cell.alignment = Alignment(horizontal="center", vertical="center")
ws.sheet_properties.tabColor = "3498DB"

# Cover sheet
cover = wb["Sheet"]
cover.title = "说明"
lines = [
    ("五笔字根 · 三版编码对照表", 16, True),
    ("", 11, False),
    (f"收录 86 版 {n86} 字、98 版 {n98} 字、新世纪版 {n06} 字", 11, False),
    (f"三版编码不一致的字共 {diff_count} 个，见「三版对照」页", 11, False),
    ("", 11, False),
    ("字段说明", 12, True),
    ("汉字：单字；首码：编码首字母（对应键位）", 11, False),
    ("编码：该版五笔全码；字根拆分：页面使用的字根序列", 11, False),
    ("", 11, False),
    ("数据来源：汉字笔画数据来自 Make Me a Hanzi（Arphic Public License）", 9, False),
    ("生成工具：五笔字根·笔画着色（wubi.netlify.app）", 9, False),
]
for row, (text, size, bold) in enumerate(lines, start=1):
    cell = cover.cell(row=row, column=1, value=text)
    cell.font = Font(size=size, bold=bold, color="1F2937")
cover.column_dimensions["A"].width = 70

path = os.path.join(OUT, "五笔三版编码对照表.xlsx")
wb.save(path)
print("saved", path, "rows:", n86, n98, n06, "diff:", diff_count)
