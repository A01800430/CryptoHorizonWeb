// public/js/charts/accuracyChart.js

document.addEventListener("DOMContentLoaded", () => {
  const chartDom = document.getElementById('accuracyChart');
  if (!chartDom || !window.accuracyPerLevel) return;

  const myChart = echarts.init(chartDom);

  const levelNames = window.accuracyPerLevel.map(item => item.levelName);
  const seriesData = window.accuracyPerLevel.map((item, index) => ({
    value: item.avgAccuracy,
    itemStyle: {
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
    }
  }));

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}%'
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '15%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '%',
      min: 0,
      max: 100
    },
    yAxis: {
      type: 'category',
      data: levelNames
    },
    series: [{
      name: 'Accuracy',
      type: 'bar',
      label: {
        show: true,
        position: 'right',
        formatter: '{c}%'
      },
      data: seriesData
    }]
  };

  myChart.setOption(option);
});
