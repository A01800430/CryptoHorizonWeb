/**
 * Script para renderizar un gráfico de pastel (donut) con ECharts.
 * - Muestra la distribución de usuarios según su género.
 * - Usa datos precargados en window.genderCountData.
 * - Se adapta automáticamente al modo claro/oscuro.
 * - Responde dinámicamente al redimensionar la ventana y al cambio de tema.
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

  // Detectar si el tema actual es oscuro
  function getThemeMode() {
    return (
      localStorage.getItem("theme") === "dark" ||
      document.body.classList.contains("dark-mode")
    );
  }

  // Función principal que construye y configura el gráfico
  function createChart() {
    // Eliminar instancia previa si ya existe (para redibujar correctamente)
    if (window.genderChartInstance) {
      window.genderChartInstance.dispose();
    }

    // Crear nueva instancia de ECharts
    const chart = echarts.init(chartContainer);
    window.genderChartInstance = chart;

    // Definir colores dinámicamente según el tema
    const isDark = getThemeMode();
    const backgroundColor = isDark ? "#1e1e1e" : "#ffffff";
    const textColor = isDark ? "#ecf0f1" : "#2c3e50";
    const borderColor = isDark ? "#2c3e50" : "#ffffff";

    // Configuración del gráfico de dona
    const option = {
      backgroundColor: backgroundColor,
      color: ["#3498db", "#e91e63", "#a78bfa", "#95a5a6"], // Colores por género
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} usuarios ({d}%)'
      },
      legend: {
        top: '5%',
        left: 'center',
        textStyle: {
          color: textColor
        }
      },
      series: [{
        name: 'Usuarios por género',
        type: 'pie',
        radius: ['40%', '70%'], // Estilo dona
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: borderColor,
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center',
          color: textColor
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

    // Renderizar el gráfico
    chart.setOption(option);

    // Redimensionar dinámicamente cuando cambie el tamaño de la ventana
    window.addEventListener("resize", () => chart.resize());
  }

  // Crear el gráfico al cargar la página
  createChart();

  // Volver a renderizar el gráfico cuando se cambia el modo claro/oscuro
  const themeToggleBtn = document.getElementById("themeToggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      setTimeout(() => createChart(), 300);
    });
  }
});
