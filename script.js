/* ===== Економічна безпека Малайзії — скрипт сайту ===== */

// ---------- загальні елементи: меню, рік, анімація ----------
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger");
  const links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
    });
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
  }

  if (document.getElementById("indicatorList")) buildAnalysis();

  const obs = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
  }, { threshold: 0.08 }) : null;
  document.querySelectorAll(".reveal").forEach(el => (obs ? obs.observe(el) : el.classList.add("visible")));
});

// ---------- вихідні дані (World Bank, Малайзія, 2015–2024) ----------
const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const RAW = {
  cerealKg: [4022.3, 3977.5, 3749.6, 3770.4, 3500.9, 3653.8, 3768.1, 3576.5, 3541.7, 3543.6],
  lifeF: [78.032, 78.13, 78.262, 78.431, 78.604, 78.769, 76.712, 78.193, 79.37, 79.521],
  lifeM: [72.9, 72.972, 73.171, 73.379, 73.539, 73.688, 71.523, 73.055, 74.272, 74.448],
  imrF: [6.0, 6.1, 6.1, 6.1, 6.1, 6.2, 6.2, 6.2, 6.3, 6.3],
  imrM: [7.2, 7.3, 7.3, 7.4, 7.4, 7.4, 7.4, 7.5, 7.5, 7.6],
  exp: [69.449, 66.775, 70.012, 68.555, 65.278, 61.578, 70.633, 76.808, 68.679, 71.341],
  imp: [61.921, 60.124, 63.143, 61.848, 57.751, 55.21, 63.403, 69.617, 63.915, 66.021],
  rd: [1.27945, 1.41517, null, 1.04026, null, 0.95055, null, 1.0121, null, null],
  top10: [31.3, null, null, 31.2, null, null, 30.9, null, null, null],
  bot10: [2.3, null, null, 2.3, null, null, 2.3, null, null, null],
  debt: [53.574, 51.891, 50.05, 51.186, 52.421, 62.007, 63.267, 60.148, 64.282, 64.567],
};

// ---------- розрахунки ----------
const cereal = RAW.cerealKg.map(v => v / 100);                          // ц/га = кг/га ÷ 100
const cover = RAW.exp.map((x, i) => x / RAW.imp[i]);                    // Кп = X ÷ M
const decile = RAW.top10.map((t, i) => (t === null ? null : t / RAW.bot10[i])); // Кд = багаті ÷ бідні
const avg = arr => { const v = arr.filter(x => x !== null); return v.reduce((s, x) => s + x, 0) / v.length; };
const fmt = (v, d = 2) => (v === null || v === undefined ? "–" : v.toFixed(d).replace(".", ","));

// ---------- рівні економічної безпеки ----------
const LEVELS = {
  opt: { name: "Оптимальний", color: "#30d158" },
  sat: { name: "Задовільний", color: "#7cc47f" },
  uns: { name: "Незадовільний", color: "#e8b923" },
  dan: { name: "Небезпечний", color: "#ff8a3d" },
  cri: { name: "Критичний", color: "#ff453a" },
  abs: { name: "Абсолютна небезпека", color: "#b3261e" },
};
const chip = key => `<span class="chip lv-${key}">${LEVELS[key].name}</span>`;

// Визначення рівня за пороговими інтервалами: [нижня, верхня, рівень, включ.нижню, включ.верхню]
function levelOf(value, bands) {
  for (const [lo, hi, lv, incLo = true, incHi = false] of bands) {
    const okLo = incLo ? value >= lo : value > lo;
    const okHi = incHi ? value <= hi : value < hi;
    if (okLo && okHi) return lv;
  }
  return null;
}

// ---------- показники ----------
const INDICATORS = [
  {
    id: "cereal", comp: "Виробнича безпека", title: "Урожайність зернових культур", unit: "ц/га", d: 2,
    series: [{ name: "Урожайність, ц/га", data: cereal }],
    bands: [[0, 15, "abs"], [15, 20, "cri"], [20, 25, "dan"], [25, 35, "uns"], [35, 45, "sat"], [45, 55, "opt", true, true], [55, 75, "sat", false, true], [75, 95, "uns", false, true]],
    yMin: 30, yMax: 50, interval: "[35; 45)",
    formula: "Урожайність (ц/га) = урожайність (кг/га) ÷ 100",
    table: [["Урожайність, кг/га", RAW.cerealKg, 1], ["Урожайність, ц/га", cereal, 2]],
    trend: ["down", "↓ Погіршення"], trendShort: "40,22 → 35,44",
    text: [
      "Середнє значення 37,10 ц/га знаходиться в інтервалі [35; 45) — <b>задовільний рівень</b>.",
      "Тенденція <b>небезпечна</b>: урожайність знизилася з 40,22 ц/га (2015) до 35,44 ц/га (2024), у 2019 р. — 35,01 ц/га, майже на межі незадовільного рівня. Зниження врожайності рису посилює залежність країни від імпорту продовольства.",
    ],
    src: "Cereal yield (kg per hectare), AG.YLD.CREL.KG",
  },
  {
    id: "life", comp: "Демографічна безпека", title: "Очікувана тривалість життя при народженні", unit: "років", d: 2,
    series: [{ name: "Жінки", data: RAW.lifeF }, { name: "Чоловіки", data: RAW.lifeM }],
    bands: [[0, 66, "abs"], [66, 68, "cri"], [68, 70, "dan"], [70, 75, "uns"], [75, 78, "sat"], [78, 200, "opt"]],
    yMin: 69, yMax: 81, interval: "Ж: [78; ∞) · Ч: [70; 75)", multiLevel: ["opt", "uns"],
    table: [["Жінки, років", RAW.lifeF, 2], ["Чоловіки, років", RAW.lifeM, 2]],
    trend: ["up", "↑ Поліпшення"], trendShort: "Ж 78,03 → 79,52; Ч 72,90 → 74,45",
    text: [
      "Жінки: середнє 78,40 року — <b>оптимальний рівень</b> [78; ∞). Чоловіки: середнє 73,29 року — <b>незадовільний рівень</b> [70; 75).",
      "Тенденція <b>безпечна</b>: тривалість життя зростає; спад 2021 р. (76,71 і 71,52 року) пов'язаний з пандемією COVID-19, у 2023 р. показники перевищили допандемічний рівень.",
    ],
    src: "Life expectancy at birth, female / male, SP.DYN.LE00.FE.IN, SP.DYN.LE00.MA.IN",
  },
  {
    id: "imr", comp: "Демографічна безпека", title: "Смертність немовлят", unit: "на 1000 живонароджених", d: 1, avgD: 2,
    series: [{ name: "Дівчатка", data: RAW.imrF }, { name: "Хлопчики", data: RAW.imrM }],
    bands: [[0, 4, "opt", true, true], [4, 5, "sat", false, true], [5, 7, "uns", false, true], [7, 9, "dan", false, true], [9, 11, "cri", false, true], [11, 1000, "abs", false, true]],
    yMin: 4.5, yMax: 8.5, interval: "Д: (5; 7] · Х: (7; 9]", multiLevel: ["uns", "dan"],
    table: [["Дівчатка, на 1000", RAW.imrF, 1], ["Хлопчики, на 1000", RAW.imrM, 1]],
    trend: ["down", "↓ Погіршення"], trendShort: "Д 6,0 → 6,3; Х 7,2 → 7,6",
    text: [
      "Дівчатка: середнє 6,16 — <b>незадовільний рівень</b> (5; 7]. Хлопчики: середнє 7,40 — <b>небезпечний рівень</b> (7; 9].",
      "Тенденція <b>небезпечна</b>: смертність немовлят не знижується, а повільно зростає, що свідчить про проблеми в охороні материнства і дитинства.",
    ],
    src: "Mortality rate, infant, female / male, SP.DYN.IMRT.FE.IN, SP.DYN.IMRT.MA.IN",
  },
  {
    id: "cover", comp: "Зовнішньоекономічна безпека", title: "Коефіцієнт покриття імпорту експортом", unit: "разів", d: 3,
    series: [{ name: "Кп = X ÷ M", data: cover }],
    bands: [[0, 0.85, "abs"], [0.85, 0.9, "cri"], [0.9, 0.95, "dan"], [0.95, 0.975, "uns"], [0.975, 1, "sat"], [1, 1.2, "opt", true, true], [1.2, 1.25, "sat", false, true], [1.25, 1.3, "uns", false, true]],
    yMin: 0.98, yMax: 1.24, interval: "[1; 1,2]",
    formula: "Кп = експорт (% ВВП) ÷ імпорт (% ВВП)",
    table: [["Експорт (X), % ВВП", RAW.exp, 2], ["Імпорт (M), % ВВП", RAW.imp, 2], ["Кп = X ÷ M, разів", cover, 3]],
    trend: ["flat", "→ Стабільно, незначне зниження"], trendShort: "1,122 → 1,081",
    text: [
      "Середнє 1,107 раза знаходиться в інтервалі [1; 1,2] — <b>оптимальний рівень</b>. Усі 10 років показник був в оптимальній зоні.",
      "Після 2019 р. коефіцієнт знижується (1,130 → 1,081), бо імпорт зростає швидше за експорт. Висока частка експорту у ВВП (62–77 %) робить економіку залежною від зовнішнього попиту.",
    ],
    src: "Exports / Imports of goods and services (% of GDP), NE.EXP.GNFS.ZS, NE.IMP.GNFS.ZS",
  },
  {
    id: "rd", comp: "Інвестиційно-інноваційна безпека", title: "Витрати на дослідження та розробки", unit: "% ВВП", d: 3,
    series: [{ name: "Витрати на НДДКР, % ВВП", data: RAW.rd }],
    bands: [[0, 0.5, "abs"], [0.5, 1, "cri"], [1, 1.5, "dan"], [1.5, 2, "uns"], [2, 3, "sat"], [3, 100, "opt"]],
    yMin: 0.8, yMax: 1.7, interval: "[1; 1,5)",
    table: [["Витрати на НДДКР, % ВВП", RAW.rd, 3]],
    trend: ["down", "↓ Погіршення"], trendShort: "1,279 → 1,012",
    text: [
      "Середнє за роки з даними 1,140 % ВВП знаходиться в інтервалі [1; 1,5) — <b>небезпечний рівень</b>.",
      "Тенденція <b>небезпечна</b>: після піку 1,415 % (2016) витрати скоротилися до 0,951 % у 2020 р. (критичний рівень) і 1,012 % у 2022 р. Дані за 2017, 2019, 2021, 2023, 2024 рр. відсутні.",
    ],
    src: "Research and development expenditure (% of GDP), GB.XPD.RSDV.GD.ZS",
  },
  {
    id: "decile", comp: "Соціальна безпека", title: "Співвідношення доходів 10 % найбагатших і 10 % найбідніших", unit: "разів", d: 2,
    series: [{ name: "Кд, разів", data: decile }],
    bands: [[1, 4.5, "opt", true, true], [4.5, 5, "sat", false, true], [5, 5.5, "uns", false, true], [5.5, 6, "dan", false, true], [6, 7, "cri", false, true], [7, 100, "abs", false, true]],
    yMin: 4, yMax: 15, interval: "(7; ∞)",
    formula: "Кд = частка доходів 10 % найбагатших ÷ частка доходів 10 % найбідніших",
    table: [["Частка 10 % найбагатших, %", RAW.top10, 1], ["Частка 10 % найбідніших, %", RAW.bot10, 1], ["Кд, разів", decile, 2]],
    trend: ["flat", "→ Незначне поліпшення"], trendShort: "13,61 → 13,43",
    text: [
      "Середнє 13,54 раза знаходиться в інтервалі (7; ∞) — <b>абсолютна небезпека</b>. Це найпроблемніший показник: майже вдвічі вище порогу.",
      "Нерівність незначно зменшується (13,61 → 13,43) за рахунок скорочення частки найбагатших, але досягти безпечного рівня такими темпами неможливо. Дані — за роками обстежень (2015, 2018, 2021).",
    ],
    src: "Income share held by highest / lowest 10%, SI.DST.10TH.10, SI.DST.FRST.10",
  },
  {
    id: "debt", comp: "Фінансова безпека", title: "Загальний борг центрального уряду", unit: "% ВВП", d: 2,
    series: [{ name: "Борг уряду, % ВВП", data: RAW.debt }],
    bands: [[0, 20, "opt", true, true], [20, 30, "sat", false, true], [30, 40, "uns", false, true], [40, 50, "dan", false, true], [50, 60, "cri", false, true], [60, 1000, "abs", false, true]],
    yMin: 45, yMax: 70, interval: "(50; 60]",
    table: [["Борг уряду, % ВВП", RAW.debt, 2]],
    trend: ["down", "↓ Погіршення"], trendShort: "53,57 → 64,57",
    text: [
      "Середнє 57,34 % ВВП знаходиться в інтервалі (50; 60] — <b>критичний рівень</b>.",
      "Тенденція <b>небезпечна</b>: у 2020 р. борг стрибнув з 52,42 % до 62,01 % ВВП через антикризові програми під час пандемії; з 2020 р. щороку перевищує 60 % ВВП (абсолютна небезпека).",
    ],
    src: "Central government debt, total (% of GDP), GC.DOD.TOTL.GD.ZS",
  },
];

// Рядки зведеної таблиці (9 показників)
const SUMMARY = [
  ["Виробнича", "Урожайність зернових культур", avg(cereal), 2, "ц/га", "[35; 45)", INDICATORS[0].bands, "down", "40,22 → 35,44"],
  ["Демографічна", "Тривалість життя, жінки", avg(RAW.lifeF), 2, "років", "[78; ∞)", INDICATORS[1].bands, "up", "78,03 → 79,52"],
  ["Демографічна", "Тривалість життя, чоловіки", avg(RAW.lifeM), 2, "років", "[70; 75)", INDICATORS[1].bands, "up", "72,90 → 74,45"],
  ["Демографічна", "Смертність немовлят, дівчатка", avg(RAW.imrF), 2, "на 1000", "(5; 7]", INDICATORS[2].bands, "down", "6,0 → 6,3"],
  ["Демографічна", "Смертність немовлят, хлопчики", avg(RAW.imrM), 2, "на 1000", "(7; 9]", INDICATORS[2].bands, "down", "7,2 → 7,6"],
  ["Зовнішньоекономічна", "Коефіцієнт покриття імпорту експортом", avg(cover), 3, "разів", "[1; 1,2]", INDICATORS[3].bands, "flat", "1,122 → 1,081"],
  ["Інвестиційно-інноваційна", "Витрати на дослідження та розробки", avg(RAW.rd), 3, "% ВВП", "[1; 1,5)", INDICATORS[4].bands, "down", "1,279 → 1,012"],
  ["Соціальна", "Співвідношення доходів 10 % багатих / 10 % бідних", avg(decile), 2, "разів", "(7; ∞)", INDICATORS[5].bands, "flat", "13,61 → 13,43"],
  ["Фінансова", "Загальний борг центрального уряду", avg(RAW.debt), 2, "% ВВП", "(50; 60]", INDICATORS[6].bands, "down", "53,57 → 64,57"],
];
const TREND_TXT = { up: "↑ поліпшення", down: "↓ погіршення", flat: "→ стабільно" };

// ---------- побудова сторінки ----------
function buildAnalysis() {
  // Зведена таблиця
  const tbody = document.querySelector("#summaryTable tbody");
  const counts = {};
  SUMMARY.forEach((r, i) => {
    const lv = levelOf(r[2], r[6]);
    counts[lv] = (counts[lv] || 0) + 1;
    tbody.insertAdjacentHTML("beforeend", `<tr>
      <td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td class="num"><b>${fmt(r[2], r[3])}</b></td>
      <td>${r[4]}</td><td>${r[5]}</td><td>${chip(lv)}</td>
      <td><span class="trend ${r[7]}">${TREND_TXT[r[7]]}</span><br><small style="color:var(--muted)">${r[8]}</small></td></tr>`);
  });

  // Розподіл за рівнями
  const bar = document.getElementById("distBar"), legend = document.getElementById("distLegend");
  Object.keys(LEVELS).forEach(k => {
    const n = counts[k] || 0;
    legend.insertAdjacentHTML("beforeend", `<span style="--c:${LEVELS[k].color}">${LEVELS[k].name}: ${n} (${fmt(n / SUMMARY.length * 100, 1)} %)</span>`);
    if (n) bar.insertAdjacentHTML("beforeend", `<div style="flex:${n};background:${LEVELS[k].color}" title="${LEVELS[k].name}: ${n}">${n}</div>`);
  });

  // Картки показників
  const list = document.getElementById("indicatorList");
  INDICATORS.forEach((ind, idx) => {
    const lvKeys = ind.multiLevel || [levelOf(avg(ind.series[0].data), ind.bands)];
    const avgs = ind.series.map(s => `<div>${ind.series.length > 1 ? s.name : "Середнє 2015–2024"}<b>${fmt(avg(s.data), ind.avgD || ind.d)}</b></div>`).join("");
    const rows = ind.table.map(([label, arr, d]) =>
      `<tr><td>${label}</td>${arr.map(v => `<td class="num">${fmt(v, d)}</td>`).join("")}<td class="num avg">${fmt(avg(arr), ind.avgD || d)}</td></tr>`).join("");
    list.insertAdjacentHTML("beforeend", `
      <article class="card indicator reveal" id="ind-${ind.id}">
        <div class="ind-head">
          <div><div class="comp">${idx + 1}. ${ind.comp}</div><h3>${ind.title}, ${ind.unit}</h3></div>
          <div class="ind-meta">${lvKeys.map(chip).join("")}<span class="trend ${ind.trend[0]}">${ind.trend[1]}</span></div>
        </div>
        <div class="ind-body">
          <div class="chart-box"><canvas id="ch-${ind.id}" aria-label="Графік: ${ind.title}" role="img"></canvas></div>
          <div class="ind-text">
            <div class="stat-row">${avgs}<div>Інтервал<b style="font-size:1.05rem">${ind.interval}</b></div></div>
            ${ind.formula ? `<code class="formula">${ind.formula}</code>` : ""}
            ${ind.text.map(t => `<p>${t}</p>`).join("")}
          </div>
        </div>
        <details>
          <summary>Таблиця вихідних даних і розрахунків</summary>
          <div class="table-wrap"><table class="year-table">
            <thead><tr><th>Показник</th>${YEARS.map(y => `<th class="num">${y}</th>`).join("")}<th class="num">Середнє</th></tr></thead>
            <tbody>${rows}</tbody></table></div>
          <p class="src">Джерело: World Bank, World Development Indicators — ${ind.src}. «–» — дані відсутні.</p>
        </details>
      </article>`);
  });

  // Джерела
  const srcList = document.getElementById("sourceList");
  [["AG.YLD.CREL.KG", "Cereal yield (kg per hectare)"], ["SP.DYN.LE00.FE.IN", "Life expectancy at birth, female"], ["SP.DYN.LE00.MA.IN", "Life expectancy at birth, male"],
   ["SP.DYN.IMRT.FE.IN", "Mortality rate, infant, female"], ["SP.DYN.IMRT.MA.IN", "Mortality rate, infant, male"], ["NE.EXP.GNFS.ZS", "Exports of goods and services (% of GDP)"],
   ["NE.IMP.GNFS.ZS", "Imports of goods and services (% of GDP)"], ["GB.XPD.RSDV.GD.ZS", "Research and development expenditure (% of GDP)"],
   ["SI.DST.10TH.10", "Income share held by highest 10%"], ["SI.DST.FRST.10", "Income share held by lowest 10%"], ["GC.DOD.TOTL.GD.ZS", "Central government debt, total (% of GDP)"]]
    .forEach(([code, name]) => srcList.insertAdjacentHTML("beforeend",
      `<li>World Bank. ${name} [${code}]. <a href="https://data.worldbank.org/indicator/${code}?locations=MY" target="_blank" rel="noopener">data.worldbank.org/indicator/${code}</a></li>`));

  drawCharts();
}

// ---------- графіки (Chart.js) ----------
function drawCharts() {
  if (typeof Chart === "undefined") {
    document.querySelectorAll(".chart-box").forEach(b => (b.innerHTML = '<p style="color:var(--muted)">Графік не завантажився — перевірте підключення до Інтернету. Дані наведено в таблиці нижче.</p>'));
    return;
  }
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Helvetica Neue', Arial, sans-serif";
  Chart.defaults.color = "#8e8e93";

  // Плагін: кольорові зони порогових значень + підписи рівнів
  const bandsPlugin = {
    id: "bands",
    beforeDatasetsDraw(chart, _a, opts) {
      const { ctx, chartArea: a, scales: { y } } = chart;
      if (!opts.bands) return;
      ctx.save();
      opts.bands.forEach(([lo, hi, lv]) => {
        const top = y.getPixelForValue(Math.min(hi, y.max)), bot = y.getPixelForValue(Math.max(lo, y.min));
        if (bot <= top) return;
        ctx.fillStyle = LEVELS[lv].color + "26";
        ctx.fillRect(a.left, top, a.right - a.left, bot - top);
        if (bot - top > 14) {
          ctx.fillStyle = LEVELS[lv].color;
          ctx.font = "500 11px -apple-system, BlinkMacSystemFont, Inter, sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(LEVELS[lv].name, a.right - 6, top + 14);
        }
      });
      ctx.restore();
    },
  };

  const COLORS = ["#409cff", "#ff9f45"];
  INDICATORS.forEach(ind => {
    const datasets = ind.series.map((s, i) => ({
      label: s.name, data: s.data, borderColor: COLORS[i], backgroundColor: COLORS[i],
      borderWidth: 2.5, pointRadius: 3.5, pointHoverRadius: 7, pointBorderColor: "#1c1c1e", pointBorderWidth: 1.5,
      tension: 0, spanGaps: true,
    }));
    if (ind.series.length === 1) {
      const a = avg(ind.series[0].data);
      datasets.push({ label: `Середнє: ${fmt(a, ind.d)}`, data: YEARS.map(() => a), borderColor: "#aeaeb2", borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 0 });
    }
    new Chart(document.getElementById("ch-" + ind.id), {
      type: "line",
      data: { labels: YEARS, datasets },
      plugins: [bandsPlugin],
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          y: { min: ind.yMin, max: ind.yMax, grid: { color: "rgba(255,255,255,.07)" }, border: { display: false }, ticks: { callback: v => String(+v.toFixed(3)).replace(".", ",") } },
          x: { grid: { display: false } },
        },
        plugins: {
          bands: { bands: ind.bands },
          legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 14 } },
          tooltip: {
            backgroundColor: "rgba(44,44,46,.96)", padding: 12, cornerRadius: 10,
            filter: item => item.raw !== null,
            callbacks: {
              label: c => {
                if (c.dataset.label.startsWith("Середнє")) return " " + c.dataset.label;
                const lv = levelOf(c.raw, ind.bands);
                return ` ${c.dataset.label}: ${fmt(c.raw, ind.d)} ${ind.unit}` + (lv ? ` — ${LEVELS[lv].name}` : "");
              },
            },
          },
        },
      },
    });
  });
}
