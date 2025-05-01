/**
 * newUsersChart.js
 * Gráfico de líneas: nuevos usuarios por día
 * Representa la cantidad de nuevos usuarios registrados diariamente
 */
document.addEventListener("DOMContentLoaded", function () {
  if (!window.newUsersByDay || !Array.isArray(window.newUsersByDay)) return;

  function getThemeMode() {
    return (
      localStorage.getItem("theme") === "dark" ||
      document.body.classList.contains("dark-mode")
    );
  }

  function createChart() {
    if (window.newUsersRoot) window.newUsersRoot.dispose();

    const root = am5.Root.new("newUsersChart");
    window.newUsersRoot = root;

    const isDark = getThemeMode();
    const textColor = isDark ? 0xffffff : 0x000000;
    const gridColor = isDark ? am5.color(0x666666) : am5.color(0xaaaaaa);
    const backgroundColor = isDark ? 0x1e1e1e : 0xffffff;

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
      strokeOpacity: 0.5,
      strokeWidth: 1.2
    });

    root.setThemes([am5themes_Animated.new(root), theme]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true
      })
    );

    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: "day", count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 70
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "New Users",
        xAxis,
        yAxis,
        valueYField: "value",
        valueXField: "date",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueY} new users"
        })
      })
    );

    series.strokes.template.setAll({ strokeWidth: 2 });
    series.fills.template.setAll({ fillOpacity: 0.2, visible: true });

    series.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 4,
          fill: root.interfaceColors.get("background"),
          stroke: series.get("stroke"),
          strokeWidth: 2
        })
      })
    );

    const processedData = window.newUsersByDay.map((d) => ({
      date: new Date(d.day).getTime(),
      value: d.count
    }));
    series.data.setAll(processedData);

    series.appear(1000);
    chart.appear(1000, 100);
  }

  createChart();

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    setTimeout(() => createChart(), 300);
  });
});
