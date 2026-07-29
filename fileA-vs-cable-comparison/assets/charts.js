(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var el = document.getElementById('chart-structure');
  if (!el || !window.echarts) return;
  var chart = echarts.init(el, null, { renderer: 'svg' });
  chart.setOption({
    animation: false,
    color: [accent, accent2],
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { top: 0, textStyle: { color: ink } },
    grid: { left: 48, right: 24, top: 58, bottom: 36 },
    xAxis: {
      type: 'category',
      data: ["段落数", "表格数", "标题/条目数", "字符数/100"],
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: rule } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [
      { name: '文件A', type: 'bar', data: [28, 21, 22, 75.6], barMaxWidth: 34 },
      { name: '文件B', type: 'bar', data: [199, 7, 84, 109.2], barMaxWidth: 34 }
    ]
  });
  window.addEventListener('resize', function() { chart.resize(); });
})();
