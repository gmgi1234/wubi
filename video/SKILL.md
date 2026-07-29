---
name: "wubi-recitation-video"
description: "Creates word-synced Wubi webpage recitation videos. Invoke when user asks to click characters, capture screenshots, add narration, title/outro pages, or make MP4 poetry/reading videos."
---

# Wubi Recitation Video

这个 Skill 用于把五笔字根/笔画着色网页中的文章内容，做成"逐字显示 + 同步朗诵配音"的 MP4 视频。适用于用户要求"点击某段文字的每个字、依次截图、配朗诵、生成视频、添加标题页/结尾页/背景图/调整语速"的场景。

## 典型输入

- 本地 HTML 网页路径，例如 `20260622wubi-stroke-colorV20.html`
- 文章内容，例如《沁园春·雪》
- 需要制作的视频片段，例如 `北国风光，千里冰封，万里雪飘。`
- 可选要求：标题页、作者页、背景图、结尾页、语速调整

## 总体流程

1. 优先打开线上网页 `https://gmgi1234.github.io/wubi/`；如果打不开则使用备用网址 `https://wubi.netlify.app/`；两个线上网址都打不开时再使用本地 HTML 文件（需先启动 HTTP 服务）
2. 在文章模式输入全文并点击"载入文章"
3. 逐字截图（**必须等待渲染+验证五笔编码**），统一裁剪为 `1280×720`
4. 生成单字 TTS（裁静音后作为先验时长）+ 整句 TTS（含句末停顿）— **默认使用 Edge-TTS 神经语音**
5. 用动态规划+能量分析+先验信息实现读音与截图精确匹配
6. 每个句子组用图片序列 concat + 整句音频合成一个 MP4 分段
7. 用无 BOM concat 列表 + libx264 重新编码合并所有分段
8. 添加 AI 生成背景图的标题页和结尾页
9. 导出最终 MP4，严格验证文件大小和可解码性

## 默认执行方式

**必须使用自带浏览器工具（MCP browser 工具）操作网页**，包括导航、交互、执行JS、截图。不要启动外部 Chrome/Edge 进程通过 CDP 控制。

默认入口：

```text
https://gmgi1234.github.io/wubi/
```

如果上述网址打不开，则使用备用网址：

```text
https://wubi.netlify.app/
```

两个线上网址都打不开时，再使用本地 HTML 文件（需先启动 HTTP 服务，详见"本地网页打开方式"）。

默认规则：

- 必须把用户给的全文载入网页的"文章模式"
- 必须逐字调用网页自身的 `jumpToArticleChar(idx)` 切换显示
- 每个字切换后必须调用 `showAll()`，确保五笔拆分和笔画着色完整显示
- 每一帧主画面必须来自网页真实渲染截图
- 截图必须包含中间大汉字、下方控制区、右侧"五笔编码"和"字根着色/五笔拆分"区域
- 不要只截中间大字，不要漏掉右侧五笔拆分信息

## 本地网页打开方式

自带浏览器工具不能直接打开 `file://` 本地文件。需要先在网页所在目录临时启动 HTTP 服务：

```powershell
python -m http.server 8765
```

然后用自带浏览器工具（`browser_navigate`）访问：

```text
http://127.0.0.1:8765/<html-file-name>
```

完成浏览器操作后要停止临时服务。

**重要**：必须使用自带浏览器工具（MCP browser 工具）操作网页，**不要**启动外部 Chrome/Edge 进程通过 CDP 控制。

## 文章载入步骤

1. 打开网页后获取页面快照
2. 找到文章模式内容框，通常 placeholder 类似"粘贴文章内容，将依次学习其中的汉字…"
3. 填入完整文章（**必须包含标题字、作者、正文**）
4. 点击"载入文章"
5. 验证 `.article-char-chip` 数量是否正确

### 清除并重新载入

如果发现载入的内容不全，必须**先清除再重新载入**：

1. 点击页面上的"✕ 清除"按钮
2. 等待页面恢复到初始状态
3. 重新填入完整内容
4. 点击"载入文章"
5. 验证 `.article-char-chip` 数量

## 逐字截图

### 截图防相同（关键）

**最常见的严重 bug**：点击后如果立即截图，页面可能尚未渲染完成，导致所有截图完全相同（MD5 一致）。

必须遵守的截图流程：

1. 调用 `jumpToArticleChar(idx)` 切换字
2. 等待 800-1500ms 让页面渲染
3. 调用 `showAll()` 显示完整五笔拆分
4. **验证五笔编码已切换**到目标字（对比编码是否与前一个字相同）
5. 只有编码验证通过后才截图

### MCP 浏览器工具截图方式

使用 `browser_evaluate` 执行 Promise + setTimeout，等待渲染并验证编码后再用 `browser_take_screenshot` 截图：

```javascript
return new Promise(function(resolve) {
  jumpToArticleChar(idx);
  setTimeout(function() {
    if (typeof showAll === 'function') showAll();
    var infoCards = document.querySelectorAll('.info-card');
    var code = '';
    if (infoCards.length > 1) {
      var div = infoCards[1].querySelector('div');
      code = div ? div.textContent.trim().substring(0,10) : '';
    }
    resolve('idx=' + idx + ' code=' + code);
  }, 1000);
});
```

### Playwright 批量截图（长文章推荐）

当文章超过 30 个汉字时，MCP 浏览器工具逐字截图调用次数过多，推荐用 Playwright 批量截图：

```python
from playwright.async_api import async_playwright

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, args=['--window-size=1464,798'])
        page = await browser.new_page(viewport={'width': 1464, 'height': 798})
        await page.goto(HTTP_URL, wait_until='networkidle')
        # 填入文章、点击载入
        # 循环截图
        for i in range(N_CHARS):
            code = await page.evaluate(f"""
            () => new Promise((resolve) => {{
                jumpToArticleChar({i});
                setTimeout(() => {{
                    showAll();
                    let code = '';
                    const infoCards = document.querySelectorAll('.info-card');
                    if (infoCards.length > 1) {{
                        const div = infoCards[1].querySelector('div');
                        code = div ? div.textContent.trim().substring(0,10) : '';
                    }}
                    resolve(code);
                }}, 1200);
            }})
            """)
            await page.screenshot(path=f"char_{i:03d}.png")
        await browser.close()
```

### 截图后 MD5 验证

```python
import hashlib
hashes = [hashlib.md5(open(f,'rb').read()).hexdigest() for f in screenshot_files]
unique = len(set(hashes))
if unique < len(hashes) * 0.9:
    print("WARNING: 截图可能有重复！")
```

### 截图中间区域 MD5 检查（关键）

**整体 MD5 唯一不等于截图正确**：渲染延迟时，网格高亮位置不同导致整体图像不同，但中间大字区域可能仍是前一个字。

必须额外检查中间大字区域（约 440,80 到 840,480）的 MD5：

```python
from PIL import Image
center_hashes = {}
for f in screenshot_files:
    img = Image.open(f).convert('RGB')
    center = img.crop((440, 80, 840, 480))
    h = hashlib.md5(center.tobytes()).hexdigest()
    center_hashes[f] = h
# 找出中间区域相同的截图组
rev = defaultdict(list)
for f, h in center_hashes.items():
    rev[h].append(f)
dups = {h: fs for h, fs in rev.items() if len(fs) > 1}
if dups:
    print("WARNING: 中间大字区域有重复！需重新截图！")
```

### TTS 缓存失效（重要）

脚本通常用 `if not os.path.exists(raw_wav)` 跳过已存在的 TTS 文件。以下情况**必须删除旧 TTS 文件**：

1. **修改多音字替换字后**：否则会使用旧读音
   ```python
   # 包括: sentence_XX_raw.wav, sentence_XX.wav, char_XX_原字_raw.wav, char_XX_原字.wav
   ```

2. **修改句子分组后**（如拆分/合并/重排）：旧索引的TTS内容与新分组不对应
   ```python
   # 必须清除整个音频目录，全部重新生成
   # 否则sentence_28_raw.wav可能还是旧分组的内容
   ```

3. **劳动视频的教训**：把"原始社会从没有人类到有人类"拆成两组后，group 29的TTS复用了旧缓存（完整句的音频），导致两组播放了相同音频。

> **⚠️ PowerShell 删除中文文件名的坑：**
> PowerShell 的 `Remove-Item 'char_012_露*'` 对中文通配符匹配可能失败，导致旧文件没被删除，TTS 仍用旧读音。
> 
> **正确做法**：用 Python 删除，或用 `Get-ChildItem -Filter` + `ForEach-Object` 管道：
> ```powershell
> # 正确方式
> Get-ChildItem 'path' -Filter 'char_012*' | ForEach-Object { Remove-Item $_.FullName -Force }
> ```
> 
> **最保险做法**：清空整个 char_audio 和 audio 目录，全部重新生成：
> ```powershell
> Get-ChildItem 'path\char_audio' | Remove-Item -Force
> Get-ChildItem 'path\audio' | Remove-Item -Force
> ```

## 截图裁剪范围

- 16:9 横屏画面，输出尺寸 `1280×720`
- 浏览器窗口 `1464×798`
- 裁剪范围：`(210, 0, 1184, 598)`，保留中间大汉字、右侧五笔编码和字根着色区域

```python
crop = (210, 0, 1184, 598)
output = crop.resize((1280, 720), Image.Resampling.LANCZOS)
```

截图前准备：

```javascript
document.documentElement.style.zoom = '100%';
window.scrollTo(0, 0);
```

## TTS 配音

**默认使用 Edge-TTS 神经语音**（推荐），替代旧的 Windows SAPI Huihui。Edge-TTS 是微软 Azure 神经网络语音的免费 Python 封装，无需 API 密钥，语音质量远超 SAPI。

### Edge-TTS 生成 TTS（推荐）

```python
import edge_tts
import asyncio

async def generate_edge_tts(text, output_wav, voice="zh-CN-YunyangNeural", rate="-20%", pitch="+0Hz"):
    """用edge-tts生成神经语音TTS，输出WAV"""
    # 应用多音字替换
    tts_text = text
    for orig, repl in TTS_REPLACE.items():
        tts_text = tts_text.replace(orig, repl)

    mp3_path = output_wav.replace('.wav', '.mp3')
    communicate = edge_tts.Communicate(tts_text, voice, rate=rate, pitch=pitch)
    await communicate.save(mp3_path)

    # MP3转WAV（22050Hz mono，供DP分析）
    cmd = f'"{FFMPEG}" -y -i "{mp3_path}" -ar 22050 -ac 1 "{output_wav}"'
    subprocess.run(cmd, shell=True, capture_output=True, timeout=30)
    if os.path.exists(mp3_path):
        os.remove(mp3_path)

def generate_tts(text, output_path):
    """同步包装"""
    if os.path.exists(output_path):
        return
    asyncio.run(generate_edge_tts(text, output_path))
```

安装：`pip install edge-tts`

### 推荐中文神经声音

| 声音ID | 名称 | 性别 | 特点 |
|--------|------|------|------|
| zh-CN-YunyangNeural | 云扬 | 男 | 播报风格，清晰专业（默认） |
| zh-CN-XiaoxiaoNeural | 晓晓 | 女 | 温暖亲切，适合诗词朗诵 |
| zh-CN-YunxiNeural | 云希 | 男 | 沉稳有力，适合叙事 |
| zh-CN-XiaoyiNeural | 晓伊 | 女 | 活泼轻快 |

### 语速/音调/音量参数

| 参数 | 范围 | 推荐值 | 说明 |
|------|------|--------|------|
| rate | -100%~+100% | -20% | 诗词朗诵从容舒缓 |
| pitch | -100Hz~+100Hz | +0Hz | 默认即可，需要沉稳可-10Hz |
| volume | -100%~+100% | +0% | 默认即可 |

可按句子类型动态调整：标题庄重(rate=-15%)、正文舒缓(rate=-20%)、末句悠长(rate=-25%)。

### 多音字处理

Edge-TTS 神经语音更智能，部分多音字能自动识别语境，但保险起见仍保留同音字替换。**解决方案**：用同音字替换生成 TTS，画面仍显示原字。

```python
# 多音字映射：原字 → TTS替换字
tts_replace = {
    "种": "仲",  # zhòng（播种）
    "斜": "霞",  # xiá（古诗古音，与花押韵）
}
```

常用多音字替换表（SAPI和Edge-TTS通用）：

| 原字 | 替换字 | 正确读音 | 场景 |
|------|--------|----------|------|
| 种 | 仲 | zhòng | 播种、种地（默认读zhǒng） |
| 背 | 碑 | bēi | 背包、背包袱 |
| 藏 | 葬 | zàng | 西藏（默认读cáng） |
| 宁 | 柠 | níng | 宁夏（可能读nìng） |
| 重 | 仲 | zhòng | 重量 |
| 长 | 常 | cháng | 长短 |
| 行 | 航 | háng | 银行 |
| 朝 | 潮 | cháo | 朝代 |
| 露 | 鹿 | lù | 朝露（默认读lòu） |
| 待 | 代 | dài | 待日晞（默认读dāi） |
| 少 | 邵 | shào | 少壮（默认读shǎo） |
| 衰 | 催 | cuī | 华叶衰（默认读shuāi） |
| 乐 | 月 | yuè | 音乐、乐府（默认读lè） |
| 分 | 份 | fèn | 分明、分开（默认读fēn） |
| 見 | 现 | xiàn | 见牛羊（繁体"見"读xiàn） |
| 斜 | 霞 | xiá | 万竿斜（古诗古音，与花押韵，默认读xié） |

### 多音字按位置替换（重要）

**同一字在不同位置可能需要不同读音**。不能全局替换，需要按字符在文章中的位置区分：

```python
# 种字示例：zhǒng(种类) vs zhòng(种植)
# 只有这些位置的种读zhòng(仲)，其余读zhǒng(SAPI默认)
ZHONG4_POSITIONS = {288, 308}  # 种地、种的

def generate_tts(text, output_path, char_positions=None):
    """按位置决定是否替换种字"""
    tts_text = text
    if char_positions:
        chars = list(tts_text)
        for rel_idx, global_idx in char_positions:
            if chars[rel_idx] == '种' and global_idx in ZHONG4_POSITIONS:
                chars[rel_idx] = '仲'
        tts_text = ''.join(chars)
    # ... 生成TTS
```

**劳动视频的教训**：全局替换种→仲导致"有一种""这种"读成zhòng(第四声)，应为zhǒng(第三声)。

## 音画匹配方案（v10，唯一推荐方案）

整句 TTS 朗读自然流畅，但每字发音时长不均匀。用"动态规划 + 能量分析 + 先验信息"实现精确匹配。

### 句子分组策略（关键经验）

**分组质量直接决定DP匹配效果**。来自敕勒歌和劳动视频的经验：

1. **自然断句优先**：按语义完整的句子/分句分组，不要把本应在一起的句子拆开
   - 正确："不愿意参加劳动工作就是错误吗"（完整一句）
   - 错误："不愿意参加劳动工" / "作就是错误吗"（拆断自然句）

2. **短句优先但不要过度拆分**：短句(2-5字)DP搜索空间小、匹配准确，但过度拆分会使TTS不自然
   - 江南视频40字9组(平均4.4字/组)匹配最好
   - 敕勒歌34字10组(平均3.4字/组)效果也好
   - 劳动视频632字67组(平均9.4字/组)适中

3. **不要跨组拆分词语**：如"人类"不能拆成"人"在第一组末尾、"类"在第二组开头

4. **对话标记单独成组**："甲说""乙说"等短句单独一组，停顿0.25-0.30s

5. **朝代单独成组**：古诗标题中的朝代（如"唐""宋"）单独一组，停顿0.50s，让朝代和作者之间有自然分隔。咏柳视频经验：将"唐贺知章"拆为"唐"(0.50s)+"贺知章"(0.30s)效果更好。

### 停顿时间标准（重要）

**停顿时间影响DP匹配质量和观感**。按句子长度分档设置：

| 句子长度 | 停顿范围 | 说明 |
|----------|----------|------|
| 长句(≥10字) | 0.50-0.80s | 句号结尾0.60-0.80s，逗号结尾0.50s |
| 中句(5-9字) | 0.40-0.60s | 问句0.60s，陈述0.40-0.50s |
| 短句(≤4字) | 0.25-0.40s | "甲说"等0.30s，单字0.25s |
| 末句 | 1.00-1.50s | 文章最后一句加长停顿收尾 |

**劳动视频的教训**：后半段停顿0.3s太短导致音画不同步，提高到0.5s+后改善。前后半段停顿标准应保持一致。

### SAPI TTS 重复朗读 Bug

**SAPI对某些文本会重复朗读**，如"原始社会从没有人类到有人类"被读两遍。

**解决方案**：在文本中加逗号分隔，打断SAPI的重复触发：

```python
# 原文: "原始社会从没有人类到有人类"  → SAPI重复朗读
# 改为: "原始社会从没有人类，到有人类"  → 正常朗读
# 注意：逗号不占字符索引，只是TTS朗读时的停顿提示
```

**不要用拆分两组的方式解决**：拆开后"人"和"类"分在不同组，TTS朗读"人"时会带上"类"的音，导致音画不同步。

### 完整流程

**Step 1：生成单字 TTS（先验信息）**

每个汉字单独生成 TTS，**裁剪静音后**计算时长作为先验：

```python
# 生成单字TTS
generate_tts(tts_ch, raw_path)
# 裁剪静音（关键！不裁静音的先验时长含大量静音，会导致DP匹配不准）
trim_silence(raw_path, trimmed_path, threshold=0.01)
prior_dur = get_audio_duration(trimmed_path)
```

裁静音用 ffmpeg 的 silenceremove 滤镜：

```python
def trim_silence(wav_path, output_path, threshold=0.01):
    cmd = (
        f'"{FFMPEG}" -y -i "{wav_path}" '
        f'-af "silenceremove=start_periods=1:start_duration=0.1:start_threshold={threshold}:'
        f'stop_periods=-1:stop_duration=0.15:stop_threshold={threshold}" '
        f'-ar 22050 -ac 1 "{output_path}"'
    )
```

**Step 2：生成整句 TTS + 句末停顿追加到音频末尾**

```python
# 生成整句TTS
generate_tts(tts_text, raw_wav)
# 句末停顿追加到音频末尾（不是加到最后一字duration上！）
cmd = (
    f'"{FFMPEG}" -y -i "{raw_wav}" '
    f'-f lavfi -t {pause} -i anullsrc=channel_layout=mono:sample_rate=22050 '
    f'-filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[a]" '
    f'-map "[a]" -ar 22050 -ac 1 "{final_wav}"'
)
```

**Step 3：动态规划分析字边界（严格对标悯农v10，勿改！）**

用**原始 WAV**（不含句末停顿）分析能量曲线，找候选字边界，用 DP 选最优边界组合。

> **⚠️ 重要：以下代码经过多次验证，是唯一可靠的DP实现。不要修改代价函数、能量计算方式或回溯逻辑！**

关键参数和实现细节（每个都不可省略）：

```python
def analyze_char_boundaries_dp(wav_path, num_chars, prior_durations):
    wf = wave.open(wav_path, 'rb')
    sample_rate = wf.getframerate()
    n_frames = wf.getnframes()
    sampwidth = wf.getsampwidth()
    frames = wf.readframes(n_frames)
    wf.close()
    
    if sampwidth == 2:
        fmt = '<' + 'h' * (len(frames) // 2)
        samples = struct.unpack(fmt, frames)
    else:
        return [1.0 / num_chars] * num_chars
    
    # ① 短时能量用RMS（energy**0.5），不是原始能量
    frame_size = int(sample_rate * 0.005)  # 5ms帧长
    energies = []
    for i in range(0, len(samples) - frame_size, frame_size):
        chunk = samples[i:i + frame_size]
        energy = sum(s * s for s in chunk) / len(chunk)
        energies.append(energy ** 0.5)  # RMS！不是energy本身
    
    # ② 归一化
    max_energy = max(energies) if energies else 1
    energies = [e / max_energy for e in energies]
    
    # ③ 裁掉尾部静音，只分析有效语音段（能量>0.05）
    effective_end = len(energies)
    for i in range(len(energies) - 1, -1, -1):
        if energies[i] > 0.05:
            effective_end = i + 1
            break
    energies = energies[:effective_end]
    
    # ④ 平滑（窗口=4）
    smoothed = []
    window = 4
    for i in range(len(energies)):
        si = max(0, i - window)
        ei = min(len(energies), i + window + 1)
        smoothed.append(sum(energies[si:ei]) / (ei - si))
    
    frame_time = 0.005
    total_frames = len(smoothed)
    total_dur = total_frames * frame_time
    
    # ⑤ 候选边界：局部10帧最大值*0.7作为阈值
    candidates = [0]
    for i in range(2, total_frames - 2):
        if smoothed[i] <= smoothed[i-1] and smoothed[i] <= smoothed[i+1]:
            local_max = max(smoothed[max(0,i-10):min(len(smoothed),i+10)])
            if smoothed[i] < local_max * 0.7:
                candidates.append(i)
    candidates.append(total_frames - 1)
    candidates = sorted(set(candidates))
    
    # ⑥ 先验比例
    prior_sum = sum(prior_durations)
    prior_ratios = [d / prior_sum for d in prior_durations]
    
    # ⑦ DP：逐段比例偏差作为代价（不是累计偏差！）
    n_cand = len(candidates)
    INF = float('inf')
    dp = [[INF] * n_cand for _ in range(num_chars + 1)]
    parent = [[-1] * n_cand for _ in range(num_chars + 1)]
    dp[0][0] = 0
    min_seg_dur = 0.08  # 80ms最小段长
    
    for i in range(1, num_chars + 1):
        for j in range(i - 1, n_cand):
            for k in range(i - 1, j + 1):
                if dp[i-1][k] == INF:
                    continue
                seg_dur = (candidates[j] - candidates[k]) * frame_time
                if seg_dur < min_seg_dur:
                    continue
                seg_ratio = seg_dur / total_dur
                cost = abs(seg_ratio - prior_ratios[i-1])  # 逐段比例偏差
                total_cost = dp[i-1][k] + cost
                if total_cost < dp[i][j]:
                    dp[i][j] = total_cost
                    parent[i][j] = k
    
    # ⑧ 失败时放宽到50ms重试（代码同上，省略）
    
    # ⑨ 回溯：从最后一个候选点开始（强制最后一字对齐音频末尾）
    boundaries = []
    j = n_cand - 1  # 关键！从末尾开始
    for i in range(num_chars, 0, -1):
        k = parent[i][j]
        boundaries.append(candidates[j])
        j = k
    boundaries.reverse()
    boundaries[0] = 0
    
    # ⑩ 计算每字时长，最小0.1s
    char_durations = []
    for i in range(num_chars):
        if i + 1 < len(boundaries):
            dur = (boundaries[i+1] - boundaries[i]) * frame_time
        else:
            dur = (total_frames - 1 - boundaries[i]) * frame_time
        char_durations.append(max(0.1, dur))
    
    return char_durations
```

> **❌ 失败做法（勿用）：**
> 1. **用累计时长偏差作为代价**（`|实际累计时间 - 期望累计时间|`）：前期误差会累积传播，效果不如逐段比例偏差
> 2. **用原始能量而非RMS**：原始能量动态范围太大，小能量的谷值被淹没
> 3. **不裁尾部静音**：尾部静音会被误认为最后一字的时长，导致末字过长
> 4. **不裁局部最大值，用全局最大值*0.7**：全局阈值在能量变化大的句子中会漏掉有效谷值
> 5. **回溯时不从最后一个候选点开始**：末字不会对齐音频末尾，导致音画不同步
> 6. **候选点不足时插入均匀分布点**：人工插入的候选点不是真正的能量谷，会干扰DP选择

**Step 4：句末停顿加到最后一字 duration**

DP 分析得到的是有效语音段内的字时长，句末停顿需要加到最后一字的显示时长上，让图片序列总时长 = 含停顿音频时长：

```python
char_durs = analyze_char_boundaries_dp(raw_wav, num_chars, prior)
char_durs[-1] += pause  # 关键！否则-shortest会截断视频
```

**Step 5：最后一字太短时从前面借时间**

```python
last_dur = char_durations[-1]
expected_last = prior_ratios[-1] * total_dur
if last_dur < expected_last * 0.5:
    deficit = expected_last - last_dur
    max_idx = max(range(len(char_durations)-1), key=lambda x: char_durations[x])
    if char_durations[max_idx] > deficit + 0.1:
        char_durations[max_idx] -= deficit
        char_durations[-1] = expected_last
```

### 语速设置

- 推荐诗词朗诵 `rate="-20%"`（从容舒缓）
- `rate="-15%"` 略快，适合标题/作者
- `rate="-25%"` 更慢，适合末句悠长收尾
- 播放音频用原始 WAV，**不裁静音**，保留字间自然停顿
- Edge-TTS 输出 MP3，需用 ffmpeg 转 WAV（22050Hz mono）供 DP 分析

## MP4 合成

### 句子组分段（唯一推荐方案）

1. 按句子分组，每组生成一个 MP4（图片序列 concat + 整句音频）
2. 图片序列用 ffmpeg concat demuxer，每张图指定 duration
3. 音频用含句末停顿的整句 WAV
4. `-shortest` 让视频跟随音频时长

```python
# 图片序列concat列表
lines = []
for i in range(start, end):
    lines.append(f"file '{img_path}'")
    lines.append(f"duration {char_durations[i]:.4f}")
# 最后一张图片再写一次file（concat demuxer要求）
lines.append(f"file '{last_img}'")

# 合成组视频
cmd = (
    f'"{FFMPEG}" -y -f concat -safe 0 -i "{list_file}" '
    f'-i "{audio_path}" '
    f'-c:v libx264 -profile:v baseline -pix_fmt yuv420p '
    f'-c:a aac -b:a 128k -ar 44100 -ac 1 '
    f'-r 25 -shortest "{group_video}"'
)
```

### ffmpeg 完整版路径

```text
C:\Users\10061\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\vm\tools\bin\ffmpeg.cmd
```

编码参数：

```text
Video: H.264 / libx264, profile baseline, yuv420p, 1280x720, 25fps
Audio: AAC, 44100 Hz, mono, 128k
```

### 最终合并

用 concat demuxer 合并所有分段（标题页 + 句子组 + 结尾页），**必须用 libx264 重新编码**（不要用 `-c copy`，否则不同分段编码参数不一致会导致合并失败）：

```python
cmd = (
    f'"{FFMPEG}" -y -f concat -safe 0 -i "{concat_list}" '
    f'-c:v libx264 -profile:v baseline -pix_fmt yuv420p '
    f'-c:a aac -b:a 128k -ar 44100 -ac 1 -r 25 "{temp_output}"'
)
```

### concat 列表注意

不能带 UTF-8 BOM，必须用无 BOM UTF-8 写入：

```python
with open(list_file, 'wb') as f:
    f.write(("\n".join(lines) + "\n").encode("utf-8"))
```

Windows 路径建议转成正斜杠 `/`。

## 避免 0KB 文件

1. 先在临时目录生成临时 MP4
2. 验证临时 MP4 大小正常后，再复制到最终目录
3. 最终文件使用新文件名，避免旧文件缓存或占用
4. 最终文件设置只读 `os.chmod(path, 0o444)`
5. 输出后等待 5 秒再次检查文件大小

## 标题页与结尾页

### AI 背景图生成

默认使用 AI 图像生成工具原创生成背景图，**背景图上不要有任何汉字**，标题文字用 PIL 后续叠加。

提示词方向根据文章内容选择合适的场景，强调"no text, no characters, no letters"：

```text
[PURPOSE]: Background image for Chinese recitation video cover
[DESCRIPTION]: A warm, heartwarming scene of a father and young son walking together outdoors in golden afternoon light. The father has his hand on the boy's shoulder, both seen from behind, walking toward a sunlit path. The boy carries a small backpack. Soft cinematic warm tones, golden hour lighting. Clean, unobstructed center for text overlay. No text, no characters, no letters, no words in the image. 16:9 horizontal composition.
```

### 标题页制作

用 PIL 在 AI 背景图上直接叠加文字（**不要半透明背景条**，用阴影增强可读性）：

```python
from PIL import Image, ImageDraw, ImageFont

img = Image.open(bg_image).resize((1280, 720), Image.Resampling.LANCZOS)
draw = ImageDraw.Draw(img)

# 华文楷体 STKAITI，标题88pt
font = ImageFont.truetype(r"C:\Windows\Fonts\STKAITI.TTF", 88)
bbox = draw.textbbox((0, 0), title, font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
tx, ty = (1280 - tw) // 2, 260

# 阴影 + 白色主文字
so = 3
draw.text((tx + so, ty + so), title, fill=(0, 0, 0, 180), font=font)
draw.text((tx, ty), title, fill=(255, 255, 255), font=font)
img.save("title_page.png")
```

标题页 1.0 秒，结尾页 2.0 秒。

用 ffmpeg 生成标题页视频：

```text
ffmpeg -loop 1 -i title_page.png -f lavfi -t 1.0
       -i anullsrc=channel_layout=mono:sample_rate=44100
       -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest title.mp4
```

## 相同字过渡动画

当文章中有连续相同的字（如"粒粒"），两个相同截图之间需要过渡动画区分：

```python
# 创建暗化过渡帧（原截图亮度降至85%）
orig_img = Image.open(char_screenshot).convert('RGBA')
darkened = orig_img.point(lambda p: int(p * 0.85))
darkened.convert('RGB').save(transition_frame)

# 在两个相同字之间插入0.15秒过渡帧
# 前后字各减0.075秒，总时长不变
```

## 验证

至少做三类验证：

1. **文件大小验证**：`Get-Item '<final.mp4>' | Select-Object Name,Length`
2. **ffmpeg 解码验证**：`ffmpeg -v error -i '<final.mp4>' -t 3 -f null -`
3. **延迟复查**：等待 5 秒后再次检查文件大小

完成条件：文件不是 0KB、大小符合预期（1MB 以上）、ffmpeg 验证退出码为 0、延迟复查后大小仍正常。

## 常见问题

### 截图全部相同（读音与画面不匹配）

**根因**：点击后立即截图，页面尚未渲染完成。

**解决**：用 Promise + setTimeout(1000ms) 等待渲染，验证五笔编码已切换后再截图。编码相同则增加到 1500ms 重新截图。

### 截图截到前一个字

**根因**：页面渲染延迟，800ms 等待不足。

**解决**：增加到 1500ms 等待时间，编码验证对比前后字编码是否相同。

### 多音字读音错误

**根因**：SAPI 默认选择最常用读音，不考虑语境。

**解决**：用同音字替换生成 TTS（如"仲"替代"种"、"碑"替代"背"），画面仍显示原字。

### 音画不匹配（字显示和读音对不上）

**根因**：单字 TTS 先验时长未裁静音，或句末停顿未加到最后一字 duration，或句子分组不合理导致DP搜索空间过大。

**解决**：
1. 单字 TTS 必须用 `silenceremove` 裁静音后再计算先验时长
2. 句末停顿必须追加到音频末尾，同时加到最后一字 duration
3. DP 参数必须用 5ms 帧长、0.7 阈值、80ms 最小段长
4. **句子分组要自然且短**：每组2-5字效果最好（江南、敕勒歌经验）
5. **停顿时间要够**：长句0.50-0.80s，短句0.25-0.40s，太短会导致音画不同步
6. **前后半段停顿标准要一致**：不要只调后半段

### SAPI 重复朗读某句话

**根因**：SAPI 对某些特定文本组合会重复朗读（如"原始社会从没有人类到有人类"读两遍）。

**解决**：在文本中加逗号分隔打断SAPI重复触发："原始社会从没有人类，到有人类"。不要拆分成两组（会拆断词语）。

### 修改分组后旧TTS被复用

**根因**：脚本用 `if os.path.exists()` 跳过已有文件，修改分组后旧索引的TTS内容与新分组不对应。

**解决**：修改分组后必须清除整个音频目录，全部重新生成。使用新的音频目录名（如 `sentences_v5`）最保险。

### 最终 MP4 变成 0 字节

**根因**：同名文件被反复覆盖或被其他进程占用。

**解决**：每次输出用新文件名，复制到最终目录后设置只读属性，等待 5 秒后复查。

### ffmpeg 不支持 -loop

**根因**：系统 PATH 中的 ffmpeg 是精简版。

**解决**：使用完整版 ffmpeg 路径 `C:\Users\10061\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\vm\tools\bin\ffmpeg.cmd`。

## 成功版本记录

### 咏柳（v1 Edge-TTS版）★当前最新

- 使用线上网页 `https://gmgi1234.github.io/wubi/`，共 34 个汉字。
- **TTS引擎**：Edge-TTS `zh-CN-YunyangNeural`（云扬神经语音），`rate="-20%"`，`pitch="+0Hz"`。
- **截图方式**：Playwright 批量截图 34 张，1500ms 等待 + showAll() + 编码验证。
- 裁剪参数 `crop = (210, 0, 1184, 598)`，输出 `1280×720`。
- **多音字处理**：无需替换。
- **分组策略**：7组（标题2字+朝代1字+作者3字+4句各7字），朝代单独一组停顿0.50s。
- **停顿标准**：标题0.30s，朝代0.50s，作者0.30s，句号句0.50s，末句1.00s。
- AI 生成春日柳树湖畔背景图，PIL 叠加华文楷体标题文字。
- 总时长 19.96 秒，1.43 MB，H.264 + AAC。
- 成功文件名：`yongliu_v1.mp4`。
- **首个使用 Edge-TTS 神经语音的视频，语音自然度大幅提升。**

### 风（v1）

- 使用线上网页 `https://gmgi1234.github.io/wubi/`（Playwright自动选择），共 24 个汉字。
- **截图方式**：Playwright 批量截图 24 张，1500ms 等待 + showAll() + 编码验证。
- 裁剪参数 `crop = (210, 0, 1184, 598)`，输出 `1280×720`。
- **多音字处理**：斜→霞(xiá，古诗古音，与花押韵)。
- **分组策略**：6组（标题1字+作者3字+4句各5字），平均4字/组，短句DP匹配准确。
- **停顿标准**：标题/作者0.30s，逗号句0.40s，句号句0.50s，末句1.00s。
- AI 生成秋风落叶竹林背景图，PIL 叠加华文楷体标题文字。
- 总时长 15.76 秒，1.16 MB，H.264 + AAC。
- 成功文件名：`feng_v1.mp4`。

### 中国省份口诀（v1）

- 使用本地 HTML `20260622wubi-stroke-colorV20.html`，共 140 个汉字（口诀+省份对应说明）。
- **截图方式**：Playwright 批量截图 140 张，MCP 浏览器工具修复个别错误截图。
  - Playwright：1200ms 等待 + showAll() + 编码验证
  - MCP 浏览器工具修复：1500ms 等待 + 500ms showAll 缓冲 + 编码验证（用于修复渲染延迟）
- 裁剪参数 `crop = (170, 0, 1184, 598)`，输出 `1280×720`。
- **多音字处理**：藏(zàng,西藏) → 葬(zàng)、宁(níng,宁夏) → 柠(níng)。
- **截图中间区域 MD5 检查**：发现 chars 24-27（青甘陕还）和 char 44（应）因渲染延迟中间显示前一个字，整体 MD5 唯一但中间区域相同。用 MCP 浏览器工具重新截图修复。
- **TTS 缓存失效**：修改替换字（藏: 庄→葬）后未删除旧 TTS 文件，导致仍读旧音。需删除 `sentence_15*` 和 `char_105_藏*` 后重新生成。
- **SelectVoice 名称**：`"Microsoft Huihui Desktop"`（不带后缀），带后缀会报错。
- 整句 TTS（Rate=-2）+ DP+能量分析+先验信息，21 个句子组。
- AI 生成中国地图风格背景图，PIL 叠加华文楷体标题文字。
- 标题页 1.0 秒，结尾页 2.0 秒。
- 总时长 74.28 秒，5.03 MB，H.264 + AAC。
- 成功文件名：`shengfen_koujue_v1.mp4`。

### 养儿子的秘诀（v3）

- 使用本地 HTML `20260622wubi-stroke-colorV20.html`，共 90 个汉字。
- **截图方式**：MCP 浏览器工具截前 10 个字 + Playwright 批量截后 80 个字，90 张 MD5 全部唯一。
  - MCP 浏览器工具：`browser_evaluate` 执行 `jumpToArticleChar(idx)` + `showAll()` + 编码验证，再 `browser_take_screenshot` 截图
  - Playwright：`page.evaluate` 执行同样逻辑，`page.screenshot` 截图，循环批量处理
  - 两种方式可以混合使用，MCP 适合短文章（<30字），Playwright 适合长文章（>30字）
- 裁剪参数 `crop = (170, 0, 1184, 598)`，输出 `1280×720`。
- **多音字处理**：背(bēi,背包) → 碑(bēi) 替换生成 TTS。
- **整句 TTS**（Rate=-2）+ 动态规划+能量分析+先验信息：
  - 单字 TTS 裁静音后计算先验时长
  - 句末停顿追加到音频末尾 + 最后一字 duration
  - DP 参数：5ms 帧、0.7 阈值、80ms 最小段长
- AI 生成父子背影温馨背景图，PIL 叠加华文楷体标题文字。
- 标题页 1.0 秒，结尾页 2.0 秒。
- 合并用 libx264 重新编码（不用 -c copy）。
- 总时长 40.60 秒，2.98 MB，H.264 + AAC。
- 成功文件名：`yangnizi_secret_v3.mp4`。

### 悯农·其一（v2 修复版）

- 使用 `https://wubi.netlify.app/` 线上网页，共 27 个汉字。
- 裁剪参数 `crop = (170, 0, 1184, 598)`。
- **修复"种"字截图**：首次截图因等待不足截成了"春"字（DWJF），后用 1500ms 等待 + 编码验证 TKHH 重新截取。
- **修复"种"字读音**：SAPI 默认读 zhǒng，用同音字"仲"替换确保读 zhòng。
- 整句 TTS（Rate=-2）+ DP+能量分析+先验信息。
- 标题页：华文楷体 STKAITI，"悯农·其一 / 唐·李绅"，1.0 秒。
- 总时长 13.44 秒，1.25 MB。
- 成功文件名：`minnong_q1_v2.mp4`。
- 已推送到微信公众号草稿箱。

### 悯农·其二（v10 DP 精确匹配版）

- 使用 `https://wubi.netlify.app/` 线上网页，共 27 个汉字。
- 截图用 `.article-char-chip` 直接点击 + 800ms 等待 + 五笔编码验证，27 张 MD5 唯一。
- 整句 TTS（Rate=-2）+ DP+能量分析+先验信息。
- AI 生成纯背景图（无汉字），PIL 叠加标题文字。
- "粒粒"相同字间插入 0.15s 暗化过渡帧（85% 亮度）。
- 裁剪参数 `crop = (130, 0, 1184, 598)`。
- 总时长 13.84 秒，1.38 MB。
- 成功文件名：`minnong_v10_dp_matched.mp4`。
- **此版本的DP代码是音画匹配的标准参考实现，后续版本应严格对标。**

### 长歌行（v3 DP严格对标版）★当前最新

- 使用本地 HTML `20260622wubi-stroke-colorV20.html`（file://协议），共 56 个汉字。
- **截图方式**：Playwright 批量截图 56 张，`--no-proxy-server` 解决本地文件连接问题。
  - Playwright：1200ms 等待 + showAll() + 编码验证
  - 中间区域MD5检查：char_006/char_007（青青）重复属正常（同一汉字）
- 裁剪参数 `crop = (170, 0, 1184, 598)`，输出 `1280×720`。
- **多音字处理（7个）**：长→常(cháng)、乐→月(yuè)、朝→昭(zhāo)、少→邵(shào)、衰→催(cuī)、露→鹿(lù)、待→代(dài)。
- **TTS缓存失效教训**：PowerShell `Remove-Item 'char_012_露*'` 对中文通配符匹配失败，旧TTS未被删除导致仍读旧音。解决方法：清空整个char_audio和audio目录重新生成。
- **DP音画匹配**：严格对标悯农v10代码，关键点：
  - RMS能量（`energy**0.5`）+ 归一化
  - 裁掉尾部静音（能量>0.05的有效段）
  - 局部10帧最大值*0.7作为谷值阈值
  - 逐段比例偏差作为代价（不是累计偏差！）
  - 从最后一个候选点回溯（强制末字对齐音频末尾）
  - 80ms最小段长，失败时放宽到50ms
- AI 生成古典园林晨露背景图，PIL 叠加华文楷体标题文字。
- 标题页 1.0 秒，结尾页 2.0 秒。
- 总时长 30.72 秒，2.15 MB，H.264 + AAC。
- 成功文件名：`changexing_v3.mp4`。
- **v1/v2失败原因**：v1用原始能量+全局阈值，v2用累计偏差代价+不裁尾部静音，两者都不如v3的悯农v10原版DP。

### 敕勒歌（v2 优化分组版）

- 使用线上网页 `wubi.netlify.app`，共 34 个汉字（标题"敕勒歌"+作者"北朝民歌"+正文27字）。
- **截图方式**：Playwright 批量截图，1500ms 等待 + showAll() + 编码验证。
- 裁剪参数 `crop = (210, 0, 1184, 598)`，输出 `1280×720`。
- **多音字处理**：朝→潮(cháo)、見→现(xiàn)。
- **分组优化**：v1分5组(平均6.8字/组) → v2分10组(平均3.4字/组)，短句DP匹配更准确。
- **江南经验应用**：参照江南视频40字9组的成功经验，将分组细化到3-4字/组。
- AI 生成草原背景图，PIL 叠加华文楷体标题文字。
- 总时长 22.24 秒，1.64 MB。
- 成功文件名：`chilege_v2.mp4`。

### 不愿意参加劳动工作就是错误吗（v5 自然断句版）★当前最新

- 使用线上网页 `wubi.netlify.app`，共 632 个汉字（最长文章）。
- **截图方式**：Playwright 批量截图 632 张，1200ms 等待 + showAll() + 编码验证。
- 裁剪参数 `crop = (210, 0, 1184, 598)`，输出 `1280×720`。
- **多音字处理**：种字按位置替换（113/531/576读zhǒng不替换，288/308读zhòng替换为仲）、重→仲、分→份。
- **分组策略**（经过v1-v5多次迭代优化）：
  - v1: 23组（大组，DP搜索空间大）
  - v2: 69组（自动按标点拆，断句不自然）
  - v3: 67组（手动定义自然断句）
  - v4: 68组（拆分"原始社会"句，导致词语被拆开）
  - **v5: 67组（合并回整句+逗号分隔避免SAPI重复）**
- **停顿标准**：长句0.50-0.80s，中句0.40-0.60s，短句0.25-0.40s，前后半段一致。
- **SAPI重复朗读Bug**：用逗号分隔"原始社会从没有人类，到有人类"解决，不用拆分两组。
- **TTS缓存失效教训**：修改分组后必须清除整个音频目录，否则旧索引的TTS会被复用。
- AI 生成金色麦田背景图，PIL 叠加华文楷体标题文字。
- 总时长 ~260 秒，16.66 MB。
- 成功文件名：`laodong_v5.mp4`。

## 发布到微信公众号草稿箱

视频制作完成并验证通过后，可通过微信公众号 API 推送到草稿箱。

### 前置条件

- 微信公众号的 AppID 和 AppSecret（用户提供）
- 视频文件已通过 ffmpeg 验证
- 封面图（标题页截图或背景图）

### 发布流程（4步）

**Step 1：获取 access_token**

```python
import requests
url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APPID}&secret={APPSECRET}"
resp = requests.get(url, timeout=30)
token = resp.json()["access_token"]
```

**Step 2：上传封面图（永久素材）**

```python
url = f"https://api.weixin.qq.com/cgi-bin/material/add_material?access_token={token}&type=image"
with open(cover_path, 'rb') as f:
    files = {'media': ('cover.png', f, 'image/png')}
    resp = requests.post(url, files=files, timeout=60)
cover_media_id = resp.json()["media_id"]
```

**Step 3：上传视频（永久素材）**

视频上传需要构造 multipart 表单，包含 `media`（视频文件）和 `description`（JSON描述）两个字段：

```python
import io, json

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = io.BytesIO()

body.write(f'--{boundary}\r\n'.encode('utf-8'))
body.write(b'Content-Disposition: form-data; name="media"; filename="video.mp4"\r\n')
body.write(b'Content-Type: video/mp4\r\n\r\n')
body.write(video_data)
body.write(b'\r\n')

desc = json.dumps({"title": "标题", "introduction": "简介"}, ensure_ascii=False)
body.write(f'--{boundary}\r\n'.encode('utf-8'))
body.write(b'Content-Disposition: form-data; name="description"\r\n\r\n')
body.write(desc.encode('utf-8'))
body.write(b'\r\n')
body.write(f'--{boundary}--\r\n'.encode('utf-8'))

headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
resp = requests.post(url, data=body.getvalue(), headers=headers, timeout=300)
video_media_id = resp.json()["media_id"]
```

**Step 4：创建图文草稿**

```python
article = {
    "title": "标题不超过64字节",
    "author": "从一至万",
    "digest": "摘要不超过120字节",
    "content": content_html,  # 含视频嵌入标签
    "content_source_url": "https://wubi.netlify.app/",
    "thumb_media_id": cover_media_id,
    "need_open_comment": 1,
    "only_fans_can_comment": 0
}

draft_data = {"articles": [article]}
json_data = json.dumps(draft_data, ensure_ascii=False).encode('utf-8')
headers = {"Content-Type": "application/json; charset=utf-8"}
resp = requests.post(url, data=json_data, headers=headers, timeout=60)
```

### 微信 API 限制

- **标题**：不超过 64 字节（约 21 个汉字）
- **摘要 digest**：不超过 120 字节（约 40 个汉字）
- **JSON 编码**：必须用 `ensure_ascii=False` + UTF-8 编码发送
- **视频上传**：必须包含 `description` 字段（含 title 和 introduction）
- **视频大小**：建议 10MB 以内，1-2MB 最稳定
