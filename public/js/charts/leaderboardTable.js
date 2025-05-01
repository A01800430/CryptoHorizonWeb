/**
 * Script para generar y visualizar el leaderboard.
 * - Consulta los mejores 10 usuarios por puntaje total.
 * - Aplica estilos especiales a los 3 primeros lugares (oro, plata, bronce).
 * - Muestra el tiempo total en segundos junto con el puntaje.
 * - Carga dinámica mediante fetch hacia el backend en /generateLeaderboard.
 */

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("leaderboardBody");
  if (!tbody) return;

  // Llama a la API para obtener el leaderboard
  fetch("/generateLeaderboard")
    .then(res => res.json())
    .then(result => {
      if (!result.done || !Array.isArray(result.leaderboard)) {
        tbody.innerHTML = `<tr><td colspan="4">No data</td></tr>`;
        return;
      }

      // Ordena los usuarios por puntaje descendente y tiempo ascendente
      const sorted = result.leaderboard
        .sort((a, b) => {
          const scoreDiff = parseInt(b.TotalScore) - parseInt(a.TotalScore);
          if (scoreDiff !== 0) return scoreDiff;
          return parseInt(a.TotalTime) - parseInt(b.TotalTime);
        })
        .slice(0, 10); // Limita a top 10

      // Recorre cada usuario y crea una fila en la tabla
      sorted.forEach((item, index) => {
        const tr = document.createElement("tr");

        // Estilo visual para los 3 primeros lugares
        if (index === 0) tr.classList.add("gold-row");
        else if (index === 1) tr.classList.add("silver-row");
        else if (index === 2) tr.classList.add("bronze-row");

        // Íconos especiales para los primeros lugares
        const emojis = ["🥇", "🥈", "🥉"];
        const rank = emojis[index] || index + 1;

        // Inserta datos en la fila
        tr.innerHTML = `
          <td>${rank}</td>
          <td>${item.Username}</td>
          <td>${item.TotalScore}</td>
          <td>${item.TotalTime}</td>
        `;

        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("❌ Error al obtener leaderboard:", err);
      tbody.innerHTML = `<tr><td colspan="4">Error loading data</td></tr>`;
    });
});
