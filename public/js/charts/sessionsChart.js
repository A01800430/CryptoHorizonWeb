// sessionsChart.js

document.addEventListener("DOMContentLoaded", function () {
  const sessionsByDay = window.sessionsByDay;

  function getThemeMode() {
    return (
      localStorage.getItem("theme") === "dark" ||
      document.body.classList.contains("dark")
    );
  }

  function createSessionsChart(isDark) {
    if (window.sessionsRoot) window.sessionsRoot.dispose();

    const root = am5.Root.new("sessionsChart");
    window.sessionsRoot = root;

    const backgroundColor = isDark ? 0x1e1e1e : 0xffffff;
    const textColor = isDark ? 0xffffff : 0x000000;
    const gridColor = isDark ? 0x444444 : 0xcccccc;
    const bulletColor = isDark ? 0xffffff : 0x000000;

    root.container.setAll({
      background: am5.Rectangle.new(root, {
        fill: am5.color(backgroundColor),
        fillOpacity: 1,
      }),
    });

    const theme = am5.Theme.new(root);
    theme.rule("Label").setAll({ fill: am5.color(textColor) });
    theme.rule("AxisLabel").setAll({ fill: am5.color(textColor) });
    theme.rule("Grid").setAll({ stroke: am5.color(gridColor) });

    root.setThemes([am5themes_Animated.new(root), theme]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
      })
    );

    chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));

    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: "day", count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {
          minorGridEnabled: true,
          minGridDistance: 70,
        }),
        tooltip: am5.Tooltip.new(root, {}),
        title: am5.Label.new(root, { text: "Day", fontWeight: "bold" }),
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        title: am5.Label.new(root, { text: "Sessions", fontWeight: "bold" }),
      })
    );

    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Sessions",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        valueXField: "date",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueY} sessions",
        }),
      })
    );

    series.strokes.template.setAll({
      strokeWidth: 4,
      templateField: "strokeSettings",
    });

    series.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 6,
          fill: am5.color(bulletColor),
        }),
      })
    );

    const mappedData = [];
    let prev = null;
    sessionsByDay.forEach(({ count, day }) => {
      const value = count;
      const date = new Date(day).getTime();
      const up = am5.color(0x4caf50);
      const down = am5.color(0xf44336);
      const stroke = prev == null || value >= prev ? up : down;
      mappedData.push({ date, value, strokeSettings: { stroke } });
      prev = value;
    });

    series.data.setAll(mappedData);

    const scrollbar = chart.set(
      "scrollbarX",
      am5xy.XYChartScrollbar.new(root, {
        orientation: "horizontal",
        height: 60,
      })
    );

    const sbDateAxis = scrollbar.chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: "day", count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {}),
      })
    );

    const sbValueAxis = scrollbar.chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    const sbSeries = scrollbar.chart.series.push(
      am5xy.LineSeries.new(root, {
        valueYField: "value",
        valueXField: "date",
        xAxis: sbDateAxis,
        yAxis: sbValueAxis,
      })
    );

    sbSeries.data.setAll(mappedData);

    series.appear(1000);
    chart.appear(1000, 100);
  }

  createSessionsChart(getThemeMode());

  document
    .getElementById("themeToggle")
    ?.addEventListener("click", function () {
      setTimeout(() => {
        createSessionsChart(getThemeMode());
      }, 200);
    });
});
