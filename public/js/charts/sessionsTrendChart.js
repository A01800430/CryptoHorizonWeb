/**
 * sessionsTrendChart.js
 * Línea de sesiones por semana
 * Muestra la evolución semanal y una línea de tendencia (regresión lineal)
 */

document.addEventListener("DOMContentLoaded", function () {
  function getThemeMode() {
    return (
      localStorage.getItem("theme") === "dark" ||
      document.body.classList.contains("dark-mode")
    );
  }

  function createChart() {
    fetch("/sessions/patterns/data")
      .then(res => res.json())
      .then(({ sessionsByWeek }) => {
        if (window.sessionsTrendRoot) window.sessionsTrendRoot.dispose();
        const root = am5.Root.new("chartWeekTrend");
        window.sessionsTrendRoot = root;

        const isDark = getThemeMode();
        const backgroundColor = isDark ? 0x1e1e1e : 0xffffff;
        const textColor = isDark ? 0xffffff : 0x000000;
        const gridColor = isDark ? am5.color(0x444444) : am5.color(0xcccccc);
        const bulletFill = am5.color(0xffffff);
        const bulletStroke = am5.color(0x000000);

        root.container.setAll({
          background: am5.Rectangle.new(root, {
            fill: am5.color(backgroundColor),
            fillOpacity: 1
          })
        });

        const theme = am5.Theme.new(root);
        theme.rule("Label").setAll({ fill: am5.color(textColor) });
        theme.rule("AxisLabel").setAll({ fill: am5.color(textColor) });
        theme.rule("Grid").setAll({
          stroke: gridColor,
          strokeOpacity: 0.7,
          strokeWidth: 1.2
        });

        root.setThemes([am5themes_Animated.new(root), theme]);

        const chart = root.container.children.push(
          am5xy.XYChart.new(root, {
            panX: true,
            panY: false,
            wheelX: "panX",
            wheelY: "zoomX",
            pinchZoomX: true
          })
        );

        // Leyenda explicativa de líneas
        const legend = chart.children.push(
          am5.Legend.new(root, {
            position: "top",
            centerX: am5.percent(50),
            layout: root.horizontalLayout
          })
        );
        chart.set("legend", legend);

        const xAxis = chart.xAxes.push(
          am5xy.CategoryAxis.new(root, {
            categoryField: "week",
            renderer: am5xy.AxisRendererX.new(root, {
              minGridDistance: 40
            })
          })
        );

        const yAxis = chart.yAxes.push(
          am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, {})
          })
        );

        // Serie principal
        const series = chart.series.push(
          am5xy.LineSeries.new(root, {
            name: "Weekly Sessions", // Aparece en leyenda
            xAxis,
            yAxis,
            valueYField: "value",
            categoryXField: "week",
            tooltip: am5.Tooltip.new(root, {
              labelText: "{valueY} sessions"
            })
          })
        );

        series.strokes.template.setAll({
          stroke: am5.color(0x42a5f5), // azul
          strokeWidth: 3
        });

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

        xAxis.data.setAll(sessionsByWeek);
        series.data.setAll(sessionsByWeek);
        legend.data.push(series); // Añadir a leyenda

        // Línea de tendencia
        const trendData = getTrendLineData(sessionsByWeek);
        const trendSeries = chart.series.push(
          am5xy.LineSeries.new(root, {
            name: "Trend Line", // Aparece en leyenda
            xAxis,
            yAxis,
            valueYField: "value",
            categoryXField: "week"
          })
        );

        trendSeries.strokes.template.setAll({
          stroke: am5.color(0xff9800), // naranja
          strokeDasharray: [4, 4],
          strokeWidth: 2
        });

        trendSeries.data.setAll(trendData);
        legend.data.push(trendSeries); // Añadir a leyenda

        // Cursor y scroll horizontal
        const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
          behavior: "none"
        }));
        cursor.lineY.set("visible", false);

        chart.set("scrollbarX", am5.Scrollbar.new(root, {
          orientation: "horizontal"
        }));

        series.appear(1000);
        chart.appear(1000, 100);
      });
  }

  // 🔢 Calcula regresión lineal
  function getTrendLineData(data) {
    const n = data.length;
    const sumX = data.reduce((acc, _, i) => acc + i, 0);
    const sumY = data.reduce((acc, d) => acc + d.value, 0);
    const sumXY = data.reduce((acc, d, i) => acc + i * d.value, 0);
    const sumX2 = data.reduce((acc, _, i) => acc + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map((d, i) => ({
      week: d.week,
      value: slope * i + intercept
    }));
  }

  // Crear al cargar
  createChart();

  // Recrear al cambiar tema
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    setTimeout(() => createChart(), 300);
  });
});
