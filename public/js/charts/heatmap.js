/**
 * Script para generar un heatmap (mapa de calor) con ECharts.
 * - Muestra la cantidad de sesiones por día y hora.
 * - Carga los datos dinámicamente desde el backend.
 * - El gráfico es responsive al tamaño de la ventana.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Obtener el contenedor del heatmap
    const chartContainer = document.getElementById("chartdiv");
  
    // Validar existencia del contenedor
    if (!chartContainer) {
      console.warn("⛔ No se encontró el contenedor para el heatmap.");
      return;
    }
  
    // Inicializar instancia de ECharts
    const chart = echarts.init(chartContainer);
  
    // Obtener datos del backend
    fetch('/sessions/patterns/data')
      .then(res => res.json())
      .then(serverData => {
        const { hours, days, data } = serverData;
  
        // Configuración del heatmap
        const option = {
          tooltip: {
            position: 'top',
            formatter: params => `${days[params.value[1]]}, ${hours[params.value[0]]}<br/>Sesiones: ${params.value[2]}`
          },
          grid: {
            height: '60%',
            top: '10%'
          },
          xAxis: {
            type: 'category',
            data: hours,
            axisLabel: { rotate: 45 },
            splitArea: { show: true }
          },
          yAxis: {
            type: 'category',
            data: days,
            splitArea: { show: true }
          },
          visualMap: {
            min: 0,
            max: 10,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '5%'
          },
          series: [{
            name: 'Heatmap de Sesiones',
            type: 'heatmap',
            data: data,
            label: { show: false },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        };
  
        // Renderizar el gráfico
        chart.setOption(option);
  
        // Redimensionar automáticamente
        window.addEventListener("resize", () => chart.resize());
      })
      .catch(err => {
        console.error("❌ Error al obtener datos del heatmap:", err);
      });
  });
  