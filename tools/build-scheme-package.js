// Package the 五笔大一统 scheme for distribution (WindInput 方案包).
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const UD = path.join(ROOT, 'qingfeng/WindInput');
const OUT = path.join(ROOT, 'tools', 'pkg');
const NAME = 'wubi-union-1.1.0';

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, NAME, 'dicts'), { recursive: true });
fs.mkdirSync(path.join(OUT, NAME, 'comments'), { recursive: true });

const copy = (from, to) => fs.copyFileSync(from, path.join(OUT, NAME, to));
const S = path.join(UD, 'schemas');

copy(path.join(S, 'wubi_union.schema.toml'), 'wubi_union.schema.toml');
copy(path.join(S, 'wubi_union_pinyin.schema.toml'), 'wubi_union_pinyin.schema.toml');
copy(path.join(S, 'dicts/wubi_union.dict.yaml'), 'dicts/wubi_union.dict.yaml');
copy(path.join(S, 'wubi06_chaizi_pua.txt'), 'wubi06_chaizi_pua.txt');
copy(path.join(S, 'xin_shiji_zigen.ttf'), 'xin_shiji_zigen.ttf');

// 可选：词组拆分词典（需要在设置里挂载）
if (fs.existsSync(path.join(S, 'comments/ci_chaifen.txt'))) {
  copy(path.join(S, 'comments/ci_chaifen.txt'), 'comments/ci_chaifen.txt');
}

// 方案包清单
const manifest = `[package]
app_version = "0.133.0"
platform = "windows"
created_at = "${new Date().toISOString()}"

[schema]
id = "wubi_union_pinyin"
version = "1.1.0"

[refs]
system = []
missing = []
`;
fs.writeFileSync(path.join(OUT, NAME, 'package.toml'), manifest, 'utf8');

const readme = `五笔大一统 · 清风输入法方案包 v1.1.0
========================================

一、这个方案是什么
  把五笔 86 版、98 版、新世纪（06）三套编码合成一个词库：
  同一个字，输入任意一版的编码都能出候选，不用来回切换方案。
  候选后面会显示这个字的字根拆分（新世纪拆法）。

二、安装要求
  · 清风输入法（WindInput）0.100 以上，推荐 0.133+
  · Windows

三、安装方法
  A. 自动导入（推荐）
     打开 清风输入法设置 → 输入方案 → 导入方案包 → 选择本 zip

  B. 手动安装（导入失败时）
     把 zip 里的所有文件解压到你的「用户数据目录」下的 schemas 里：
       <用户数据目录>\\schemas\\
     一般位置：
       C:\\Users\\<你的用户名>\\AppData\\Roaming\\WindInput\\schemas\\
       或你安装时选的自定义数据目录
     解压后应该有：
       schemas\\wubi_union.schema.toml
       schemas\\wubi_union_pinyin.schema.toml
       schemas\\dicts\\wubi_union.dict.yaml
       schemas\\wubi06_chaizi_pua.txt
       schemas\\xin_shiji_zigen.ttf
     然后在设置里切换到「五笔大一统」或「五笔大一统拼音」。

四、功能说明
  · 三版编码都能出字：例「革」——86/98 版 AFJ，新世纪 AKFJ，三种都能出字
  · 候选显示字根拆分（新世纪拆法），字根字体已内置（xin_shiji_zigen.ttf）
  · wubi_union_pinyin 是「五笔 + 拼音」混输版本

五、可选：词组拆分
  comments/ci_chaifen.txt 是「词组拆字根」注释词典（约 10 万条），
  想启用的话，在用户数据目录的 config.toml 里加：

    [[ui.comment_dicts]]
    id = "ci_chaifen"
    label = "词组拆分"
    path = "comments/ci_chaifen.txt"

    [[ui.comment.templates]]
    id = "chaizi_word"
    name = "拆分（含词组）"
    text = "\${chaizi}{ · \${dict:ci_chaifen}}"

    [ui.comment.assign.type.codetable]
    default_horizontal = "chaizi_word"

    [ui.comment.assign.type.mixed]
    default_horizontal = "chaizi_word"

  重启输入法后生效。

六、数据来源
  · 三版码表：Rime 五笔方案（86/98/新世纪）
  · 拆字库：新世纪五笔拆字数据库
  · 字根字体：新世纪字根字体

七、许可
  仅供个人学习使用；码表与字根字体版权归各自作者所有，请勿商用。
`;
fs.writeFileSync(path.join(OUT, NAME, 'README.txt'), readme, 'utf8');

const zipPath = path.join(OUT, `${NAME}.zip`);
execFileSync('powershell.exe', ['-NoProfile', '-Command',
  `Compress-Archive -Path '${path.join(OUT, NAME)}\\*' -DestinationPath '${zipPath}' -Force`]);
const size = fs.statSync(zipPath).size;
console.log('package:', zipPath, (size / 1024 / 1024).toFixed(2), 'MB');
for (const f of fs.readdirSync(path.join(OUT, NAME), { recursive: true })) {
  const p = path.join(OUT, NAME, String(f));
  if (fs.statSync(p).isFile()) console.log('  ', f, (fs.statSync(p).size / 1024).toFixed(0), 'KB');
}

