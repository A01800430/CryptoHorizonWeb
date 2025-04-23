document.addEventListener("DOMContentLoaded", function () {
  const countriesData = window.countriesData;
  let root, chart, polygonSeries, bubbleSeries, backgroundSeries;
  let currentProjection = "globe";
  let rotationAnimation = null;
  let isRotating = true;
  let initialZoom = null;
  let initialCenter = null;

  const toggleBtn = document.getElementById("toggleProjection");

  // Crear botón Auto-Rotate (pero aún no se inserta)
  const switchBtn = document.createElement("button");
  switchBtn.id = "autoRotateSwitch";
  switchBtn.className = "btn-dashboard btn-sm ms-2";
  switchBtn.textContent = "⏸ Auto-Rotate";

  switchBtn.addEventListener("click", () => {
    if (isRotating) {
      if (rotationAnimation) rotationAnimation.pause();
      switchBtn.textContent = "▶️ Auto-Rotate";
      isRotating = false;
    } else {
      chart.set("rotationX", 0);
      chart.set("rotationY", 0);
      rotationAnimation = chart.animate({
        key: "rotationX",
        from: 0,
        to: 360,
        duration: 20000,
        loops: Infinity
      });
      switchBtn.textContent = "⏸ Auto-Rotate";
      isRotating = true;
    }
  });

  function normalizeCountryName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
  }

  function createMap(projectionType) {
    if (root) {
      root.dispose();
      document.getElementById("globeChart").innerHTML = "";
    }

    // Eliminar botón si ya está
    if (switchBtn.parentElement) {
      switchBtn.parentElement.removeChild(switchBtn);
    }

    root = am5.Root.new("globeChart");
    root.setThemes([am5themes_Animated.new(root)]);

    const isDarkMode = document.body.classList.contains("dark-mode");

    root.container.set("background", am5.Rectangle.new(root, {
      fill: projectionType === "globe"
        ? am5.color(isDarkMode ? 0x121212 : 0xffffff)
        : am5.color(isDarkMode ? 0x1c1c1c : 0xb3e5fc),
      fillOpacity: 1
    }));

    const homeZoom = projectionType === "map" ? 2.5 : 1.1;

    chart = root.container.children.push(am5map.MapChart.new(root, {
      projection: projectionType === "map"
        ? am5map.geoMercator()
        : am5map.geoOrthographic(),
      panX: projectionType === "map" ? "translateX" : "rotateX",
      panY: projectionType === "map" ? "translateY" : "rotateY",
      wheelX: "panX",
      wheelY: "zoomY",
      homeZoomLevel: homeZoom,
      rotationX: projectionType === "globe" ? 0 : undefined
    }));

    if (projectionType === "map") {
      chart.setAll({ y: am5.percent(15), centerY: am5.p0 });
    }

    root.events.once("frameended", () => {
      initialZoom = chart.get("zoomLevel");
      initialCenter = chart.get("centerGeoPoint");
    });

    const zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    zoomControl.homeButton.set("visible", projectionType === "map");
    zoomControl.setAll({
      layout: root.verticalLayout,
      y: am5.percent(5),
      x: am5.percent(98),
      centerX: am5.p100,
      centerY: am5.p0
    });

    zoomControl.homeButton.events.on("click", () => {
      chart.set("zoomLevel", initialZoom);
      chart.set("centerGeoPoint", initialCenter);
      if (currentProjection === "globe") {
        chart.set("rotationX", 0);
        chart.set("rotationY", 0);
      }
    });

    if (projectionType === "map") {
      chart.set("zoomLevel", 1.9);
    }

    backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    backgroundSeries.mapPolygons.template.setAll({
      fill: am5.color(0xb3e5fc),
      fillOpacity: 1,
      strokeOpacity: 0
    });
    backgroundSeries.data.push({
      geometry: am5map.getGeoRectangle(90, 180, -90, -180)
    });

    polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
      exclude: ["AQ"]
    }));
    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0x81c784),
      stroke: am5.color(0xffffff),
      strokeWidth: 0.5,
      tooltipText: "{name}"
    });

    bubbleSeries = chart.series.push(am5map.MapPointSeries.new(root, {
      polygonIdField: "id",
      valueField: "value",
      calculateAggregates: true
    }));

    const circleTemplate = am5.Template.new({});

    bubbleSeries.bullets.push(function (root, series, dataItem) {
      const container = am5.Container.new(root, {});
      const circle = container.children.push(
        am5.Circle.new(root, {
          radius: 25,
          fillOpacity: 0.8,
          fill: am5.color(0xff0000),
          stroke: am5.color(0xffffff),
          strokeWidth: 2,
          tooltipText: "{name}: [bold]{value}[/]"
        }, circleTemplate)
      );

      const label = container.children.push(
        am5.Label.new(root, {
          text: "{name}",
          paddingLeft: 8,
          populateText: true,
          fontWeight: "500",
          fontSize: 13,
          centerY: am5.p50
        })
      );

      circle.on("radius", function (radius) {
        label.set("x", radius);
      });

      return am5.Bullet.new(root, {
        sprite: container,
        dynamic: true
      });
    });

    bubbleSeries.bullets.push(function () {
      return am5.Bullet.new(root, {
        sprite: am5.Label.new(root, {
          text: "{value}",
          populateText: true,
          centerX: am5.p50,
          centerY: am5.p50,
          textAlign: "center",
          fontSize: 12,
          fontWeight: "bold",
          fill: am5.color(0xffffff)
        }),
        dynamic: true
      });
    });

    bubbleSeries.set("heatRules", [{
      target: circleTemplate,
      dataField: "value",
      min: 15,
      max: 45,
      minValue: 1,
      maxValue: 50,
      key: "radius"
    }]);

    const plotData = [];
    countriesData.forEach((entry) => {
      const original = entry.country;
      const normalized = normalizeCountryName(original);
      const matchedKey = Object.keys(window.countryNameToId).find(
        (key) => normalizeCountryName(key) === normalized
      );
      if (!matchedKey) {
        console.warn(`❌ Código ISO no encontrado para: ${original}`);
        return;
      }
      const iso = window.countryNameToId[matchedKey];
      plotData.push({ id: iso, name: original, value: entry.total });
    });

    bubbleSeries.data.setAll(plotData);
    chart.appear(1000, 100);

    if (projectionType === "globe") {
      chart.set("rotationX", 0);
      chart.set("rotationY", 0);
      rotationAnimation = chart.animate({
        key: "rotationX",
        from: 0,
        to: 360,
        duration: 20000,
        loops: Infinity
      });
      isRotating = true;
      toggleBtn.parentElement.appendChild(switchBtn);
      switchBtn.textContent = "⏸ Auto-Rotate";
    }

    chart.chartContainer.events.on("pointerdown", function () {
      if (rotationAnimation && isRotating) {
        rotationAnimation.pause();
        switchBtn.textContent = "▶️ Auto-Rotate";
        isRotating = false;
      }
    });
  }

  createMap(currentProjection);

  document.getElementById("toggleProjection")?.addEventListener("click", () => {
    currentProjection = currentProjection === "globe" ? "map" : "globe";
    createMap(currentProjection);
  });

  const observer = new MutationObserver(() => {
    createMap(currentProjection);
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });
});
