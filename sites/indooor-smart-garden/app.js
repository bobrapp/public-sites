/* ============================================================
   Indoor Garden Showdown — interactive logic
   ============================================================ */

// ----- Data ------------------------------------------------------

const DATA = {
  rise: {
    name: "Rise Gardens · 1-Level",
    color: "#6b3f2a",
    color2: "#a3613f",
    bg: "#f0e3d2",
    price: 1020,                 // configured 1-level retail
    capacity: 36,                // small plants
    capacityNote: "12 large / 24 medium / 36 small",
    energyKWh: 51,               // conservative monthly estimate (FAQ: 43 kWh nominal)
    warrantyMonths: 36,          // 3-yr hardware AND electronic
    membershipMonthly: 0,
    maintMinPerWeek: 12,         // weekly water + nutrients; monthly cleaning amortized
    maintMaxPerWeek: 20,
    expandableTo: 108,           // up to 3 levels
    expandable: true,
    harvestLbsPerYear: 90,       // greens-heavy mix; fewer but larger plants per level
    reliability: 76,             // composite
    notes: [
      "Modular wood-and-steel frame, stack to 3 levels (108 plants).",
      "Weekly: top-up 9-gal tank + nutrients. Monthly: light cleaning. Deep clean every 4–6 months.",
      "No required subscription — Rise app and growing guides are free."
    ]
  },
  gardyn: {
    name: "Gardyn Home 4.0",
    color: "#2f6b4f",
    color2: "#4a9472",
    bg: "#dfeadf",
    price: 899,
    capacity: 30,
    capacityNote: "30 plants in 2 sq ft",
    energyKWh: 47,
    warrantyMonths: 24,          // 24 mo standard; 36 mo extended optional
    membershipMonthly: 39,       // Kelby AI
    maintMinPerWeek: 5,
    maintMaxPerWeek: 10,
    expandableTo: 30,            // single tower; not modular
    expandable: false,
    harvestLbsPerYear: 110,      // 8–10 lbs/mo per Gardyn; we use 9.2 lbs avg → ~110/yr
    reliability: 62,             // composite (lower due to BBB / Trustpilot patterns)
    notes: [
      "Vertical tower with two cameras and per-pod monitoring; Kelby AI assistant.",
      "Self-watering 4+ gal reservoir refilled every 1–2 weeks.",
      "Best yield numbers come from owners who pay for the membership and use Gardyn-supplied yCubes."
    ]
  }
};

// ----- DOM helpers ----------------------------------------------

const $ = (id) => document.getElementById(id);
const fmtUSD = (n) => "$" + Math.round(n).toLocaleString();
const fmt0  = (n) => Math.round(n).toLocaleString();
const fmt1  = (n) => (Math.round(n * 10) / 10).toLocaleString();

// ----- State -----------------------------------------------------

const state = {
  rate: 0.20,
  time: 15,
  years: 2,
  membership: true,
  weights: { price: 3, capacity: 3, maint: 3, expand: 2, reliab: 4, energy: 2 }
};

// ----- Spec table ------------------------------------------------

function buildSpecTable() {
  const tbody = document.querySelector("#spec-table tbody");
  const rows = [
    {
      label: "Plant capacity",
      rise: `<span class="num">36</span> plants <span class="hint">(${DATA.rise.capacityNote})</span>`,
      gardyn: `<span class="num">30</span> plants <span class="hint">(2 sq ft footprint)</span>`,
      edge: DATA.rise.capacity > DATA.gardyn.capacity ? "rise" : "gardyn"
    },
    {
      label: "Footprint",
      rise: `36.25" W × 16.25" D × 39.5" H`,
      gardyn: `~25" W × 25" D × 56" H (vertical)`,
      edge: "gardyn", edgeLabel: "smaller"
    },
    {
      label: "List price",
      rise: `<span class="num">$1,020</span>`,
      gardyn: `<span class="num">$899</span>`,
      edge: "gardyn", edgeLabel: "lower"
    },
    {
      label: "Energy use",
      rise: `<span class="num">51 kWh</span>/mo`,
      gardyn: `<span class="num">47 kWh</span>/mo`,
      edge: "gardyn", edgeLabel: "lower"
    },
    {
      label: "Annual harvest (est.)",
      rise: `<span class="num">~90 lb</span>/yr`,
      gardyn: `<span class="num">~110 lb</span>/yr`,
      edge: "gardyn", edgeLabel: "higher"
    },
    {
      label: "Maintenance time",
      rise: `<span class="num">12–20 min</span>/wk`,
      gardyn: `<span class="num">5–10 min</span>/wk`,
      edge: "gardyn", edgeLabel: "less"
    },
    {
      label: "Expandability",
      rise: `Modular — stack to <span class="num">3 levels / 108 plants</span>`,
      gardyn: `Fixed — single tower, <span class="num">30 plants</span>`,
      edge: "rise", edgeLabel: "modular"
    },
    {
      label: "Warranty",
      rise: `<span class="num">3 yr</span> hardware + electronics`,
      gardyn: `<span class="num">2 yr</span> standard (3 yr extended add-on)`,
      edge: "rise", edgeLabel: "longer"
    },
    {
      label: "Required subscription",
      rise: `None`,
      gardyn: `Optional Kelby AI — <span class="num">$39/mo</span>`,
      edge: "rise", edgeLabel: "no fees"
    },
    {
      label: "User reliability score",
      rise: `<span class="num">76</span>/100`,
      gardyn: `<span class="num">62</span>/100`,
      edge: "rise", edgeLabel: "higher"
    }
  ];

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="label">${r.label}</td>
      <td class="val col-rise">${r.rise}</td>
      <td class="val col-gardyn">${r.gardyn}</td>
      <td class="edge"><span class="edge-tag edge-${r.edge}">${
        r.edge === "rise" ? "Rise" : r.edge === "gardyn" ? "Gardyn" : "Tie"
      }${r.edgeLabel ? " · " + r.edgeLabel : ""}</span></td>
    </tr>
  `).join("");
}

// ----- Cost computation -----------------------------------------

function totalCost(side) {
  const months = state.years * 12;
  const electricity = DATA[side].energyKWh * state.rate * months;
  const membership = side === "gardyn" && state.membership
    ? DATA.gardyn.membershipMonthly * months
    : 0;
  return {
    hardware: DATA[side].price,
    electricity,
    membership,
    total: DATA[side].price + electricity + membership
  };
}

// ----- Charts ---------------------------------------------------

let costChart, radarChart, harvestChart, energyChart;

function chartDefaults() {
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = "#4a4d44";
  Chart.defaults.borderColor = "#d8d4c4";
}

function renderCostChart() {
  const ctx = $("cost-chart").getContext("2d");
  const r = totalCost("rise");
  const g = totalCost("gardyn");
  const data = {
    labels: ["Hardware", "Electricity", "Membership"],
    datasets: [
      {
        label: DATA.rise.name,
        data: [r.hardware, r.electricity, r.membership],
        backgroundColor: DATA.rise.color,
        borderRadius: 4,
        stack: "rise"
      },
      {
        label: DATA.gardyn.name,
        data: [g.hardware, g.electricity, g.membership],
        backgroundColor: DATA.gardyn.color,
        borderRadius: 4,
        stack: "gardyn"
      }
    ]
  };
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, padding: 14 } },
      tooltip: {
        callbacks: { label: (c) => `${c.dataset.label} · ${c.label}: ${fmtUSD(c.raw)}` }
      }
    },
    scales: {
      x: { stacked: true, ticks: { callback: (v) => "$" + fmt0(v) }, grid: { color: "#ece8da" } },
      y: { stacked: true, grid: { display: false } }
    }
  };
  if (costChart) { costChart.data = data; costChart.update(); }
  else costChart = new Chart(ctx, { type: "bar", data, options: opts });
}

function renderRadarChart() {
  const ctx = $("radar-chart").getContext("2d");
  // Normalize each metric 0-100 (higher = better for the user)
  const metrics = {
    "Capacity":      { rise: 100, gardyn: 83 },
    "Affordability": { rise: 88,  gardyn: 100 }, // inverse of price
    "Energy efficiency": { rise: 92, gardyn: 100 },
    "Low maintenance": { rise: 60, gardyn: 95 },
    "Expandability":   { rise: 100, gardyn: 28 },
    "Reliability":     { rise: 76, gardyn: 62 },
    "Warranty":        { rise: 100, gardyn: 67 }
  };
  const labels = Object.keys(metrics);
  const data = {
    labels,
    datasets: [
      {
        label: DATA.rise.name,
        data: labels.map(k => metrics[k].rise),
        borderColor: DATA.rise.color,
        backgroundColor: DATA.rise.color + "22",
        pointBackgroundColor: DATA.rise.color,
        pointRadius: 3,
        borderWidth: 2
      },
      {
        label: DATA.gardyn.name,
        data: labels.map(k => metrics[k].gardyn),
        borderColor: DATA.gardyn.color,
        backgroundColor: DATA.gardyn.color + "22",
        pointBackgroundColor: DATA.gardyn.color,
        pointRadius: 3,
        borderWidth: 2
      }
    ]
  };
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, padding: 14 } } },
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { display: false, stepSize: 20 },
        grid: { color: "#ece8da" },
        angleLines: { color: "#ece8da" },
        pointLabels: { font: { size: 11, weight: "500" }, color: "#4a4d44" }
      }
    }
  };
  if (radarChart) { radarChart.data = data; radarChart.update(); }
  else radarChart = new Chart(ctx, { type: "radar", data, options: opts });
}

function renderHarvestChart() {
  const ctx = $("harvest-chart").getContext("2d");
  // Breakdown of typical mix per system
  const data = {
    labels: ["Leafy greens", "Herbs", "Fruiting (tom/pep)", "Microgreens / extras"],
    datasets: [
      {
        label: DATA.rise.name,
        data: [50, 14, 22, 4],
        backgroundColor: DATA.rise.color,
        borderRadius: 4
      },
      {
        label: DATA.gardyn.name,
        data: [70, 22, 14, 4],
        backgroundColor: DATA.gardyn.color,
        borderRadius: 4
      }
    ]
  };
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, padding: 14 } },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw} lb/yr` } }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#ece8da" }, ticks: { callback: v => v + " lb" } }
    }
  };
  if (harvestChart) { harvestChart.data = data; harvestChart.update(); }
  else harvestChart = new Chart(ctx, { type: "bar", data, options: opts });
}

function renderEnergyChart() {
  const ctx = $("energy-chart").getContext("2d");
  const months = 12;
  const labels = Array.from({length: months}, (_, i) =>
    new Date(2026, i, 1).toLocaleString("en", { month: "short" })
  );
  const data = {
    labels,
    datasets: [
      {
        label: `${DATA.rise.name} ($/mo)`,
        data: labels.map(() => DATA.rise.energyKWh * state.rate),
        borderColor: DATA.rise.color,
        backgroundColor: DATA.rise.color + "22",
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        borderWidth: 2
      },
      {
        label: `${DATA.gardyn.name} ($/mo)`,
        data: labels.map(() => DATA.gardyn.energyKWh * state.rate),
        borderColor: DATA.gardyn.color,
        backgroundColor: DATA.gardyn.color + "22",
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        borderWidth: 2
      }
    ]
  };
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, padding: 14 } },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: $${fmt1(c.raw)}` } }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#ece8da" }, ticks: { callback: v => "$" + fmt1(v) } }
    }
  };
  if (energyChart) { energyChart.data = data; energyChart.update(); }
  else energyChart = new Chart(ctx, { type: "line", data, options: opts });
}

// ----- Profile match scoring ------------------------------------

function profileScores() {
  // Each metric returns 0-100 for each side
  const m = {
    price:    { rise: 88,  gardyn: 100 }, // price affordability
    capacity: { rise: 100, gardyn: 83 },
    maint:    { rise: 60,  gardyn: 95 },
    expand:   { rise: 100, gardyn: 28 },
    reliab:   { rise: 76,  gardyn: 62 },
    energy:   { rise: 92,  gardyn: 100 }
  };

  // Time budget filter: if user wants very low time, penalize Rise more
  const tBudget = state.time;
  if (tBudget < 10)      { m.maint.rise -= 25; m.maint.gardyn -= 5; }
  else if (tBudget < 15) { m.maint.rise -= 12; }
  else if (tBudget > 25) { m.maint.rise += 10; } // hobbyists fine with Rise

  // Membership off → Gardyn loses some reliability/automation benefit
  if (!state.membership) {
    m.maint.gardyn -= 15;
    m.reliab.gardyn -= 5;
  }

  const w = state.weights;
  const totalW = (w.price + w.capacity + w.maint + w.expand + w.reliab + w.energy) || 1;

  const compute = (side) =>
    (m.price[side]    * w.price +
     m.capacity[side] * w.capacity +
     m.maint[side]    * w.maint +
     m.expand[side]   * w.expand +
     m.reliab[side]   * w.reliab +
     m.energy[side]   * w.energy) / totalW;

  return { rise: compute("rise"), gardyn: compute("gardyn") };
}

// ----- Render summary numbers + verdict -------------------------

function renderSummary() {
  const r = totalCost("rise");
  const g = totalCost("gardyn");
  $("cost-rise").textContent = fmtUSD(r.total);
  $("cost-gardyn").textContent = fmtUSD(g.total);
  $("cost-rise-foot").textContent =
    `Hardware ${fmtUSD(r.hardware)} + electricity ${fmtUSD(r.electricity)}`;
  $("cost-gardyn-foot").textContent =
    `Hardware ${fmtUSD(g.hardware)} + electricity ${fmtUSD(g.electricity)}` +
    (r.membership || g.membership ? ` + membership ${fmtUSD(g.membership)}` : "");

  const scores = profileScores();
  $("score-rise").textContent = Math.round(scores.rise);
  $("score-gardyn").textContent = Math.round(scores.gardyn);

  // Reliability bars
  $("reliab-rise-num").textContent = DATA.rise.reliability;
  $("reliab-gardyn-num").textContent = DATA.gardyn.reliability;
  $("reliab-rise-bar").style.width   = DATA.rise.reliability + "%";
  $("reliab-gardyn-bar").style.width = DATA.gardyn.reliability + "%";

  // Verdict copy
  const diff = scores.rise - scores.gardyn;
  let pickHTML = "";
  let copy = "";
  if (Math.abs(diff) < 3) {
    pickHTML = `<span class="verdict-pick tie">It's close.</span>`;
    copy = `Both systems land within a few points of each other on your weighting. Choose by aesthetics and where you'll put it: Rise if you have shelf space and like the wood-cabinet look; Gardyn if you want a vertical tower in 2 sq ft.`;
  } else if (diff > 0) {
    pickHTML = `<span class="verdict-pick rise">Rise Gardens wins.</span>`;
    copy = `On your weighting, Rise scores ${Math.round(scores.rise)} vs ${Math.round(scores.gardyn)}. The deciding factors are typically capacity, expandability, and the longer 3-year warranty — plus no required monthly fee.`;
  } else {
    pickHTML = `<span class="verdict-pick gardyn">Gardyn Home 4.0 wins.</span>`;
    copy = `On your weighting, Gardyn scores ${Math.round(scores.gardyn)} vs ${Math.round(scores.rise)}. The deciding factors are typically the small 2 sq ft footprint, lower maintenance time, and higher harvest yield — assuming the Kelby AI subscription stays on.`;
  }

  const cheaper = r.total < g.total ? "Rise" : "Gardyn";
  const delta = Math.abs(r.total - g.total);
  const costLine = delta < 25
    ? `Total cost is essentially a wash over ${state.years} year${state.years > 1 ? "s" : ""} at $${state.rate.toFixed(2)}/kWh.`
    : `Over ${state.years} year${state.years > 1 ? "s" : ""}, ${cheaper} comes out about ${fmtUSD(delta)} cheaper at $${state.rate.toFixed(2)}/kWh.`;

  $("verdict-body").innerHTML = `
    <p>${pickHTML}${copy}</p>
    <p>${costLine} ${state.membership
      ? `Turning Gardyn's $39/mo membership off would shave ${fmtUSD(DATA.gardyn.membershipMonthly * 12 * state.years)} from its total.`
      : `If you'd actually keep the Kelby AI on, add ${fmtUSD(DATA.gardyn.membershipMonthly * 12 * state.years)} to Gardyn's column.`}</p>
  `;
}

// ----- Re-render everything -------------------------------------

function update() {
  renderSummary();
  renderCostChart();
  renderRadarChart();
  renderEnergyChart();
}

// ----- Wire up controls -----------------------------------------

function wire() {
  const rate = $("rate"), time = $("time"), years = $("years"), mem = $("membership");
  rate.addEventListener("input", () => {
    state.rate = parseFloat(rate.value);
    $("rate-val").textContent = "$" + state.rate.toFixed(2);
    update();
  });
  time.addEventListener("input", () => {
    state.time = parseInt(time.value, 10);
    $("time-val").textContent = state.time;
    update();
  });
  years.addEventListener("input", () => {
    state.years = parseInt(years.value, 10);
    $("years-val").textContent = state.years;
    update();
  });
  mem.addEventListener("change", () => {
    state.membership = mem.checked;
    $("membership-hint").textContent = mem.checked
      ? "On — full Kelby AI features"
      : "Off — hardware only, manual care";
    update();
  });

  const wmap = {
    "w-price": "price", "w-capacity": "capacity", "w-maint": "maint",
    "w-expand": "expand", "w-reliab": "reliab", "w-energy": "energy"
  };
  Object.keys(wmap).forEach(id => {
    const el = $(id);
    el.addEventListener("input", () => {
      state.weights[wmap[id]] = parseInt(el.value, 10);
      document.querySelector(`.w-num[data-for="${id}"]`).textContent = el.value;
      update();
    });
  });
}

// ----- Init ------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  chartDefaults();
  buildSpecTable();
  renderHarvestChart();   // static
  wire();
  update();
});
