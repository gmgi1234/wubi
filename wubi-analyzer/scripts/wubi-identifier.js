/**
 * 五笔补码与笔画分析核心逻辑
 */

const {
  RADICAL_DB,
  KEY_NAME_CHARS,
  CHAR_RADICAL_MAP,
  SINGLE_STROKE_CHARS,
  IDENTIFIER_TABLE,
  STROKE_NAMES,
  STRUCT_NAMES,
} = require('./radical-stroke-db');

// ─────────────────────────────────────────────
//  辅助：判断字符类型
// ─────────────────────────────────────────────

/** 是否键名字 */
function isKeyName(char) {
  return KEY_NAME_CHARS.has(char);
}

/** 是否成字字根 */
function isCharRadical(char) {
  return Object.prototype.hasOwnProperty.call(CHAR_RADICAL_MAP, char);
}

/** 是否单笔画字 */
function isSingleStroke(char) {
  return SINGLE_STROKE_CHARS.has(char);
}

/** 是否在字根库中 */
function isRadical(radical) {
  return Object.prototype.hasOwnProperty.call(RADICAL_DB, radical);
}

// ─────────────────────────────────────────────
//  1. 判断汉字是否需要末笔识别码（补码）
// ─────────────────────────────────────────────

/**
 * 判断汉字是否有末笔识别码（补码）
 * @param {string} char   - 汉字
 * @param {string[]} roots - 字根拆分数组（从左到右/从上到下顺序）
 * @returns {{ hasIdentifier: boolean, reason: string }}
 */
function checkIdentifier(char, roots = []) {
  if (isKeyName(char)) {
    return {
      hasIdentifier: false,
      reason: `「${char}」是键名字，编码为连击本键四次，无补码`,
    };
  }

  if (isSingleStroke(char)) {
    return {
      hasIdentifier: false,
      reason: `「${char}」是单笔画字，使用特殊编码，无补码`,
    };
  }

  if (isCharRadical(char)) {
    return {
      hasIdentifier: false,
      reason: `「${char}」是成字字根，按"报户口"规则编码（键名+首笔+次笔），无补码`,
    };
  }

  if (roots.length === 0) {
    return {
      hasIdentifier: null,
      reason: `需要提供字根拆分才能判断（字根数未知）`,
    };
  }

  if (roots.length >= 4) {
    return {
      hasIdentifier: false,
      reason: `「${char}」字根数=${roots.length}，取前4个字根，编码满四位，无补码`,
    };
  }

  return {
    hasIdentifier: true,
    reason: `「${char}」字根数=${roots.length}，不足四位，需追加末笔识别码`,
  };
}

// ─────────────────────────────────────────────
//  2. 计算末笔识别码键位
// ─────────────────────────────────────────────

/**
 * 根据末笔笔型和字型结构计算识别码
 * @param {number} lastStroke  - 末笔笔型 1-5
 * @param {number} structType  - 字型结构 1=左右 2=上下 3=杂合
 * @returns {{ code: number, key: string, description: string }}
 */
function calcIdentifierKey(lastStroke, structType) {
  if (!IDENTIFIER_TABLE[lastStroke] || !IDENTIFIER_TABLE[lastStroke][structType]) {
    return null;
  }
  const key = IDENTIFIER_TABLE[lastStroke][structType];
  const code = lastStroke * 10 + structType;
  return {
    code,
    key,
    strokeName: STROKE_NAMES[lastStroke],
    structName: STRUCT_NAMES[structType],
    description: `末笔=${STROKE_NAMES[lastStroke]}(${lastStroke}) × 字型=${STRUCT_NAMES[structType]}(${structType}) → 识别码=${code} → 键位 ${key}`,
  };
}

// ─────────────────────────────────────────────
//  3. 查询字根笔画信息
// ─────────────────────────────────────────────

/**
 * 查询字根的笔画信息
 * @param {string} radical - 字根
 * @returns {object|null}
 */
function getRadicalInfo(radical) {
  const info = RADICAL_DB[radical];
  if (!info) return null;

  const strokeSeqStr = info.strokeSeq
    .map(s => STROKE_NAMES[s])
    .join('→');

  return {
    radical,
    key: info.key,
    zone: info.zone,
    pos: info.pos,
    strokes: info.strokes,
    strokeSeq: info.strokeSeq,
    strokeSeqStr,
    lastStroke: info.lastStroke,
    lastStrokeName: STROKE_NAMES[info.lastStroke],
  };
}

// ─────────────────────────────────────────────
//  4. 计算汉字总笔画数（通过字根累加）
// ─────────────────────────────────────────────

/**
 * 通过字根拆分计算汉字总笔画数
 * @param {string[]} roots - 字根数组
 * @returns {{ total: number, detail: Array, unknowns: string[] }}
 */
function calcTotalStrokes(roots) {
  let total = 0;
  const detail = [];
  const unknowns = [];

  for (const r of roots) {
    const info = RADICAL_DB[r];
    if (info) {
      total += info.strokes;
      detail.push({ radical: r, strokes: info.strokes });
    } else {
      unknowns.push(r);
      detail.push({ radical: r, strokes: '?' });
    }
  }

  return { total, detail, unknowns };
}

// ─────────────────────────────────────────────
//  5. 综合分析（完整编码推导）
// ─────────────────────────────────────────────

/**
 * 综合分析一个汉字的五笔相关信息
 * @param {string} char       - 汉字
 * @param {string[]} roots    - 字根拆分数组
 * @param {number} structType - 字型结构(1-3)，仅在需要识别码时必填
 * @returns {object}
 */
function analyzeChar(char, roots = [], structType = null) {
  const result = {
    char,
    roots,
    charType: null,
    hasIdentifier: null,
    identifierInfo: null,
    strokeInfo: null,
    encoding: [],
    summary: '',
  };

  // 判断字符类型
  if (isKeyName(char)) {
    result.charType = '键名字';
    result.hasIdentifier = false;
    const db = RADICAL_DB[char];
    if (db) result.encoding = [db.key, db.key, db.key, db.key];
    result.summary = `【键名字】连击 ${result.encoding[0] || '?'} 键四次：${result.encoding.join('')}`;
    return result;
  }

  if (isSingleStroke(char)) {
    result.charType = '单笔画字';
    result.hasIdentifier = false;
    result.summary = `【单笔画字】使用特殊编码规则`;
    return result;
  }

  if (isCharRadical(char)) {
    result.charType = '成字字根';
    result.hasIdentifier = false;
    const enc = CHAR_RADICAL_MAP[char];
    result.encoding = enc || [];
    result.summary = `【成字字根】报户口编码：${result.encoding.join('')}（键名+首笔+次笔）`;
    return result;
  }

  // 普通汉字
  result.charType = '普通汉字';

  // 笔画统计
  if (roots.length > 0) {
    result.strokeInfo = calcTotalStrokes(roots);
  }

  // 补码判断
  const identCheck = checkIdentifier(char, roots);
  result.hasIdentifier = identCheck.hasIdentifier;

  if (result.hasIdentifier === true) {
    // 需要识别码，计算末笔
    const lastRoot = roots[roots.length - 1];
    const lastRootInfo = RADICAL_DB[lastRoot];
    const lastStroke = lastRootInfo ? lastRootInfo.lastStroke : null;

    if (lastStroke && structType) {
      result.identifierInfo = calcIdentifierKey(lastStroke, structType);
      // 构造编码
      const rootKeys = roots.slice(0, 3).map(r => RADICAL_DB[r] ? RADICAL_DB[r].key : '?');
      result.encoding = [...rootKeys, result.identifierInfo.key];
    } else {
      result.identifierInfo = {
        description: lastStroke
          ? `末笔=${STROKE_NAMES[lastStroke]}(${lastStroke})，但未提供字型结构，无法确定识别码`
          : `末笔字根「${lastRoot}」不在数据库中`,
      };
      const rootKeys = roots.slice(0, 3).map(r => RADICAL_DB[r] ? RADICAL_DB[r].key : '?');
      result.encoding = [...rootKeys, '?'];
    }
  } else if (result.hasIdentifier === false && roots.length >= 4) {
    // 字根数够，直接截取
    result.encoding = roots.slice(0, 4).map(r => RADICAL_DB[r] ? RADICAL_DB[r].key : '?');
  }

  // 汇总摘要
  const encStr = result.encoding.join('') || '?';
  if (result.hasIdentifier === true && result.identifierInfo) {
    result.summary = `【普通字】字根${roots.length}个 → 有补码 | ${result.identifierInfo.description} | 编码：${encStr}`;
  } else if (result.hasIdentifier === false) {
    result.summary = `【普通字】字根${roots.length}个 → 无补码 | 编码：${encStr}`;
  } else {
    result.summary = `【普通字】${identCheck.reason}`;
  }

  return result;
}

module.exports = {
  isKeyName,
  isCharRadical,
  isSingleStroke,
  isRadical,
  checkIdentifier,
  calcIdentifierKey,
  getRadicalInfo,
  calcTotalStrokes,
  analyzeChar,
  STROKE_NAMES,
  STRUCT_NAMES,
  IDENTIFIER_TABLE,
};
