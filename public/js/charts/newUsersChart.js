/**
 * Script para renderizar un gráfico de línea con amCharts.
 * - Muestra la cantidad de sesiones por día.
 * - Soporta tema claro/oscuro dinámicamente.
 * - Incluye scrollbar interactivo y estilo condicional por tendencia.
 */

document.addEventListener("DOMContentLoaded", function () {
  const sessionsByDay = window.sessionsByDay;

  // Detectar si el tema actual es oscuro
  function getThemeMode() {
    return (
      localStorage.getItem("theme") === "dark" ||
      document.body.classList.contains("dark-mode")
    );
  }

  // Función principal para construir el gráfico
  function createChart() {
    // Destruir instancia previa si existe
    if (window.sessionsRoot) window.sessionsRoot.dispose();
    const root = am5.Root.new("sessionsChart");
    window.sessionsRoot = root;

    // Colores según el tema
    const isDark = getThemeMode();
    const upColor = am5.color(0x4caf50);
    const downColor = am5.color(0xf44336);
    const bulletFill = am5.color(0xffffff);
    const bulletStroke = am5.color(0x000000);

    const textColor = isDark ? 0xffffff : 0x000000;
    const gridColor = isDark ? am5.color(0x666666) : am5.color(0xaaaaaa);
    const backgroundColor = isDark ? 0x1e1e1e : 0xffffff;

    // Establecer fondo del gráfico
    root.container.setAll({
      background: am5.Rectangle.new(root, {
        fill: am5.color(backgroundColor),
        fillOpacity: 1
      })
    });

    // Tema personalizado (colores de texto y rejillas)
    const theme = am5.Theme.new(root);
    theme.rule("Label").setAll({ fill: am5.color(textColor) });
    theme.rule("AxisLabel").setAll({ fill: am5.color(textColor) });
    theme.rule("Grid").setAll({
      stroke: gridColor,
      strokeOpacity: 0.5,
      strokeWidth: 1.2
    });

    root.setThemes([am5themes_Animated.new(root), theme]);

    // Crear gráfico XY principal
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true
      })
    );

    // Configurar cursor (sin línea vertical)
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "none"
    }));
    cursor.lineY.set("visible", false);

    // Eje X (fechas)
    const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 70
      }),
      tooltip: am5.Tooltip.new(root, {})
    }));

    // Eje Y (cantidad de sesiones)
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    // Serie de líneas
    const series = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Sessions",
      xAxis,
      yAxis,
      valueYField: "value",
      valueXField: "date",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY} sessions"
      })
    }));

    series.strokes.template.setAll({
      strokeWidth: 4,
      templateField: "strokeSettings"
    });

    // Marcadores (puntos) en la línea
    series.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: bulletFill,
          strokeWidth: 2,
          stroke: bulletStroke
        })
      })
    );

    // Procesar datos con colores condicionales
    const mappedData = [];
    let prev = null;

    sessionsByDay.forEach(({ day, count }, i) => {
      const value = count;
      const date = new Date(day).getTime();

      if (i > 0) {
        const stroke = value < prev ? downColor : upColor;
        mappedData[mappedData.length - 1].strokeSettings = { stroke };
      }

      mappedData.push({ date, value });
      prev = value;
    });

    series.data.setAll(mappedData);

    // Scrollbar con vista previa
    const scrollbar = chart.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
      orientation: "horizontal",
      height: 60
    }));

    const sbDateAxis = scrollbar.chart.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {})
    }));

    const sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    const sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
      valueYField: "value",
      valueXField: "date",
      xAxis: sbDateAxis,
      yAxis: sbValueAxis
    }));

    sbSeries.data.setAll(mappedData);

    // Animación de aparición
    series.appear(1000);
    chart.appear(1000, 100);
  }

  // Crear gráfico al cargar la página
  createChart();

  // Recrear gráfico al cambiar de tema
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    setTimeout(() => createChart(), 300);
  });
});
//*
