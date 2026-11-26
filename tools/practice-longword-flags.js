// 给「搜索跳转的题库外词」补 keys/cheng
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const anchor = "        keys: '', len: n";
if (!t.includes(anchor)) { console.log('未找到锚点'); process.exit(1); }

t = t.replace(
  anchor,
  "        keys: '', cheng: '', len: n"
);
// 在 item 定义之后插入 flags 计算
const after = "        keys: '', cheng: '', len: n\r\n      };";
const after2 = "        keys: '', cheng: '', len: n\n      };";
if (t.includes(after)) {
  t = t.replace(after, after + "\r\n      var flL = flagsOf(item.w); item.keys = flL.keys; item.cheng = flL.cheng;");
} else if (t.includes(after2)) {
  t = t.replace(after2, after2 + "\n      var flL = flagsOf(item.w); item.keys = flL.keys; item.cheng = flL.cheng;");
} else {
  console.log('未找到 item 结尾');
  process.exit(1);
}
fs.writeFileSync(p, t, 'utf8');
console.log('已补 flags:', t.includes('flL = flagsOf(item.w)'));
