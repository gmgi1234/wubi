// Switch the WindInput user config to the union scheme and enable chaizi comments.
const fs = require('node:fs');

const p = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput/config.toml';
let t = fs.readFileSync(p, 'utf8');

t = t.replace('active = "wubi06"', 'active = "wubi_union"');
t = t.replace('available = ["wubi06"]', 'available = ["wubi_union", "wubi_union_pinyin", "wubi06"]');

if (!t.includes('[ui.comment.assign.type.codetable]')) {
  t += [
    '',
    '[ui.comment]',
    'enabled = true',
    '',
    '[ui.comment.assign.type.codetable]',
    'default_horizontal = "chaizi_code"',
    '',
    '[ui.comment.assign.type.mixed]',
    'default_horizontal = "chaizi_code"',
    '',
  ].join('\n');
}

fs.writeFileSync(p, t, 'utf8');
console.log(t.slice(t.indexOf('[schema]'), t.indexOf('[schema]') + 140));
console.log('---');
console.log(t.slice(t.indexOf('[ui.comment]')));
