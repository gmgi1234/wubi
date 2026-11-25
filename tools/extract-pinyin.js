// 从 data/pinyin_common.js 解析出「字 → 拼音」，供动态页面使用
const fs = require('node:fs');

const text = fs.readFileSync('D:/Users/10061/Downloads/wubi/data/pinyin_common.js', 'utf8');
const map = {};
const re = /([\u3400-\u9fff])([a-zA-Züǖǘǚǜāáǎàēéěèīíǐìōóǒòūúǔùǹńň]+)/g;
let m;
while ((m = re.exec(text))) {
  if (!map[m[1]]) map[m[1]] = m[2];
}
fs.writeFileSync('D:/Users/10061/Downloads/wubi/tools/pinyin-map.json', JSON.stringify(map), 'utf8');
console.log('pinyin entries:', Object.keys(map).length);
