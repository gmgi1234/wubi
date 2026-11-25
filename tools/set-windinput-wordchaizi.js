// Register the word-split comment dictionary and switch the comment template to it.
const fs = require('node:fs');

const p = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput/config.toml';
let t = fs.readFileSync(p, 'utf8');

const DICTS = [
  '',
  '[[ui.comment_dicts]]',
  'id = "ci_chaifen"',
  'label = "词组拆分"',
  'path = "comments/ci_chaifen.txt"',
  '',
];

const TEMPLATES = [
  '',
  '[[ui.comment.templates]]',
  'id = "chaizi_word"',
  'name = "拆分（含词组）"',
  'text = "${chaizi}{ · ${dict:ci_chaifen}}"',
  '',
];

if (!t.includes('ci_chaifen')) {
  // insert before the first [ui.comment.assign section so it stays under [ui.comment]
  const at = t.indexOf('[ui.comment.assign.type.codetable]');
  const inject = DICTS.join('\n') + TEMPLATES.join('\n');
  t = at >= 0 ? t.slice(0, at) + inject + '\n' + t.slice(at) : t + '\n' + inject;
}

t = t.replace(/default_horizontal = "chaizi_code"/g, 'default_horizontal = "chaizi_word"');

fs.writeFileSync(p, t, 'utf8');
const i = t.indexOf('[ui.comment');
console.log(t.slice(i, i + 500));
