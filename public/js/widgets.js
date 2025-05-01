/**
 * Script para generar un dashboard dinámico con GridStack y Chart.js.
 * - Permite arrastrar widgets desde un panel lateral al grid.
 * - Renderiza distintos tipos de gráficos según el tipo seleccionado.
 * - Previene errores por datos indefinidos.
 */

document.addEventListener("DOMContentLoaded", () => {
  const grid = GridStack.init({
    cellHeight: 120,
    draggable: { handle: '.grid-stack-item-content' },
    removable: '#trash',
    acceptWidgets: '.sidepanel-item'
  });

  const chartRefs = [];

  function renderChart(chartType, canvasId) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    let chart;

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
    } else if (chartType === "achievements") {
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: achievementsByType.map(a => a.type),
          datasets: [{
            label: 'Achievements',
            data: achievementsByType.map(a => a.total),
            backgroundColor: '#ffc107'
          }]
        }
      });
    }  else if (chartType === "osDevices") {
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: osDevicesData.map(o => o.os), // ✅ Debe coincidir con alias del SQL: `AS os`
      datasets: [{
        data: osDevicesData.map(o => o.total),
        backgroundColor: ['#00ffe7', '#9327ff', '#dc3545', '#198754', '#ffc107']
      }]
    }
  });
    } else if (chartType === "hardestLevels") {
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: hardestLevels.map(l => l.level),
          datasets: [{
            label: 'Avg Accuracy',
            data: hardestLevels.map(l => l.accuracy),
            backgroundColor: '#dc3545'
          }]
        },
        options: {
          indexAxis: 'y',
          scales: {
            x: {
              max: 100,
              title: { display: true, text: "Accuracy (%)" }
            }
          }
        }
      });
    }

    if (chart) chartRefs.push(chart);
  }

  grid.on('added', (e, items) => {
    items.forEach(item => {
      const chartType = item.el.getAttribute('data-chart');
      if (!chartType) return;

      const canvasId = `chart-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      // ✅ Mantener el div para que respete padding + canvas
      const wrapper = document.createElement('div');
      wrapper.className = 'grid-stack-item-content';
      wrapper.innerHTML = `<canvas id="${canvasId}" style="width:100%;height:100%;"></canvas>`;

      item.el.innerHTML = '';
      item.el.appendChild(wrapper);

      renderChart(chartType, canvasId);
    });
  });

  grid.on('change', () => {
    chartRefs.forEach(chart => chart.resize());
  });

  setTimeout(() => {
    chartRefs.forEach(chart => chart.resize());
  }, 600);

  GridStack.setupDragIn('.sidepanel-item', {
    helper: 'clone'
  });
});
