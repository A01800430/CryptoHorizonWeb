document.addEventListener("DOMContentLoaded", () => {
  const chartDom = document.getElementById('achievementsChart');
  if (!chartDom || !window.logrosPorNivel) return;

  const myChart = echarts.init(chartDom);

  const grouped = {};
  window.logrosPorNivel.forEach(entry => {
    if (!grouped[entry.nivel]) grouped[entry.nivel] = {};
    grouped[entry.nivel][entry.logro] = entry.porcentaje;
  });

  const levels = Object.keys(grouped);
  const logroNombres = [...new Set(window.logrosPorNivel.map(e => e.logro))];

  const colores = {
    "Trofeo Oro": "#FFD700",
    "Trofeo Plata": "#C0C0C0",
    "Trofeo Bronce": "#CD7F32"
  };

  const series = logroNombres.map(logro => ({
    type: 'bar',
    name: logro,
    stack: 'logros',
    coordinateSystem: 'polar',
    emphasis: { focus: 'series' },
    data: levels.map(nivel => grouped[nivel][logro] || 0),
    itemStyle: {
      color: colores[logro] || '#888888'
    }
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c}%'
    },
    legend: {
      show: true,
      top: 'bottom',
      data: logroNombres
    },
    angleAxis: {
      type: 'category',
      data: levels,
      axisLabel: {
        fontSize: 12,
        fontWeight: 'bold'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#999',
          width: 1.5
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#ccc',
          type: 'dashed'
        }
      }
    },
    radiusAxis: {
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        fontSize: 11
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: '#ddd'
        }
      }
    },
    polar: {},
    series: series
  };

  myChart.setOption(option);
});
