/**
 * Script para generar un gráfico de barras horizontales con ECharts.
 * - Muestra la precisión promedio por nivel.
 * - Se usan colores personalizados por barra.
 * - Datos obtenidos desde window.accuracyPerLevel.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Verifica que el contenedor y los datos estén disponibles
  const chartDom = document.getElementById('accuracyChart');
  if (!chartDom || !window.accuracyPerLevel) return;

  // Inicializa la instancia de ECharts en el contenedor
  const myChart = echarts.init(chartDom);

  // Extrae los nombres de los niveles desde los datos
  const levelNames = window.accuracyPerLevel.map(item => item.levelName);

  // Genera los datos para la serie con colores por barra
  const seriesData = window.accuracyPerLevel.map((item, index) => ({
    value: item.avgAccuracy,
    itemStyle: {
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
    }
  }));

  // Configuración del gráfico
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
      bottom: '5%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '% Accuracy',
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

  // Aplica la configuración al gráfico
  myChart.setOption(option);
});
