/**
 * Script para generar un gráfico Gantt utilizando amCharts.
 * - Obtiene el contenedor del gráfico al cargar el DOM.
 * - Inicializa amCharts con tema animado y formato de fechas.
 * - Configura ejes X (tiempo) y Y (categorías).
 * - Crea una serie tipo columna para representar tareas en el Gantt.
 * - Carga datos desde el backend y los renderiza dinámicamente.
 */

document.addEventListener("DOMContentLoaded", function () {
    // Obtener el contenedor del gráfico
    const container = document.getElementById("ganttChartDiv");
    if (!container) return;
  
    // Inicializar amCharts cuando esté listo
    am5.ready(function () {
      const root = am5.Root.new("ganttChartDiv");
  
      // Configurar formato de fechas
      root.dateFormatter.setAll({
        dateFormat: "yyyy-MM-dd HH:mm",
        dateFields: ["valueX", "openValueX"]
      });
  
      // Aplicar tema animado
      root.setThemes([am5themes_Animated.new(root)]);
  
      // Crear gráfico principal (XYChart)
      const chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout
      }));
  
      // Eje Y: Categorías (usuarios o grupos)
      const yAxis = chart.yAxes.push(
        am5xy.CategoryAxis.new(root, {
          categoryField: "category",
          renderer: am5xy.AxisRendererY.new(root, { inversed: true })
        })
      );
  
      // Eje X: Línea de tiempo (fechas y horas)
      const xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          baseInterval: { timeUnit: "minute", count: 1 },
          renderer: am5xy.AxisRendererX.new(root, {
            minGridDistance: 90
          })
        })
      );
  
      // Serie de columnas (barras del Gantt)
      const series = chart.series.push(am5xy.ColumnSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        openValueXField: "fromDate",
        valueXField: "toDate",
        categoryYField: "category",
        sequencedInterpolation: true
      }));
  
      // Tooltip y estilo de las barras
      series.columns.template.setAll({
        tooltipText: "{category}: {openValueX} - {valueX}",
        strokeOpacity: 0
      });
  
      // Procesar datos (formato de fechas)
      series.data.processor = am5.DataProcessor.new(root, {
        dateFields: ["fromDate", "toDate"],
        dateFormat: "yyyy-MM-dd HH:mm"
      });
  
      // Scroll horizontal (opcional)
      chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
      }));
  
      // Cargar datos del backend
      fetch('/sessions/gantt/data')
        .then(res => {
          if (!res.ok) throw new Error("No autorizado o error de servidor");
          return res.json();
        })
        .then(data => {
          if (!Array.isArray(data) || data.length === 0) {
            console.warn("⚠️ No hay datos para mostrar en el Gantt.");
            return;
          }
  
          // Asignar datos a la serie
          series.data.setAll(data);
  
          // Generar categorías únicas para el eje Y
          const uniqueUsers = [...new Set(data.map(item => item.category))];
          yAxis.data.setAll(uniqueUsers.map(user => ({ category: user })));
  
          // Animaciones de aparición
          chart.appear(1000, 100);
          series.appear();
        })
        .catch(err => {
          console.error("❌ Error cargando datos del Gantt:", err);
        });
    });
  });
  