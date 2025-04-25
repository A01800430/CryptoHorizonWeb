/**
 * Script para generar un dashboard dinámico con GridStack y Chart.js.
 * - Permite arrastrar widgets desde un panel lateral al grid.
 * - Renderiza distintos tipos de gráficos según el tipo seleccionado.
 * - Soporta redimensionamiento automático y múltiples tipos de gráficos.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar el grid (layout de paneles)
    const grid = GridStack.init({
      cellHeight: 120,
      draggable: { handle: '.grid-stack-item-content' },
      removable: '#trash',
      acceptWidgets: '.sidepanel-item'
    });
  
    const chartRefs = []; // Referencias a los gráficos activos
  
    // Función para renderizar gráficos según tipo y canvasId
    function renderChart(chartType, canvasId) {
      const ctx = document.getElementById(canvasId)?.getContext('2d');
      if (!ctx) return;
  
      let chart;
  
      // Gráfico de sesiones por día (línea)
      if (chartType === "sessionsDay") {
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: sessionsByDay.map(d => d.day),
            datasets: [{
              label: 'Sessions',
              data: sessionsByDay.map(d => d.count),
              borderColor: '#9327ff',
              backgroundColor: 'rgba(147,39,255,0.2)',
              tension: 0.3
            }]
          }
        });
  
      // Gráfico de pastel por país
      } else if (chartType === "countryPie") {
        chart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: countriesPie.map(c => c.country),
            datasets: [{
              data: countriesPie.map(c => c.total),
              backgroundColor: ['#9327ff', '#00ffe7', '#ffc107', '#dc3545', '#198754']
            }]
          }
        });
  
      // Histograma de duración
      } else if (chartType === "histogram") {
        chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: durationHistogram.map(d => `${d.duration_min} min`),
            datasets: [{
              label: 'Sessions',
              data: durationHistogram.map(d => d.count),
              backgroundColor: '#00ffe7'
            }]
          }
        });
  
      // Gráfico de barras por género y plataforma
      } else if (chartType === "genderPlatform") {
        const platforms = [...new Set(genderPlatformData.map(d => d.platform))];
        const genders = [...new Set(genderPlatformData.map(d => d.gender))];
  
        const datasets = genders.map(gender => ({
          label: gender,
          data: platforms.map(platform =>
            genderPlatformData.find(d => d.gender === gender && d.platform === platform)?.total || 0),
          backgroundColor: gender === 'Female' ? '#9327ff' : gender === 'Male' ? '#ff0000' : '#ffc107'
        }));
  
        chart = new Chart(ctx, {
          type: 'bar',
          data: { labels: platforms, datasets }
        });
      }
  
      // Guardar referencia al gráfico
      if (chart) chartRefs.push(chart);
    }
  
    // Renderizar gráfico cuando se agrega un widget al grid
    grid.on('added', (e, items) => {
      items.forEach(item => {
        const chartType = item.el.getAttribute('data-chart');
        if (!chartType) return;
  
        // Crear canvas dinámico
        const canvasId = `chart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        item.el.innerHTML = `<div class="grid-stack-item-content"><canvas id="${canvasId}" style="width:100%;height:100%;"></canvas></div>`;
  
        // Renderizar gráfico correspondiente
        renderChart(chartType, canvasId);
      });
    });
  
    // Redimensionar todos los gráficos al mover/cambiar tamaño de widgets
    grid.on('change', () => {
      chartRefs.forEach(chart => chart.resize());
    });
  
    // Redimensionar gráficos después del primer render (fix visual)
    setTimeout(() => {
      chartRefs.forEach(chart => chart.resize());
    }, 600);
  
    // Configurar drag desde panel lateral al grid
    GridStack.setupDragIn('.sidepanel-item', {
      helper: 'clone'
    });
  });
  