/**
 * Script para visualizar la distribución de edad por género usando ECharts.
 * - Gráfico de barras apiladas por grupo de edad.
 * - Se adapta dinámicamente al cambio de tema (claro/oscuro).
 * - Datos precargados desde window.ageGenderDistribution.
 * - Soporta responsividad en redimensionamiento de pantalla.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Verifica existencia del contenedor y datos globales
  const container = document.getElementById("ageGenderChart");
  if (!container || !window.ageGenderDistribution) return;

  // Datos base desde el backend
  const rawData = window.ageGenderDistribution;

  // Rangos de edad predefinidos
  const ageGroups = ['<18', '18-24', '25-34', '35-44', '45-54', '55+'];

  // Detecta géneros únicos desde los datos
  const genderSet = new Set();
  rawData.forEach(row => genderSet.add(row.gender));
  const genders = Array.from(genderSet);

  // Inicializa un objeto para agrupar datos por género y grupo de edad
  const genderMap = {};
  genders.forEach(g => {
    genderMap[g] = ageGroups.map(() => 0);
  });

  // Llena genderMap con los valores de la base de datos
  rawData.forEach(row => {
    const { ageRange, gender, total } = row;
    const index = ageGroups.indexOf(ageRange);
    if (index !== -1 && genderMap[gender]) {
      genderMap[gender][index] = total;
    }
  });

  // Define colores por género
  const genderColors = {
    'Male': '#4A90E2',       // azul
    'Female': '#ec4899',     // rosa
    'Non-binary': '#a855f7', // morado
  };

  const defaultColor = '#9ca3af'; // gris para valores sin color definido

  // Construye la configuración de cada serie por género
  const series = genders.map(g => ({
    name: g,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    label: {
  show: true,
  position: 'inside',
  formatter: (params) => {
    return params.value > 0 ? params.value : '';
  }
},

    itemStyle: {
      color: genderColors[g] || defaultColor
    },
    data: genderMap[g]
  }));

  // Calcula el total de usuarios
  const total = rawData.reduce((sum, row) => sum + row.total, 0);

  // Detecta el modo actual del tema
  function isDarkMode() {
    return (
      localStorage.getItem("theme") === "dark" ||
      document.body.classList.contains("dark-mode")
    );
  }

  // Configuración del gráfico con adaptación a tema oscuro/claro
  const option = {
    backgroundColor: isDarkMode() ? '#1e1e1e' : '#ffffff',
    title: {
      text: `Total Users: ${total}`,
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: 18,
        fontWeight: 600,
        color: isDarkMode() ? '#f0f0f0' : '#4b4b4b'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      top: 35,
      data: genders,
      textStyle: {
        color: isDarkMode() ? '#e0e0e0' : '#4b4b4b'
      }
    },
    grid: {
      top: 80,
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ageGroups,
      axisLine: {
        lineStyle: {
          color: isDarkMode() ? '#888' : '#333'
        }
      },
      axisLabel: {
        color: isDarkMode() ? '#ccc' : '#333'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: isDarkMode() ? '#888' : '#333'
        }
      },
      axisLabel: {
        color: isDarkMode() ? '#ccc' : '#333'
      },
      splitLine: {
        lineStyle: {
          color: isDarkMode() ? '#444' : '#e0e0e0'
        }
      }
    },
    series
  };

  // Instancia y renderiza el gráfico
  const chart = echarts.init(container);
  chart.setOption(option);

  // Redibuja el gráfico al cambiar el tamaño de la ventana
  window.addEventListener('resize', () => chart.resize());

  // Vuelve a renderizar el gráfico si se cambia el modo claro/oscuro
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    setTimeout(() => {
      chart.setOption(option); // aplica de nuevo con el nuevo tema
    }, 300);
  });
});
