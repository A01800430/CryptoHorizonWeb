am5.ready(function () {
  const genderData = window.genderCountData || [];
  const maleCount = genderData.find(g => g.gender?.toLowerCase() === "male")?.total || 0;
  const femaleCount = genderData.find(g => g.gender?.toLowerCase() === "female")?.total || 0;
  const total = maleCount + femaleCount;

  // 🔧 Ajusta dinámicamente la altura del contenedor
  const rowHeight = 70; // aprox. 2 filas de íconos
  const padding = 80; // para títulos y espacios
  const heightEstimate = rowHeight * 2 + Math.ceil(total / 20) * rowHeight + padding;

  // Asignar altura al div antes de inicializar el gráfico
  document.getElementById("genderChart").style.height = `${heightEstimate}px`;

  // 📊 Inicializa amCharts
  const root = am5.Root.new("genderChart");
  root.setThemes([am5themes_Animated.new(root)]);

  const iconSize = 50; // px
  const iconSpacing = 7; // px

  const chart = root.container.children.push(am5.Container.new(root, {
    layout: root.verticalLayout,
    width: am5.percent(100),
    height: am5.fit,
    paddingTop: 10,
    paddingBottom: 10
  }));

  const addRow = (label, count, total, color, iconPath) => {
    const row = chart.children.push(am5.Container.new(root, {
      layout: root.horizontalLayout,
      x: am5.p50,
      centerX: am5.p50,
      centerY: am5.p50,
      paddingBottom: 8
    }));

    row.children.push(am5.Label.new(root, {
      text: `${label} ${count}/${total}`,
      fontSize: 16,
      fontWeight: "500",
      fill: am5.color(0x333333),
      minWidth: 120,
      textAlign: "right",
      centerY: am5.p50,
      marginRight: 16
    }));

    for (let i = 0; i < total; i++) {
      const fill = i < count ? color : am5.color(0xcccccc);
      const icon = am5.Graphics.new(root, {
        svgPath: iconPath,
        width: iconSize,
        height: iconSize,
        fill: fill,
        opacity: 0,
        marginRight: iconSpacing,
        centerY: am5.p50,
        scale: 0.8
      });

      row.children.push(icon);

      icon.animate({
        key: "opacity",
        to: 1,
        duration: 300,
        delay: i * 40,
        easing: am5.ease.out(am5.ease.cubic)
      });
    }
  };

  const maleColor = am5.color(0x247ba0);
  const femaleColor = am5.color(0xf25f5c);
  const maleIcon = "M 25.1 10.7 c 2.1 0 3.7 -1.7 3.7 -3.7 c 0 -2.1 -1.7 -3.7 -3.7 -3.7 c -2.1 0 -3.7 1.7 -3.7 3.7 C 21.4 9 23 10.7 25.1 10.7 z M 28.8 11.5 H 25.1 h -3.7 c -2.8 0 -4.7 2.5 -4.7 4.8 V 27.7 c 0 2.2 3.1 2.2 3.1 0 V 17.2 h 0.6 v 28.6 c 0 3 4.2 2.9 4.3 0 V 29.3 h 0.7 h 0.1 v 16.5 c 0.2 3.1 4.3 2.8 4.3 0 V 17.2 h 0.5 v 10.5 c 0 2.2 3.2 2.2 3.2 0 V 16.3 C 33.5 14 31.6 11.5 28.8 11.5 z";
  const femaleIcon = "M 18.4 15.1 L 15.5 25.5 c -0.6 2.3 2.1 3.2 2.7 1 l 2.6 -9.6 h 0.7 l -4.5 16.9 H 21.3 v 12.7 c 0 2.3 3.2 2.3 3.2 0 V 33.9 h 1 v 12.7 c 0 2.3 3.1 2.3 3.1 0 V 33.9 h 4.3 l -4.6 -16.9 h 0.8 l 2.6 9.6 c 0.7 2.2 3.3 1.3 2.7 -1 l -2.9 -10.4 c -0.4 -1.2 -1.8 -3.3 -4.2 -3.4 h -4.7 C 20.1 11.9 18.7 13.9 18.4 15.1 z M 28.6 7.2 c 0 -2.1 -1.6 -3.7 -3.7 -3.7 c -2 0 -3.7 1.7 -3.7 3.7 c 0 2.1 1.6 3.7 3.7 3.7 C 27 10.9 28.6 9.2 28.6 7.2 z";

  addRow("Male", maleCount, total, maleColor, maleIcon);
  addRow("Female", femaleCount, total, femaleColor, femaleIcon);
});
