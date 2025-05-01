/**
 * Script para generar un gráfico de barras polares con ECharts.
 * - Muestra la distribución porcentual de logros (oro, plata, bronce) por nivel.
 * - Se agrupan los datos dinámicamente desde la variable global `logrosPorNivel`.
 * - Se asignan colores personalizados a cada tipo de logro.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Obtiene el contenedor del gráfico
  const chartDom = document.getElementById('achievementsChart');
  if (!chartDom || !window.logrosPorNivel) return;

  // Inicializa la instancia de ECharts
  const myChart = echarts.init(chartDom);

  // Agrupa los datos por nivel y logro (estructura: { nivel: { logro: porcentaje } })
  const grouped = {};
  window.logrosPorNivel.forEach(entry => {
    if (!grouped[entry.nivel]) grouped[entry.nivel] = {};
    grouped[entry.nivel][entry.logro] = entry.porcentaje;
  });

  // Extrae niveles únicos
  const levels = Object.keys(grouped);

  // Extrae los nombres únicos de logros
  const logroNombres = [...new Set(window.logrosPorNivel.map(e => e.logro))];

  // Colores definidos para cada tipo de trofeo
  const colores = {
    "Trofeo Oro": "#FFD700",     // Dorado
    "Trofeo Plata": "#C0C0C0",   // Plateado
    "Trofeo Bronce": "#CD7F32"   // Bronce
  };

  // Genera una serie por tipo de logro
  const series = logroNombres.map(logro => ({
    type: 'bar',
    name: logro,
    stack: 'logros',
    coordinateSystem: 'polar',
    emphasis: { focus: 'series' },
    data: levels.map(nivel => grouped[nivel][logro] || 0),
    itemStyle: {
      color: colores[logro] || '#888888'  // Color por logro o gris por defecto
    }
  }));

  // Configuración del gráfico
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c}%' // Muestra: nombre del logro, nivel, y porcentaje
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
      max: 100, // Máximo 100% (porcentaje)
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
    polar: {},  // Activa sistema de coordenadas polares
    series: series // Asigna las series creadas dinámicamente
  };

  // Renderiza el gráfico con la configuración definida
  myChart.setOption(option);
});
