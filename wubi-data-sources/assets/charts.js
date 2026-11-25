(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // 覆盖字数对比（对数轴）
  var chart = echarts.init(document.getElementById('chart-cover'), null, { renderer: 'svg' });
  chart.setOption({
    animation: false,
    grid: { top: 36, left: 60, right: 30, bottom: 70 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true,
      formatter: function(p) { var d = p[0]; return d.name + '<br/>约 <b>' + Number(d.value).toLocaleString() + '</b> 字'; } },
    xAxis: {
      type: 'category',
      data: ['你的\nstroke-bundle', 'hanzi-writer-data\n/graphics.txt', 'CCD\n拆字表', 'WuBi06\n编码库', 'yi-bai/ids\n(IDS)', 'GlyphWiki\n(字形)'],
      axisLabel: { color: muted, fontSize: 11, interval: 0, lineHeight: 16 },
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'log',
      logBase: 10,
      min: 1000,
      axisLabel: { color: muted, formatter: function(v) { return v >= 10000 ? (v / 10000) + '万' : v; } },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      barWidth: '52%',
      data: [
        { value: 26385, itemStyle: { color: accent2 } },
        { value: 9500, itemStyle: { color: accent } },
        { value: 21169, itemStyle: { color: accent } },
        { value: 98000, itemStyle: { color: accent } },
        { value: 130000, itemStyle: { color: accent } },
        { value: 170000, itemStyle: { color: accent } }
      ],
      label: { show: true, position: 'top', color: ink, fontSize: 11, fontWeight: 600,
        formatter: function(p) { return p.value >= 10000 ? (p.value / 10000) + '万' : p.value; } },
      itemStyle: { borderRadius: [4, 4, 0, 0] }
    }]
  });
  window.addEventListener('resize', function() { chart.resize(); });

  // Mermaid
  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose',
      themeVariables: {
        primaryColor: bg2, primaryTextColor: ink, primaryBorderColor: accent,
        lineColor: muted, fontSize: '13px'
      } });
  }
})();
