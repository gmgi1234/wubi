// Assemble 馺 from native-size donors: 馬 from 媽, 及 from 吸 (translation only,
// so the stroke weight stays exactly as in the source characters).
const fs = require('node:fs');

const BASE = 'D:/Users/10061/Downloads/wubi';
const read = (ch) => JSON.parse(fs.readFileSync(`${BASE}/data/chars/${ch}.json`, 'utf8'));

function bbox(medians) {
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (const s of medians) for (const [x, y] of s) {
    if (x < minx) minx = x;
    if (x > maxx) maxx = x;
    if (y < miny) miny = y;
    if (y > maxy) maxy = y;
  }
  return { minx, maxx, miny, maxy };
}

function translatePath(path, dx, dy) {
  const out = [];
  const tokens = path.match(/[MQLCZ]|-?\d+(?:\.\d+)?/g) || [];
  let buf = [];
  for (const tok of tokens) {
    if (/[A-Z]/.test(tok)) { out.push(tok); buf = []; continue; }
    buf.push(parseFloat(tok));
    if (buf.length === 2) {
      out.push((buf[0] + dx).toFixed(1), (buf[1] + dy).toFixed(1));
      buf = [];
    }
  }
  return out.join(' ');
}

function splitByMedianX(data, threshold) {
  const left = [], right = [];
  data.medians.forEach((m, i) => {
    const xs = m.map((p) => p[0]);
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
    (cx < threshold ? left : right).push(i);
  });
  return { left, right };
}

const ma = read('駐');   // 馬(10) + 主(5)
const xi = read('圾');   // 土(3) + 及(3)

const maSplit = { right: [...Array(ma.strokes.length).keys()].slice(0, 10) }; // 馬
const xiSplit = { right: [...Array(xi.strokes.length).keys()].slice(3) };    // 及
const maStrokes = maSplit.right;
const jiStrokes = xiSplit.right;
console.log('媽 馬笔数', maStrokes.length, '吸 及笔数', jiStrokes.length);
if (maStrokes.length !== 10 || jiStrokes.length !== 3) throw new Error('part split mismatch');

const maBox = bbox(maStrokes.map((i) => ma.medians[i]));
const jiBox = bbox(jiStrokes.map((i) => xi.medians[i]));
console.log('馬 box', maBox, '及 box', jiBox);

// targets from KaiTi measurement of 馺
const MA_T = { minx: 91, maxx: 471, miny: 180, maxy: 828 };
const JI_T = { minx: 470, maxx: 942, miny: 216, maxy: 789 };

const dxMa = (MA_T.minx + MA_T.maxx) / 2 - (maBox.minx + maBox.maxx) / 2;
const dyMa = (MA_T.miny + MA_T.maxy) / 2 - (maBox.miny + maBox.maxy) / 2;
const dxJi = (JI_T.minx + JI_T.maxx) / 2 - (jiBox.minx + jiBox.maxx) / 2;
const dyJi = (JI_T.miny + JI_T.maxy) / 2 - (jiBox.miny + jiBox.maxy) / 2;

const strokes = [];
const medians = [];
for (const i of maStrokes) {
  strokes.push(translatePath(ma.strokes[i], dxMa, dyMa));
  medians.push(ma.medians[i].map(([x, y]) => [Math.round((x + dxMa) * 10) / 10, Math.round((y + dyMa) * 10) / 10]));
}
for (const i of jiStrokes) {
  strokes.push(translatePath(xi.strokes[i], dxJi, dyJi));
  medians.push(xi.medians[i].map(([x, y]) => [Math.round((x + dxJi) * 10) / 10, Math.round((y + dyJi) * 10) / 10]));
}

const out = { strokes, medians };
fs.writeFileSync(`${BASE}/tools/fit/馺-donor.json`, JSON.stringify(out), 'utf8');
console.log('donor assembled:', strokes.length, 'strokes, shift', dxMa.toFixed(0), dyMa.toFixed(0), '|', dxJi.toFixed(0), dyJi.toFixed(0));

