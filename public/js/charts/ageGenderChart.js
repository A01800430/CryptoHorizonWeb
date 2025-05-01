/**
 * Script para visualizar la distribución de edad por género usando ECharts.
 * - Gráfico de barras apiladas por grupo de edad.
 * - Se adapta dinámicamente al cambio de tema (claro/oscuro).
 * - Datos precargados desde window.ageGenderDistribution.
 * - Soporta responsividad en redimensionamiento de pantalla.
 */

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("ageGenderChart");
  if (!container || !window.ageGenderDistribution) return;

  const rawData = window.ageGenderDistribution;
  const ageGroups = ['<18', '18-24', '25-34', '35-44', '45-54', '55+'];

  const genderSet = new Set();
  rawData.forEach(row => genderSet.add(row.gender));
  const genders = Array.from(genderSet);

  const genderMap = {};
  genders.forEach(g => {
    genderMap[g] = ageGroups.map(() => 0);
  });

  rawData.forEach(row => {
    const { ageRange, gender, total } = row;
    const index = ageGroups.indexOf(ageRange);
    if (index !== -1 && genderMap[gender]) {
      genderMap[gender][index] = total;
    }
  });

  const genderColors = {
    'Male': '#4A90E2',
    'Female': '#ec4899',
    'Non-binary': '#a855f7'
  };

  const defaultColor = '#9ca3af';
  const total = rawData.reduce((sum, row) => sum + row.total, 0);

  const chart = echarts.init(container);

  function isDarkMode() {
    return (
      localStorage.getItem("theme") === "dark" ||
      document.body.classList.contains("dark-mode")
    );
  }

  function getOption() {
    return {
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
      series: genders.map(g => ({
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
      }))
    };
  }

  chart.setOption(getOption());
  window.addEventListener('resize', () => chart.resize());

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    setTimeout(() => {
      chart.setOption(getOption(), true);
    }, 300);
  });
});
