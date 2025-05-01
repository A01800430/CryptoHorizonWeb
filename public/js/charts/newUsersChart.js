/**
 * Script para visualizar nuevos usuarios por día con amCharts.
 * - Usa un gráfico de línea interactivo con la opción de dibujar otra serie personalizada.
 * - Incluye scroll, zoom, tooltip, puntos visibles y botón para limpiar el trazo.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Verifica que existan datos válidos en la variable global
  if (!window.newUsersByDay || !Array.isArray(window.newUsersByDay)) return;

  // Inicializa amCharts cuando el DOM esté listo
  am5.ready(function () {
    // Crea el root y aplica el tema animado
    const root = am5.Root.new("newUsersChart");
    root.setThemes([am5themes_Animated.new(root)]);

    // Crea el contenedor principal del gráfico
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        paddingLeft: 0
      })
    );

    // Personaliza los colores
    chart.get("colors").set("step", 3);

    // Eje X (fechas)
    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.3,
        baseInterval: { timeUnit: "day", count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {
          minorGridEnabled: true,
          minGridDistance: 70
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    // Eje Y (cantidad de usuarios)
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0.3,
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    // Serie principal de nuevos usuarios
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "New Users",
        xAxis,
        yAxis,
        valueYField: "value",
        valueXField: "date",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueY}"
        })
      })
    );

    // Estilo visual de la línea y área
    series.strokes.template.setAll({ strokeWidth: 2 });
    series.fills.template.setAll({ fillOpacity: 0.2, visible: true });

    // Puntos visibles en la serie
    series.bullets.push(function () {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 4,
          fill: root.interfaceColors.get("background"),
          stroke: series.get("stroke"),
          strokeWidth: 2
        })
      });
    });

    // Procesamiento de datos: convierte fechas string a timestamps
    const processedData = window.newUsersByDay.map((d) => ({
      date: new Date(d.day).getTime(),
      value: d.count
    }));
    series.data.setAll(processedData);

    // Serie adicional que el usuario puede dibujar manualmente
    const drawingSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Drawn Line",
        xAxis,
        yAxis,
        valueYField: "value",
        valueXField: "date"
      })
    );

    // Puntos arrastrables (invisibles) para moverlos
    drawingSeries.bullets.push(function () {
      const bullet = am5.Circle.new(root, {
        radius: 6,
        fillOpacity: 0,
        fill: drawingSeries.get("fill"),
        draggable: true,
        cursorOverStyle: "pointer"
      });
      bullet.events.on("dragged", (e) => handleDrag(e));
      return am5.Bullet.new(root, { sprite: bullet });
    });

    // Puntos visibles sobre la serie dibujada
    drawingSeries.bullets.push(function () {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: drawingSeries.get("fill")
        })
      });
    });

    // Lógica para actualizar posición al arrastrar un punto
    function handleDrag(e) {
      const point = chart.plotContainer.toLocal(e.point);
      const date = xAxis.positionToValue(xAxis.coordinateToPosition(point.x));
      const value = yAxis.positionToValue(yAxis.coordinateToPosition(point.y));
      const dataItem = e.target.dataItem;

      dataItem.set("valueX", date);
      dataItem.set("valueXWorking", date);
      dataItem.set("valueY", value);
      dataItem.set("valueYWorking", value);
    }

    // Agregar punto nuevo con clic en el área del gráfico
    chart.plotContainer.get("background").events.on("click", function (e) {
      const point = chart.plotContainer.toLocal(e.point);
      const date = xAxis.positionToValue(xAxis.coordinateToPosition(point.x));
      const value = yAxis.positionToValue(yAxis.coordinateToPosition(point.y));

      drawingSeries.data.push({ date, value });
      drawingSeries.setPrivate("endIndex", drawingSeries.data.length);
      sortData();
    });

    // Ordena los puntos dibujados para que la línea sea continua
    function sortData() {
      drawingSeries.dataItems.sort((a, b) => a.get("valueX") - b.get("valueX"));
    }

    // Texto de ayuda en la esquina superior
    chart.plotContainer.children.push(
      am5.Label.new(root, {
        x: 10,
        y: 10,
        text: "Click on plot area to draw a series",
        fontSize: 14,
        fill: am5.color(0x555555)
      })
    );

    // Botón para borrar los puntos de la serie dibujada
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Clear Drawing";
    deleteBtn.style.margin = "10px 0";
    deleteBtn.className = "btn btn-sm btn-danger";
    document.getElementById("newUsersChart").before(deleteBtn);

    deleteBtn.addEventListener("click", () => {
      drawingSeries.data.setAll([]);
    });

    // Cursor interactivo
    chart.set("cursor", am5xy.XYCursor.new(root, {
      xAxis: xAxis,
      behavior: "zoomX"
    }));

    // Scrollbar horizontal
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal"
    }));

    // Animación de aparición
    series.appear(1000);
    chart.appear(1000, 100);
  });
});
