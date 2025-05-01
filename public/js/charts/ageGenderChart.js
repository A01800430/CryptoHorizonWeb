/**
 * Script para visualizar la distribución de edad por género usando ECharts.
 * - Agrupa usuarios por rangos de edad y género dinámicamente desde la base de datos.
 * - Muestra barras apiladas con etiquetas internas para claridad.
 * - Incluye colores personalizados por género y un total de usuarios en el título.
 */

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("ageGenderChart");
  if (!container || !window.ageGenderDistribution) return;

  const rawData = window.ageGenderDistribution;

  // Define los grupos de edad que se utilizarán como categorías del eje X
  const ageGroups = ['<18', '18-24', '25-34', '35-44', '45-54', '55+'];

  // Recolecta los géneros disponibles desde los datos (dinámico)
  const genderSet = new Set();
  const genderMap = {};

  rawData.forEach(row => {
    genderSet.add(row.gender);
  });

  const genders = Array.from(genderSet);

  // Inicializa todos los géneros con arrays de ceros para cada grupo de edad
  genders.forEach(g => {
    genderMap[g] = ageGroups.map(() => 0);
  });

  // Llena la estructura genderMap con los conteos por edad y género
  rawData.forEach(row => {
    const { ageRange, gender, total } = row;
    const index = ageGroups.indexOf(ageRange);
    if (index !== -1 && genderMap[gender]) {
      genderMap[gender][index] = total;
    }
  });

  // Asigna colores únicos por género
  const genderColors = {
    'Male': '#4A90E2',       // Azul
    'Female': '#ec4899',     // Rosa
    'Non-binary': '#a855f7'  // Morado
  };
  const defaultColor = '#9ca3af'; // Gris como fallback

  // Crea una serie para cada género con estilo personalizado
  const series = genders.map(g => ({
    name: g,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    label: {
      show: true,
      position: 'inside',
      formatter: '{c}'
    },
    itemStyle: {
      color: genderColors[g] || defaultColor
    },
    data: genderMap[g]
  }));

  // Calcula el total de usuarios sumando todos los valores
  const total = rawData.reduce((sum, row) => sum + row.total, 0);

  // Configura el gráfico con todas las opciones necesarias
  const option = {
    title: {
      text: `Total Users: ${total}`,
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#4b4b4b'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      top: 35,
      data: genders
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
      data: ageGroups
    },
    yAxis: {
      type: 'value'
    },
    series
  };

  // Inicializa el gráfico y aplica las configuraciones
  const chart = echarts.init(container);
  chart.setOption(option);

  // Responsivo al redimensionar ventana
  window.addEventListener('resize', () => chart.resize());
});
