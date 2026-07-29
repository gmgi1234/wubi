/**
 * 五笔字根笔画数据库（86版）
 *
 * ★ 数据来源：用户提供的权威字根键位对应表（完整 1:1 对齐）。
 *   重建日期：2026-07-09。
 *
 * 数据结构：
 * RADICAL_DB[字根] = {
 *   key: 键位字母,
 *   zone: 区号(1-5),
 *   pos: 位号(1-5),
 *   strokes: 笔画数,
 *   strokeSeq: 笔型序列（1横/含提 2竖/含竖钩 3撇 4捺/点 5折）,
 *   lastStroke: 末笔笔型(1-5)
 * }
 *
 * ★ 笔型编码：
 *   1 = 横（含提）
 *   2 = 竖（含竖钩）
 *   3 = 撇
 *   4 = 捺（含点）
 *   5 = 折（各种折/弯/钩）
 *
 * ★ 末笔特殊规定（补码判断依据）：
 *   - 力、刀、九、匕 等：末笔为折（5）
 *   - 我、贱 等：末笔为撇（3）
 *   - 义、太、勺 等：末笔为点捺（4）
 *   - 廴、辶：末笔为捺（4）
 *
 * ★ strokeSeq 标注约定：
 *   末笔（lastStroke）经严格核对，是补码判断的唯一依据。
 *   strokeSeq（笔型序列）用于显示，对多数基础字根已核对；
 *   个别 CJK 扩展区部件 / 描述性部件（[長头] 等）的 strokeSeq
 *   标注为「待核」，如有出入以 lastStroke 为准。
 */

const RADICAL_DB = {
  // ============================================================
  //  一区：横起笔
  // ============================================================

  // ── G键 (11) 王旁青头戋五一 ──
  '龶': { key: 'G', zone: 1, pos: 1, strokes: 5, strokeSeq: [1,2,1,1,2], lastStroke: 2 },   // 青头，待核
  '五': { key: 'G', zone: 1, pos: 1, strokes: 4, strokeSeq: [1,5,1,1], lastStroke: 1 },
  '一': { key: 'G', zone: 1, pos: 1, strokes: 1, strokeSeq: [1], lastStroke: 1 },
  '𤣩': { key: 'G', zone: 1, pos: 1, strokes: 5, strokeSeq: [1,1,2,1,1], lastStroke: 1 },   // 斜玉旁，待核
  '王': { key: 'G', zone: 1, pos: 1, strokes: 4, strokeSeq: [1,1,2,1], lastStroke: 1 },
  '㇀': { key: 'G', zone: 1, pos: 1, strokes: 1, strokeSeq: [1], lastStroke: 1 },            // 提（归横）
  '戋': { key: 'G', zone: 1, pos: 1, strokes: 5, strokeSeq: [1,1,5,3,4], lastStroke: 4 },   // 待核

  // ── F键 (12) 土士二干十寸雨 ──
  '土': { key: 'F', zone: 1, pos: 2, strokes: 3, strokeSeq: [1,2,1], lastStroke: 1 },
  '士': { key: 'F', zone: 1, pos: 2, strokes: 3, strokeSeq: [1,2,1], lastStroke: 1 },
  '二': { key: 'F', zone: 1, pos: 2, strokes: 2, strokeSeq: [1,1], lastStroke: 1 },
  '干': { key: 'F', zone: 1, pos: 2, strokes: 3, strokeSeq: [1,1,2], lastStroke: 2 },
  '𰀁': { key: 'F', zone: 1, pos: 2, strokes: 2, strokeSeq: [1,5], lastStroke: 5 },         // 待核
  '十': { key: 'F', zone: 1, pos: 2, strokes: 2, strokeSeq: [1,2], lastStroke: 2 },
  '寸': { key: 'F', zone: 1, pos: 2, strokes: 3, strokeSeq: [1,2,4], lastStroke: 4 },
  '雨': { key: 'F', zone: 1, pos: 2, strokes: 8, strokeSeq: [1,2,1,4,4,4,4,1], lastStroke: 1 },
  '丄': { key: 'F', zone: 1, pos: 2, strokes: 3, strokeSeq: [2,1,1], lastStroke: 1 },       // 待核
  '[革后]': { key: 'F', zone: 1, pos: 2, strokes: 4, strokeSeq: [1,2,2,1], lastStroke: 1 }, // 革之后半，待核

  // ── D键 (13) 大犬三羊古石厂 ──
  '大': { key: 'D', zone: 1, pos: 3, strokes: 3, strokeSeq: [1,3,4], lastStroke: 4 },
  '犬': { key: 'D', zone: 1, pos: 3, strokes: 4, strokeSeq: [1,3,4,4], lastStroke: 4 },
  '三': { key: 'D', zone: 1, pos: 3, strokes: 3, strokeSeq: [1,1,1], lastStroke: 1 },
  '古': { key: 'D', zone: 1, pos: 3, strokes: 5, strokeSeq: [1,2,1,2,1], lastStroke: 1 },
  '石': { key: 'D', zone: 1, pos: 3, strokes: 5, strokeSeq: [1,3,2,1,2], lastStroke: 2 },
  '厂': { key: 'D', zone: 1, pos: 3, strokes: 2, strokeSeq: [1,3], lastStroke: 3 },
  '𠂇': { key: 'D', zone: 1, pos: 3, strokes: 2, strokeSeq: [1,3], lastStroke: 3 },          // 大头左部，待核
  '丆': { key: 'D', zone: 1, pos: 3, strokes: 2, strokeSeq: [1,3], lastStroke: 3 },          // 待核
  '龵': { key: 'D', zone: 1, pos: 3, strokes: 4, strokeSeq: [3,3,1,2], lastStroke: 2 },      // 羊头/看头，待核
  '[長头]': { key: 'D', zone: 1, pos: 3, strokes: 4, strokeSeq: [1,5,1,3], lastStroke: 3 },  // 長之头部，待核
  '镸': { key: 'D', zone: 1, pos: 3, strokes: 8, strokeSeq: [1,5,1,3,1,1,5,4], lastStroke: 4 }, // 長变体，待核

  // ── S键 (14) 木丁西 ──
  '木': { key: 'S', zone: 1, pos: 4, strokes: 4, strokeSeq: [1,2,3,4], lastStroke: 4 },
  '朩': { key: 'S', zone: 1, pos: 4, strokes: 4, strokeSeq: [1,2,3,4], lastStroke: 4 },      // 木底（无撇），待核
  '丁': { key: 'S', zone: 1, pos: 4, strokes: 2, strokeSeq: [1,5], lastStroke: 5 },
  '西': { key: 'S', zone: 1, pos: 4, strokes: 6, strokeSeq: [1,2,1,5,1,2], lastStroke: 2 },
  '覀': { key: 'S', zone: 1, pos: 4, strokes: 6, strokeSeq: [1,2,5,1,2,1], lastStroke: 1 },  // 西头/要头，待核

  // ── A键 (15) 工戈草头右框七 ──
  // '一' 双归属：G区为主，A区条目已按要求删除
  '工': { key: 'A', zone: 1, pos: 5, strokes: 3, strokeSeq: [1,2,1], lastStroke: 1 },
  '戈': { key: 'A', zone: 1, pos: 5, strokes: 4, strokeSeq: [1,3,5,4], lastStroke: 4 },
  '弋': { key: 'A', zone: 1, pos: 5, strokes: 3, strokeSeq: [1,3,5], lastStroke: 5 },        // ★末笔5(折)，按字根表
  '艹': { key: 'A', zone: 1, pos: 5, strokes: 3, strokeSeq: [1,2,2], lastStroke: 2 },        // 草头，待核
  '[++]': { key: 'A', zone: 1, pos: 5, strokes: 3, strokeSeq: [1,1,1], lastStroke: 1 },      // 草头变体(++)，待核
  '匚': { key: 'A', zone: 1, pos: 5, strokes: 2, strokeSeq: [1,5], lastStroke: 5 },
  '匸': { key: 'A', zone: 1, pos: 5, strokes: 2, strokeSeq: [1,5], lastStroke: 5 },          // 待核
  '七': { key: 'A', zone: 1, pos: 5, strokes: 2, strokeSeq: [1,5], lastStroke: 5 },
  '𠤎': { key: 'A', zone: 1, pos: 5, strokes: 2, strokeSeq: [1,5], lastStroke: 5 },          // 待核
  '龷': { key: 'A', zone: 1, pos: 5, strokes: 4, strokeSeq: [1,2,1,2], lastStroke: 2 },      // 共头，待核
  '廾': { key: 'A', zone: 1, pos: 5, strokes: 3, strokeSeq: [1,3,2], lastStroke: 2 },        // 待核
  '卄': { key: 'A', zone: 1, pos: 5, strokes: 3, strokeSeq: [1,3,2], lastStroke: 2 },        // 廿变体，待核
  '廿': { key: 'A', zone: 1, pos: 5, strokes: 4, strokeSeq: [1,2,1,2], lastStroke: 2 },

  // ============================================================
  //  二区：竖起笔
  // ============================================================

  // ── H键 (21) 目具上止卜虎皮 ──
  '丨': { key: 'H', zone: 2, pos: 1, strokes: 1, strokeSeq: [2], lastStroke: 2 },
  '亅': { key: 'H', zone: 2, pos: 1, strokes: 1, strokeSeq: [2], lastStroke: 2 },            // 竖钩归竖
  '止': { key: 'H', zone: 2, pos: 1, strokes: 4, strokeSeq: [2,1,2,1], lastStroke: 1 },
  '龰': { key: 'H', zone: 2, pos: 1, strokes: 3, strokeSeq: [2,1,2], lastStroke: 2 },        // 走之底变体，待核
  '卜': { key: 'H', zone: 2, pos: 1, strokes: 2, strokeSeq: [2,4], lastStroke: 4 },
  '⺊': { key: 'H', zone: 2, pos: 1, strokes: 2, strokeSeq: [2,4], lastStroke: 4 },          // 卜变体
  '目': { key: 'H', zone: 2, pos: 1, strokes: 5, strokeSeq: [2,1,2,1,1], lastStroke: 1 },
  '且': { key: 'H', zone: 2, pos: 1, strokes: 5, strokeSeq: [2,5,1,1,1], lastStroke: 1 },    // 待核
  '上': { key: 'H', zone: 2, pos: 1, strokes: 3, strokeSeq: [2,1,2], lastStroke: 2 },
  '[皮前]': { key: 'H', zone: 2, pos: 1, strokes: 3, strokeSeq: [5,3,4], lastStroke: 4 },    // 皮之前部，待核
  '[具头]': { key: 'H', zone: 2, pos: 1, strokes: 3, strokeSeq: [2,1,2], lastStroke: 2 },    // 具之头部，待核
  '[虎头]': { key: 'H', zone: 2, pos: 1, strokes: 4, strokeSeq: [2,1,5,3], lastStroke: 3 },  // 虎之头部(虍)，待核

  // ── J键 (22) 日早两竖与虫 ──
  '早': { key: 'J', zone: 2, pos: 2, strokes: 6, strokeSeq: [2,1,2,1,1,2], lastStroke: 2 },
  '虫': { key: 'J', zone: 2, pos: 2, strokes: 6, strokeSeq: [2,1,2,1,4,2], lastStroke: 2 },
  '刂': { key: 'J', zone: 2, pos: 2, strokes: 2, strokeSeq: [2,2], lastStroke: 2 },
  '〢': { key: 'J', zone: 2, pos: 2, strokes: 2, strokeSeq: [2,2], lastStroke: 2 },          // 两竖变体
  '曰': { key: 'J', zone: 2, pos: 2, strokes: 4, strokeSeq: [2,1,2,1], lastStroke: 1 },
  '日': { key: 'J', zone: 2, pos: 2, strokes: 4, strokeSeq: [2,1,2,1], lastStroke: 1 },
  '𫩏': { key: 'J', zone: 2, pos: 2, strokes: 4, strokeSeq: [2,1,2,1], lastStroke: 1 },      // 临头，待核

  // ── K键 (23) 口与川 ──
  '川': { key: 'K', zone: 2, pos: 3, strokes: 3, strokeSeq: [3,2,2], lastStroke: 2 },
  '口': { key: 'K', zone: 2, pos: 3, strokes: 3, strokeSeq: [2,1,2], lastStroke: 2 },

  // ── L键 (24) 田甲四车力 ──
  '田': { key: 'L', zone: 2, pos: 4, strokes: 5, strokeSeq: [2,5,1,2,1], lastStroke: 1 },
  '甲': { key: 'L', zone: 2, pos: 4, strokes: 5, strokeSeq: [2,5,1,2,1], lastStroke: 1 },
  '囗': { key: 'L', zone: 2, pos: 4, strokes: 3, strokeSeq: [2,5,1], lastStroke: 1 },        // 大框，待核
  '四': { key: 'L', zone: 2, pos: 4, strokes: 5, strokeSeq: [2,5,1,5,1], lastStroke: 1 },
  '罒': { key: 'L', zone: 2, pos: 4, strokes: 5, strokeSeq: [2,5,2,2,1], lastStroke: 1 },    // 横目/四头，待核
  '𡆧': { key: 'L', zone: 2, pos: 4, strokes: 5, strokeSeq: [2,5,1,5,1], lastStroke: 1 },    // 待核
  '车': { key: 'L', zone: 2, pos: 4, strokes: 4, strokeSeq: [1,5,2,1], lastStroke: 1 },
  '車': { key: 'L', zone: 2, pos: 4, strokes: 7, strokeSeq: [1,2,5,1,2,1,1], lastStroke: 1 }, // 車繁体，待核
  '力': { key: 'L', zone: 2, pos: 4, strokes: 2, strokeSeq: [5,5], lastStroke: 5 },          // ★末笔5(折) 按规定
  '[婁头]': { key: 'L', zone: 2, pos: 4, strokes: 6, strokeSeq: [2,1,2,1,2,1], lastStroke: 1 }, // 婁之头部，待核
  '皿': { key: 'L', zone: 2, pos: 4, strokes: 5, strokeSeq: [2,5,2,2,1], lastStroke: 1 },    // ★本轮新增

  // ── M键 (25) 山由贝骨下框几 ──
  '由': { key: 'M', zone: 2, pos: 5, strokes: 5, strokeSeq: [2,5,1,2,1], lastStroke: 1 },
  '贝': { key: 'M', zone: 2, pos: 5, strokes: 4, strokeSeq: [2,5,1,4], lastStroke: 4 },
  '貝': { key: 'M', zone: 2, pos: 5, strokes: 7, strokeSeq: [2,5,1,1,1,3,4], lastStroke: 4 }, // 貝繁体，待核
  '冂': { key: 'M', zone: 2, pos: 5, strokes: 2, strokeSeq: [2,5], lastStroke: 5 },          // 下框，待核
  '𠘨': { key: 'M', zone: 2, pos: 5, strokes: 3, strokeSeq: [3,5,4], lastStroke: 4 },        // 几变体，待核
  '几': { key: 'M', zone: 2, pos: 5, strokes: 2, strokeSeq: [3,5], lastStroke: 5 },
  '𠘧': { key: 'M', zone: 2, pos: 5, strokes: 3, strokeSeq: [3,5,2], lastStroke: 2 },        // 待核
  '山': { key: 'M', zone: 2, pos: 5, strokes: 3, strokeSeq: [2,5,2], lastStroke: 2 },
  '冎': { key: 'M', zone: 2, pos: 5, strokes: 5, strokeSeq: [2,5,1,3,5], lastStroke: 5 },    // 骨头，待核

  // ============================================================
  //  三区：撇起笔
  // ============================================================

  // ── Q键 (35) 金鱼儿 ──
  '丿': { key: 'Q', zone: 3, pos: 5, strokes: 1, strokeSeq: [3], lastStroke: 3 },            // ★单撇归Q（按权威表）
  '𱼀': { key: 'Q', zone: 3, pos: 5, strokes: 1, strokeSeq: [3], lastStroke: 3 },            // 待核
  '⺈': { key: 'Q', zone: 3, pos: 5, strokes: 2, strokeSeq: [3,5], lastStroke: 5 },          // 角头，待核
  '勹': { key: 'Q', zone: 3, pos: 5, strokes: 2, strokeSeq: [3,5], lastStroke: 5 },
  '夕': { key: 'Q', zone: 3, pos: 5, strokes: 3, strokeSeq: [3,5,4], lastStroke: 4 },        // 待核
  '金': { key: 'Q', zone: 3, pos: 5, strokes: 8, strokeSeq: [3,1,1,3,4,4,2,4], lastStroke: 4 },
  '钅': { key: 'Q', zone: 3, pos: 5, strokes: 5, strokeSeq: [3,1,1,5,2], lastStroke: 2 },
  '[犭前]': { key: 'Q', zone: 3, pos: 5, strokes: 3, strokeSeq: [3,5,3], lastStroke: 3 },    // 反犬旁前部，待核
  '𠚤': { key: 'Q', zone: 3, pos: 5, strokes: 3, strokeSeq: [3,5,4], lastStroke: 4 },        // 待核
  '乂': { key: 'Q', zone: 3, pos: 5, strokes: 2, strokeSeq: [3,4], lastStroke: 4 },          // 待核
  '㐅': { key: 'Q', zone: 3, pos: 5, strokes: 2, strokeSeq: [3,4], lastStroke: 4 },          // 待核
  '𠂊': { key: 'Q', zone: 3, pos: 5, strokes: 2, strokeSeq: [3,5], lastStroke: 5 },          // 待核
  '儿': { key: 'Q', zone: 3, pos: 5, strokes: 2, strokeSeq: [3,5], lastStroke: 5 },
  '𫶧': { key: 'Q', zone: 3, pos: 5, strokes: 6, strokeSeq: [3,3,1,3,4,5], lastStroke: 5 },  // 待核
  '[乐头]': { key: 'Q', zone: 3, pos: 5, strokes: 3, strokeSeq: [3,5,4], lastStroke: 4 },    // 乐之头部，待核
  '[𬼖框]': { key: 'Q', zone: 3, pos: 5, strokes: 3, strokeSeq: [3,5,4], lastStroke: 4 },    // 待核
  '[鱼头]': { key: 'Q', zone: 3, pos: 5, strokes: 5, strokeSeq: [3,5,1,2,1], lastStroke: 1 }, // ★本轮 H→Q

  // ── W键 (34) 人八 ──
  '八': { key: 'W', zone: 3, pos: 4, strokes: 2, strokeSeq: [3,4], lastStroke: 4 },
  '癶': { key: 'W', zone: 3, pos: 4, strokes: 5, strokeSeq: [5,4,3,4,3], lastStroke: 3 },    // 登头，待核
  '人': { key: 'W', zone: 3, pos: 4, strokes: 2, strokeSeq: [3,4], lastStroke: 4 },
  '亻': { key: 'W', zone: 3, pos: 4, strokes: 2, strokeSeq: [3,2], lastStroke: 2 },
  '𠆢': { key: 'W', zone: 3, pos: 4, strokes: 2, strokeSeq: [3,4], lastStroke: 4 },          // 人字头，待核

  // ── E键 (33) 月彡乃用豕 ──
  '用': { key: 'E', zone: 3, pos: 3, strokes: 5, strokeSeq: [3,5,2,1,2], lastStroke: 2 },
  '冃': { key: 'E', zone: 3, pos: 3, strokes: 4, strokeSeq: [2,5,1,1], lastStroke: 1 },      // 冃(曰上无头)，待核
  '乃': { key: 'E', zone: 3, pos: 3, strokes: 2, strokeSeq: [3,5], lastStroke: 5 },
  // '𠄎' 双归属：N区为主，E区条目已按要求删除
  '月': { key: 'E', zone: 3, pos: 3, strokes: 4, strokeSeq: [3,5,1,1], lastStroke: 1 },
  '爫': { key: 'E', zone: 3, pos: 3, strokes: 4, strokeSeq: [3,4,4,4], lastStroke: 4 },      // 爪头，待核
  '[豸头]': { key: 'E', zone: 3, pos: 3, strokes: 3, strokeSeq: [3,3,3], lastStroke: 3 },    // 豸之头部，待核
  '豕': { key: 'E', zone: 3, pos: 3, strokes: 7, strokeSeq: [3,3,1,3,4,5,4], lastStroke: 4 },
  '[豸底]': { key: 'E', zone: 3, pos: 3, strokes: 4, strokeSeq: [3,4,5,4], lastStroke: 4 },  // 豸之底部，待核
  '𧘇': { key: 'E', zone: 3, pos: 3, strokes: 3, strokeSeq: [3,4,4], lastStroke: 4 },        // 衣底，待核
  '彡': { key: 'E', zone: 3, pos: 3, strokes: 3, strokeSeq: [3,3,3], lastStroke: 3 },
  '[長底]': { key: 'E', zone: 3, pos: 3, strokes: 4, strokeSeq: [1,1,5,4], lastStroke: 4 },  // 長之底部，待核
  '[艮下]': { key: 'E', zone: 3, pos: 3, strokes: 4, strokeSeq: [1,1,5,4], lastStroke: 4 },  // 艮之下部，待核
  '[舟底]': { key: 'E', zone: 3, pos: 3, strokes: 4, strokeSeq: [3,5,1,1], lastStroke: 1 },  // 舟之底部，待核
  '𧰨': { key: 'E', zone: 3, pos: 3, strokes: 3, strokeSeq: [3,3,3], lastStroke: 3 },        // 待核

  // ── R键 (32) 白手看头三拂 ──
  '白': { key: 'R', zone: 3, pos: 2, strokes: 5, strokeSeq: [3,2,1,2,1], lastStroke: 1 },
  '斤': { key: 'R', zone: 3, pos: 2, strokes: 4, strokeSeq: [3,3,2,1], lastStroke: 1 },
  '扌': { key: 'R', zone: 3, pos: 2, strokes: 3, strokeSeq: [1,2,5], lastStroke: 5 },
  '手': { key: 'R', zone: 3, pos: 2, strokes: 4, strokeSeq: [3,1,2,5], lastStroke: 5 },
  // '龵' 双归属：D区为主，R区条目已按要求删除
  '𠂆': { key: 'R', zone: 3, pos: 2, strokes: 2, strokeSeq: [1,3], lastStroke: 3 },          // 待核
  '[牛前]': { key: 'R', zone: 3, pos: 2, strokes: 3, strokeSeq: [3,1,2], lastStroke: 2 },    // 牛之前部，待核
  '𰀪': { key: 'R', zone: 3, pos: 2, strokes: 4, strokeSeq: [3,3,1,2], lastStroke: 2 },      // 看头，待核

  // ── T键 (31) 禾竹一撇双人立反文条头 ──
  '𠂉': { key: 'T', zone: 3, pos: 1, strokes: 2, strokeSeq: [3,1], lastStroke: 1 },          // 待核
  // '亻' 双归属：W区为主，T区条目已按要求删除
  '彳': { key: 'T', zone: 3, pos: 1, strokes: 3, strokeSeq: [3,3,2], lastStroke: 2 },
  '禾': { key: 'T', zone: 3, pos: 1, strokes: 5, strokeSeq: [3,1,2,3,4], lastStroke: 4 },
  '夂': { key: 'T', zone: 3, pos: 1, strokes: 3, strokeSeq: [3,5,4], lastStroke: 4 },        // 待核
  '⺮': { key: 'T', zone: 3, pos: 1, strokes: 6, strokeSeq: [3,4,2,3,4,2], lastStroke: 2 },  // 竹头，待核
  '竹': { key: 'T', zone: 3, pos: 1, strokes: 6, strokeSeq: [3,4,2,3,4,2], lastStroke: 2 },
  '攵': { key: 'T', zone: 3, pos: 1, strokes: 4, strokeSeq: [3,1,3,4], lastStroke: 4 },

  // ============================================================
  //  四区：捺/点起笔
  // ============================================================

  // ── Y键 (41) 言文方广在四一 ──
  '丶': { key: 'Y', zone: 4, pos: 1, strokes: 1, strokeSeq: [4], lastStroke: 4 },
  '言': { key: 'Y', zone: 4, pos: 1, strokes: 7, strokeSeq: [4,1,2,1,1,2,1], lastStroke: 1 },
  '讠': { key: 'Y', zone: 4, pos: 1, strokes: 2, strokeSeq: [4,5], lastStroke: 5 },
  '文': { key: 'Y', zone: 4, pos: 1, strokes: 4, strokeSeq: [4,1,3,4], lastStroke: 4 },
  '方': { key: 'Y', zone: 4, pos: 1, strokes: 4, strokeSeq: [4,1,5,5], lastStroke: 5 },
  '广': { key: 'Y', zone: 4, pos: 1, strokes: 3, strokeSeq: [4,1,3], lastStroke: 3 },
  '[京头]': { key: 'Y', zone: 4, pos: 1, strokes: 3, strokeSeq: [4,1,2], lastStroke: 2 },    // 京之头部(亠+口)，待核
  '亠': { key: 'Y', zone: 4, pos: 1, strokes: 2, strokeSeq: [4,1], lastStroke: 1 },
  '[隹右]': { key: 'Y', zone: 4, pos: 1, strokes: 4, strokeSeq: [3,2,1,1], lastStroke: 1 },  // 隹之右部，待核

  // ── U键 (42) 立辛两点六病门 ──
  '立': { key: 'U', zone: 4, pos: 2, strokes: 5, strokeSeq: [4,1,2,4,1], lastStroke: 1 },
  '[立头]': { key: 'U', zone: 4, pos: 2, strokes: 2, strokeSeq: [4,1], lastStroke: 1 },      // 立之头部(辛上)，待核
  '辛': { key: 'U', zone: 4, pos: 2, strokes: 7, strokeSeq: [4,1,1,2,1,1,2], lastStroke: 2 },
  '冫': { key: 'U', zone: 4, pos: 2, strokes: 2, strokeSeq: [4,4], lastStroke: 4 },
  '⺀': { key: 'U', zone: 4, pos: 2, strokes: 2, strokeSeq: [4,4], lastStroke: 4 },          // 两点变体
  '丷': { key: 'U', zone: 4, pos: 2, strokes: 2, strokeSeq: [3,4], lastStroke: 4 },          // 八字两点，待核
  '䒑': { key: 'U', zone: 4, pos: 2, strokes: 3, strokeSeq: [1,2,2], lastStroke: 2 },        // 草头变体，待核
  '丬': { key: 'U', zone: 4, pos: 2, strokes: 3, strokeSeq: [4,1,2], lastStroke: 2 },        // 将旁，待核
  '六': { key: 'U', zone: 4, pos: 2, strokes: 4, strokeSeq: [4,1,3,4], lastStroke: 4 },
  '门': { key: 'U', zone: 4, pos: 2, strokes: 3, strokeSeq: [4,2,2], lastStroke: 2 },
  '疒': { key: 'U', zone: 4, pos: 2, strokes: 5, strokeSeq: [4,1,3,4,2], lastStroke: 2 },

  // ── I键 (43) 水氵小 ──
  '小': { key: 'I', zone: 4, pos: 3, strokes: 3, strokeSeq: [2,4,4], lastStroke: 4 },
  '⺍': { key: 'I', zone: 4, pos: 3, strokes: 3, strokeSeq: [4,4,4], lastStroke: 4 },         // 小变体，待核
  '𭕄': { key: 'I', zone: 4, pos: 3, strokes: 3, strokeSeq: [4,4,4], lastStroke: 4 },        // 待核
  '⺌': { key: 'I', zone: 4, pos: 3, strokes: 3, strokeSeq: [4,4,4], lastStroke: 4 },        // 小头，待核
  '氵': { key: 'I', zone: 4, pos: 3, strokes: 3, strokeSeq: [4,4,3], lastStroke: 3 },
  '[兴头]': { key: 'I', zone: 4, pos: 3, strokes: 3, strokeSeq: [4,4,4], lastStroke: 4 },    // 兴之头部，待核
  '[水侧]': { key: 'I', zone: 4, pos: 3, strokes: 3, strokeSeq: [4,4,3], lastStroke: 3 },    // 水之侧部，待核
  '𡭔': { key: 'I', zone: 4, pos: 3, strokes: 3, strokeSeq: [4,4,4], lastStroke: 4 },        // 待核
  '[氺侧]': { key: 'I', zone: 4, pos: 3, strokes: 4, strokeSeq: [4,4,4,4], lastStroke: 4 },  // 氺之侧部，待核
  '𣥂': { key: 'I', zone: 4, pos: 3, strokes: 5, strokeSeq: [4,4,4,4,4], lastStroke: 4 },    // 待核
  '氺': { key: 'I', zone: 4, pos: 3, strokes: 5, strokeSeq: [4,4,4,4,4], lastStroke: 4 },    // 水变体，待核
  '水': { key: 'I', zone: 4, pos: 3, strokes: 4, strokeSeq: [2,5,3,4], lastStroke: 4 },

  // ── O键 (44) 火业广鹿米灬 ──
  '火': { key: 'O', zone: 4, pos: 4, strokes: 4, strokeSeq: [3,4,3,4], lastStroke: 4 },
  '米': { key: 'O', zone: 4, pos: 4, strokes: 6, strokeSeq: [4,1,2,3,4,3], lastStroke: 3 },
  '灬': { key: 'O', zone: 4, pos: 4, strokes: 4, strokeSeq: [4,4,4,4], lastStroke: 4 },

  // ── P键 (45) 之宝盖补衤 ──
  '廴': { key: 'P', zone: 4, pos: 5, strokes: 2, strokeSeq: [5,4], lastStroke: 4 },          // ★末笔4(捺) 按规定
  '辶': { key: 'P', zone: 4, pos: 5, strokes: 3, strokeSeq: [4,5,4], lastStroke: 4 },
  '宀': { key: 'P', zone: 4, pos: 5, strokes: 3, strokeSeq: [4,5,4], lastStroke: 4 },        // ★修正：原[4,2,4]，宝盖末笔应为捺
  '冖': { key: 'P', zone: 4, pos: 5, strokes: 2, strokeSeq: [4,5], lastStroke: 5 },          // 秃宝盖，待核
  '之': { key: 'P', zone: 4, pos: 5, strokes: 3, strokeSeq: [4,5,4], lastStroke: 4 },
  '[衣示旁]': { key: 'P', zone: 4, pos: 5, strokes: 4, strokeSeq: [4,2,3,4], lastStroke: 4 }, // 衤/礻合并项，待核

  // ============================================================
  //  五区：折起笔
  // ============================================================

  // ── X键 (55) 丝幺弓 ──
  '匕': { key: 'X', zone: 5, pos: 5, strokes: 2, strokeSeq: [3,5], lastStroke: 5 },          // ★末笔5(折)
  // '𠤎' 双归属：A区为主，X区条目已按要求删除
  '弓': { key: 'X', zone: 5, pos: 5, strokes: 3, strokeSeq: [5,1,5], lastStroke: 5 },
  '幺': { key: 'X', zone: 5, pos: 5, strokes: 3, strokeSeq: [5,4,5], lastStroke: 5 },
  '糹': { key: 'X', zone: 5, pos: 5, strokes: 6, strokeSeq: [5,5,5,5,4,3], lastStroke: 3 },  // 纟繁体，待核
  '纟': { key: 'X', zone: 5, pos: 5, strokes: 3, strokeSeq: [5,5,4], lastStroke: 4 },
  '[母框]': { key: 'X', zone: 5, pos: 5, strokes: 5, strokeSeq: [5,5,4,1,1], lastStroke: 1 }, // 母之框部，待核
  '[乡前]': { key: 'X', zone: 5, pos: 5, strokes: 3, strokeSeq: [5,5,3], lastStroke: 3 },    // 乡之前部，待核

  // ── C键 (54) 又厶马 ──
  '又': { key: 'C', zone: 5, pos: 4, strokes: 2, strokeSeq: [5,4], lastStroke: 4 },          // ★修正：原[3,4]，首笔为折
  '龴': { key: 'C', zone: 5, pos: 4, strokes: 3, strokeSeq: [5,1,2], lastStroke: 2 },        // 待核
  '厶': { key: 'C', zone: 5, pos: 4, strokes: 2, strokeSeq: [5,4], lastStroke: 4 },          // ★修正：原[3,5]，厶首笔折末笔点
  'ス': { key: 'C', zone: 5, pos: 4, strokes: 2, strokeSeq: [5,1], lastStroke: 1 },          // 待核
  '巴': { key: 'C', zone: 5, pos: 4, strokes: 4, strokeSeq: [5,2,5,1], lastStroke: 1 },
  '马': { key: 'C', zone: 5, pos: 4, strokes: 3, strokeSeq: [5,1,5], lastStroke: 5 },
  '馬': { key: 'C', zone: 5, pos: 4, strokes: 10, strokeSeq: [1,2,1,1,3,3,3,4,4,4], lastStroke: 4 }, // 馬繁体，待核

  // ── V键 (53) 女刀九臼 ──
  '刀': { key: 'V', zone: 5, pos: 3, strokes: 2, strokeSeq: [5,3], lastStroke: 5 },          // ★修正：lastStroke 3→5，按力刀九匕规定
  '彐': { key: 'V', zone: 5, pos: 3, strokes: 3, strokeSeq: [5,1,1], lastStroke: 1 },        // 待核
  '女': { key: 'V', zone: 5, pos: 3, strokes: 3, strokeSeq: [5,3,1], lastStroke: 1 },
  '巛': { key: 'V', zone: 5, pos: 3, strokes: 3, strokeSeq: [5,5,5], lastStroke: 5 },
  '臼': { key: 'V', zone: 5, pos: 3, strokes: 6, strokeSeq: [3,2,1,3,2,1], lastStroke: 1 },
  '𦥑': { key: 'V', zone: 5, pos: 3, strokes: 6, strokeSeq: [3,2,1,3,2,1], lastStroke: 1 },  // 待核
  '九': { key: 'V', zone: 5, pos: 3, strokes: 2, strokeSeq: [3,5], lastStroke: 5 },          // ★本轮新增

  // ── B键 (52) 子耳了也乃 ──
  '耳': { key: 'B', zone: 5, pos: 2, strokes: 6, strokeSeq: [1,2,1,2,1,2], lastStroke: 2 },
  '子': { key: 'B', zone: 5, pos: 2, strokes: 3, strokeSeq: [5,1,5], lastStroke: 5 },
  '了': { key: 'B', zone: 5, pos: 2, strokes: 2, strokeSeq: [5,5], lastStroke: 5 },
  '卩': { key: 'B', zone: 5, pos: 2, strokes: 2, strokeSeq: [5,2], lastStroke: 2 },          // 待核
  '阝': { key: 'B', zone: 5, pos: 2, strokes: 3, strokeSeq: [5,2,5], lastStroke: 5 },        // 双耳旁
  '凵': { key: 'B', zone: 5, pos: 2, strokes: 2, strokeSeq: [2,5], lastStroke: 5 },          // 待核
  '也': { key: 'B', zone: 5, pos: 2, strokes: 3, strokeSeq: [5,2,5], lastStroke: 5 },        // ★修正：原[5,1,5]，第二笔是竖不是横
  '㔾': { key: 'B', zone: 5, pos: 2, strokes: 2, strokeSeq: [5,5], lastStroke: 5 },          // 待核
  '𠄐': { key: 'B', zone: 5, pos: 2, strokes: 3, strokeSeq: [5,1,5], lastStroke: 5 },        // 待核
  '巜': { key: 'B', zone: 5, pos: 2, strokes: 3, strokeSeq: [5,5,5], lastStroke: 5 },        // 待核

  // ── N键 (51) 已半巳满不出己 ──
  '已': { key: 'N', zone: 5, pos: 1, strokes: 3, strokeSeq: [5,1,5], lastStroke: 5 },
  '乙': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // ★单折归N（按权威表，X区已删）
  'コ': { key: 'N', zone: 5, pos: 1, strokes: 2, strokeSeq: [1,5], lastStroke: 5 },          // 待核
  '忄': { key: 'N', zone: 5, pos: 1, strokes: 3, strokeSeq: [4,4,2], lastStroke: 2 },
  '心': { key: 'N', zone: 5, pos: 1, strokes: 4, strokeSeq: [4,4,4,4], lastStroke: 4 },      // ★修正：原[5,4,4,4]，心首笔为点
  '㇟': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 竖弯钩归折
  '己': { key: 'N', zone: 5, pos: 1, strokes: 3, strokeSeq: [5,1,5], lastStroke: 5 },
  '巳': { key: 'N', zone: 5, pos: 1, strokes: 3, strokeSeq: [5,1,5], lastStroke: 5 },
  '尸': { key: 'N', zone: 5, pos: 1, strokes: 3, strokeSeq: [5,1,3], lastStroke: 3 },        // 待核
  '𠃊': { key: 'N', zone: 5, pos: 1, strokes: 2, strokeSeq: [2,5], lastStroke: 5 },          // 待核
  '乛': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 横钩归折
  '⺗': { key: 'N', zone: 5, pos: 1, strokes: 3, strokeSeq: [4,4,4], lastStroke: 4 },        // 心底，待核
  '㇉': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 竖折折归折
  '𠃌': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 待核
  '𠄌': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 待核
  '𠃍': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 待核
  '㇇': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 横撇归折
  '𠃑': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 待核
  '𡿨': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 待核
  '𠃋': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 待核
  '𠄎': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // ★ E/N 双归属，待核
  '㇂': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 待核
  '𠃜': { key: 'N', zone: 5, pos: 1, strokes: 1, strokeSeq: [5], lastStroke: 5 },            // 待核
  '羽': { key: 'N', zone: 5, pos: 1, strokes: 6, strokeSeq: [5,1,4,5,1,4], lastStroke: 4 },  // ★本轮新增
};

/**
 * 键名字（连击四次本键）
 * 无末笔识别码
 */
const KEY_NAME_CHARS = new Set([
  '王','土','大','木','工',   // 一区
  '目','日','口','田','山',   // 二区
  '禾','白','月','人','金',   // 三区
  '言','立','水','火','之',   // 四区
  '已','子','女','又','幺',   // 五区
]);

/**
 * 成字字根（报户口：键名+首笔+次笔）
 * 无末笔识别码
 * 格式：{ 字根: [键位键名, 首笔键位, 次笔键位] }
 * 仅收录基础单字成字字根（可整字取码的）
 */
const CHAR_RADICAL_MAP = {
  // 一区成字字根
  '五': ['G','G','L'], '一': ['G','G','G'],
  '二': ['F','G','G'], '干': ['F','G','G'], '十': ['F','G','H'], '雨': ['F','G','H'],
  '三': ['D','G','G'], '石': ['D','G','T'], '厂': ['D','G','T'], '大': ['D','G','T'], '犬': ['D','G','T'],
  '丁': ['S','G','H'], '西': ['S','G','H'], '木': ['S','G','H'],
  '七': ['A','G','N'], '戈': ['A','G','T'], '工': ['A','G','A'], '廿': ['A','G','H'],
  // 二区成字字根
  '止': ['H','H','H'], '卜': ['H','H','Y'], '上': ['H','H','H'], '目': ['H','H','H'],
  '早': ['J','H','J'], '虫': ['J','H','J'], '日': ['J','H','J'], '曰': ['J','H','J'],
  '川': ['K','H','H'], '口': ['K','H','H'],
  '四': ['L','H','N'], '车': ['L','G','N'], '力': ['L','N','N'], '田': ['L','H','N'], '甲': ['L','H','N'], '皿': ['L','H','N'],
  '由': ['M','H','H'], '贝': ['M','H','N'], '山': ['M','H','M'], '几': ['M','T','N'],
  // 三区成字字根
  '竹': ['T','T','T'], '手': ['R','T','G'], '斤': ['R','T','T'], '白': ['R','T','R'],
  '彡': ['E','T','T'], '乃': ['E','T','N'], '用': ['E','T','N'], '月': ['E','T','E'], '豕': ['E','T','E'],
  '八': ['W','T','Y'], '人': ['W','T','W'],
  '鱼': ['Q','T','N'], '儿': ['Q','T','N'], '金': ['Q','T','Q'], '夕': ['Q','T','N'],
  // 四区成字字根
  '文': ['Y','Y','G'], '方': ['Y','Y','G'], '广': ['Y','Y','G'], '言': ['Y','Y','G'], '六': ['U','Y','G'],
  '辛': ['U','Y','G'], '门': ['U','Y','H'], '立': ['U','Y','U'], '疒': ['U','Y','H'],
  '小': ['I','H','Y'], '水': ['I','T','N'],
  '米': ['O','Y','G'], '火': ['O','T','O'],
  '之': ['P','Y','N'],
  // 五区成字字根
  '心': ['N','N','Y'], '羽': ['N','N','G'], '已': ['N','N','N'], '己': ['N','N','N'], '巳': ['N','N','N'], '尸': ['N','N','N'],
  '耳': ['B','G','H'], '也': ['B','N','N'], '子': ['B','N','B'], '了': ['B','N','N'],
  '女': ['V','N','T'], '刀': ['V','N','T'], '九': ['V','T','N'], '臼': ['V','T','E'],
  '又': ['C','T','Y'], '巴': ['C','N','C'], '马': ['C','N','C'],
  '幺': ['X','N','Y'], '弓': ['X','N','G'], '匕': ['X','T','X'],
};

/**
 * 单笔画字（特殊编码，无识别码）
 */
const SINGLE_STROKE_CHARS = new Set(['一', '乙', '丨', '丿', '丶', '乛']);

/**
 * 识别码区位对照表
 * [末笔(1-5)][字型(1-3)] => 键位字母
 */
const IDENTIFIER_TABLE = {
  1: { 1: 'G', 2: 'F', 3: 'D' },  // 横
  2: { 1: 'H', 2: 'J', 3: 'K' },  // 竖
  3: { 1: 'T', 2: 'R', 3: 'E' },  // 撇
  4: { 1: 'Y', 2: 'U', 3: 'I' },  // 捺
  5: { 1: 'N', 2: 'B', 3: 'V' },  // 折
};

/**
 * 笔型名称
 */
const STROKE_NAMES = {
  1: '横', 2: '竖', 3: '撇', 4: '捺/点', 5: '折'
};

/**
 * 字型名称
 */
const STRUCT_NAMES = {
  1: '左右型', 2: '上下型', 3: '杂合型'
};

module.exports = {
  RADICAL_DB,
  KEY_NAME_CHARS,
  CHAR_RADICAL_MAP,
  SINGLE_STROKE_CHARS,
  IDENTIFIER_TABLE,
  STROKE_NAMES,
  STRUCT_NAMES,
};
