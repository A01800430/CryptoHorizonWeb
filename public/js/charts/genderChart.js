/**
 * Script para renderizar un gráfico de pastel (donut) con ECharts.
 * - Muestra la distribución de usuarios según su género.
 * - Usa datos precargados en window.genderCountData.
 * - El gráfico se adapta al redimensionar la ventana.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Obtener datos de género y el contenedor del gráfico
  const genderData = window.genderCountData || [];
  const chartContainer = document.getElementById("genderChartCanvas");

  // Validar existencia del contenedor
  if (!chartContainer) {
    console.warn("⛔ No se encontró el contenedor para el gráfico de género.");
    return;
  }

  // Validar que existan datos para graficar
  if (!genderData.length) {
    console.warn("⚠ No hay datos de género para mostrar.");
    return;
  }

  // Inicializar instancia de ECharts
  const chart = echarts.init(chartContainer);

  // Configuración del gráfico de dona
  const option = {
    color: ["#3498db", "#e91e63", "#95a5a6"],
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} usuarios ({d}%)'
    },
    legend: {
      top: '5%',
      left: 'center',
      textStyle: {
        color: '#5D6D7E'
      }
    },
    series: [{
      name: 'Usuarios por género',
      type: 'pie',
      radius: ['40%', '70%'], // Dona (no pastel completo)
      avoidLabelOverlap: false,
      padAngle: 0,
      itemStyle: {
        borderRadius: 0,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center',
        color: "#7F8C8D"
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: genderData.map(d => ({
        value: d.total,
        name: d.gender
      }))
    }]
  };

  // Renderizar el gráfico con la configuración definida
  chart.setOption(option);

  // Redimensionar el gráfico dinámicamente
  window.addEventListener("resize", () => chart.resize());
});