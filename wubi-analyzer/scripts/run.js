#!/usr/bin/env node
/**
 * 五笔补码与笔画分析工具 CLI
 * 
 * 用法：
 *   node run.js identifier <汉字> [字根1 字根2 ...]     判断补码
 *   node run.js strokes <字根1> [字根2 ...]             计算总笔画数
 *   node run.js radical <字根>                          查询字根笔画信息
 *   node run.js analyze <汉字> <字型1-3> [字根1 字根2 ...] 完整编码分析
 *   node run.js table                                   显示识别码表
 *   node run.js help                                    显示帮助
 */

const {
  checkIdentifier,
  calcIdentifierKey,
  getRadicalInfo,
  calcTotalStrokes,
  analyzeChar,
  STROKE_NAMES,
  STRUCT_NAMES,
  IDENTIFIER_TABLE,
} = require('./wubi-identifier');

// ── 彩色输出 ──────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  blue:   '\x1b[34m',
};
function h(text) { return `${C.cyan}${C.bold}${text}${C.reset}`; }
function ok(text) { return `${C.green}${text}${C.reset}`; }
function warn(text) { return `${C.yellow}${text}${C.reset}`; }
function err(text) { return `${C.red}${text}${C.reset}`; }
function dim(text) { return `${C.gray}${text}${C.reset}`; }

function sep(char = '─', len = 50) {
  return dim(char.repeat(len));
}

// ── 命令实现 ──────────────────────────────────

/** identifier: 判断一个字有没有补码 */
function cmdIdentifier(args) {
  const char = args[0];
  if (!char) {
    console.log(err('用法: node run.js identifier <汉字> [字根1 字根2 ...]'));
    return;
  }
  const roots = args.slice(1);
  const result = checkIdentifier(char, roots);

  console.log(sep());
  console.log(h(`  补码判断：「${char}」`));
  console.log(sep());

  if (result.hasIdentifier === true) {
    console.log(ok(`  ✓ 有补码（末笔识别码）`));
    console.log(`  ${result.reason}`);
    
    // 如果提供了字根，显示末笔信息
    if (roots.length > 0) {
      const { RADICAL_DB } = require('./radical-stroke-db');
      const lastRoot = roots[roots.length - 1];
      const lastInfo = RADICAL_DB[lastRoot];
      if (lastInfo) {
        console.log(`\n  末字根：${lastRoot}  末笔：${STROKE_NAMES[lastInfo.lastStroke]}(${lastInfo.lastStroke})`);
        console.log(`\n  ${warn('识别码 = 末笔(1-5) × 字型(1-3)，请提供字型后用 analyze 命令获取完整结果')}`);
        console.log(`\n  快速识别码查询（末笔=${lastInfo.lastStroke} [${STROKE_NAMES[lastInfo.lastStroke]}]）：`);
        for (let s = 1; s <= 3; s++) {
          const k = IDENTIFIER_TABLE[lastInfo.lastStroke][s];
          console.log(`    字型${s}(${STRUCT_NAMES[s]}) → 识别码 ${lastInfo.lastStroke * 10 + s} → 键位 ${h(k)}`);
        }
      }
    }
  } else if (result.hasIdentifier === false) {
    console.log(warn(`  ✗ 无补码`));
    console.log(`  ${result.reason}`);
  } else {
    console.log(warn(`  ? 无法确定`));
    console.log(`  ${result.reason}`);
  }
  console.log(sep());
}

/** strokes: 通过字根列表计算总笔画数 */
function cmdStrokes(args) {
  if (args.length === 0) {
    console.log(err('用法: node run.js strokes <字根1> [字根2 ...]'));
    return;
  }
  const result = calcTotalStrokes(args);

  console.log(sep());
  console.log(h(`  笔画统计：${args.join(' + ')}`));
  console.log(sep());

  for (const d of result.detail) {
    const s = d.strokes === '?' ? err('?') : ok(String(d.strokes));
    console.log(`  字根 ${h(d.radical)}  笔画数：${s}`);
  }

  console.log(sep('─', 30));

  if (result.unknowns.length > 0) {
    console.log(warn(`  未知字根（不在数据库）：${result.unknowns.join('、')}`));
    console.log(`  已知部分合计：${ok(String(result.total))} 笔`);
  } else {
    console.log(`  ${h('总笔画数')}：${ok(String(result.total))} 笔`);
  }
  console.log(sep());
}

/** radical: 查询单个字根的详细笔画信息 */
function cmdRadical(args) {
  const radical = args[0];
  if (!radical) {
    console.log(err('用法: node run.js radical <字根>'));
    return;
  }

  const info = getRadicalInfo(radical);

  console.log(sep());
  console.log(h(`  字根信息：「${radical}」`));
  console.log(sep());

  if (!info) {
    console.log(warn(`  「${radical}」不在字根数据库中`));
    console.log(dim('  （可能是合体字而非基础字根）'));
  } else {
    console.log(`  键位：   ${h(info.key)}（${info.zone}区${info.pos}位）`);
    console.log(`  笔画数： ${ok(String(info.strokes))} 笔`);
    console.log(`  笔型序列：${info.strokeSeqStr}`);
    console.log(`  末笔：   ${ok(info.lastStrokeName)}（${info.lastStroke}）`);
  }
  console.log(sep());
}

/** analyze: 完整编码分析 */
function cmdAnalyze(args) {
  // 用法: analyze <汉字> <字型1-3> [字根1 字根2 ...]
  const char = args[0];
  const structType = parseInt(args[1]);
  const roots = args.slice(2);

  if (!char || isNaN(structType) || structType < 1 || structType > 3) {
    console.log(err('用法: node run.js analyze <汉字> <字型1-3> [字根1 字根2 ...]'));
    console.log(dim('  字型: 1=左右型  2=上下型  3=杂合型'));
    console.log(dim('  示例: node run.js analyze 汉 1 氵又'));
    return;
  }

  const result = analyzeChar(char, roots, structType);

  console.log(sep());
  console.log(h(`  完整分析：「${char}」（${STRUCT_NAMES[structType]}）`));
  console.log(sep());

  console.log(`  字符类型：${ok(result.charType)}`);

  if (roots.length > 0) {
    console.log(`  字根拆分：${roots.map(r => h(r)).join(' + ')}`);
  }

  if (result.strokeInfo) {
    const si = result.strokeInfo;
    const detailStr = si.detail.map(d => `${d.radical}(${d.strokes})`).join('+');
    const totalStr = si.unknowns.length > 0 ? warn(`${si.total}+?`) : ok(String(si.total));
    console.log(`  总笔画数：${totalStr} 笔  [${detailStr}]`);
  }

  console.log(`  有无补码：${result.hasIdentifier ? ok('有') : warn('无')}`);

  if (result.identifierInfo) {
    console.log(`  识别码：  ${result.identifierInfo.description}`);
  }

  if (result.encoding.length > 0) {
    console.log(`  ${h('五笔编码')}：${result.encoding.map(k => ok(k)).join(' ')}  → ${ok(result.encoding.join(''))}`);
  }

  console.log(sep('─', 30));
  console.log(`  ${dim('摘要：')}${result.summary}`);
  console.log(sep());
}

/** table: 显示识别码完整对照表 */
function cmdTable() {
  console.log(sep());
  console.log(h('  末笔识别码对照表（86版五笔）'));
  console.log(sep());
  console.log(`  ${'末笔'.padEnd(8)}${'左右型(1)'.padEnd(12)}${'上下型(2)'.padEnd(12)}${'杂合型(3)'}`);
  console.log(sep('─', 48));

  const strokeLabels = ['横(1)', '竖(2)', '撇(3)', '捺(4)', '折(5)'];
  for (let s = 1; s <= 5; s++) {
    const cells = [1, 2, 3].map(t => {
      const k = IDENTIFIER_TABLE[s][t];
      const code = s * 10 + t;
      return `${ok(k)}(${code})`.padEnd(14);
    });
    console.log(`  ${strokeLabels[s-1].padEnd(8)}${cells.join('')}`);
  }

  console.log(sep());
  console.log(dim('  规则：识别码 = 末笔笔型(1-5) × 字型结构(1-3)'));
  console.log(dim('  末笔：1=横/提  2=竖/竖钩  3=撇  4=捺/点  5=折'));
  console.log(dim('  字型：1=左右型  2=上下型  3=杂合/单体/包围'));
  console.log(sep());
}

/** help */
function cmdHelp() {
  console.log(`
${h('五笔补码与笔画分析工具')}

${sep()}
${h('命令列表：')}

  ${ok('identifier')} <汉字> [字根1 字根2 ...]
    判断汉字是否有末笔识别码（补码），并给出识别码候选

  ${ok('strokes')} <字根1> [字根2 ...]
    通过字根列表计算汉字总笔画数

  ${ok('radical')} <字根>
    查询字根的键位、笔画数、笔型序列、末笔信息

  ${ok('analyze')} <汉字> <字型1-3> [字根1 字根2 ...]
    完整编码推导（字型: 1=左右 2=上下 3=杂合）

  ${ok('table')}
    显示完整末笔识别码对照表

  ${ok('help')}
    显示此帮助

${sep()}
${h('示例：')}

  # 判断"汉"有没有补码
  node run.js identifier 汉 氵又

  # 计算"明"的笔画数（日+月）
  node run.js strokes 日 月

  # 查询"氵"的字根信息
  node run.js radical 氵

  # 完整分析"汉"（左右型=1，字根：氵+又）
  node run.js analyze 汉 1 氵 又

  # 显示识别码表
  node run.js table

${sep()}
`);
}

// ── 主入口 ────────────────────────────────────

const [,, cmd, ...rest] = process.argv;

switch ((cmd || 'help').toLowerCase()) {
  case 'identifier':  cmdIdentifier(rest); break;
  case 'strokes':     cmdStrokes(rest); break;
  case 'radical':     cmdRadical(rest); break;
  case 'analyze':     cmdAnalyze(rest); break;
  case 'table':       cmdTable(); break;
  case 'help':
  default:            cmdHelp(); break;
}
