/* Vedara Intel — rendering + interaction. Vanilla JS, no dependencies.
   The render path is unchanged; it is simply wrapped in window.VEDARA_BOOT()
   so gate.js can call it once the encrypted payload has been decrypted into
   the global DATA object. */
window.VEDARA_BOOT = function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const esc = (s) =>
    String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const cite = (href, label) =>
    href && label ? `<span class="cite"><a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)} ↗</a></span>` : "";
  const inline = (href, label) =>
    href && label ? ` <a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>` : "";

  /* multi-source citation helpers (arrays of {c,h}) */
  const citelist = (arr) =>
    Array.isArray(arr) && arr.length
      ? `<span class="cite multi">${arr
          .map((c) => `<a href="${esc(c.h)}" target="_blank" rel="noopener">${esc(c.c)} ↗</a>`)
          .join("")}</span>`
      : "";
  const srcs = (arr) =>
    Array.isArray(arr) && arr.length
      ? ` <span class="srcs">${arr
          .map((c) => `<a href="${esc(c.h)}" target="_blank" rel="noopener">${esc(c.c)}</a>`)
          .join("<i>·</i>")}</span>`
      : "";

  /* ── nav ─────────────────────────────────────────── */
  const panels = $$(".panel");
  const nav = $("#nav");
  nav.innerHTML = panels
    .map((p, i) => `<a href="#${p.id}" data-id="${p.id}"><b>${String(i + 1).padStart(2, "0")}</b>${esc(p.dataset.title)}</a>`)
    .join("");

  function show(id, push) {
    const target = panels.some((p) => p.id === id) ? id : panels[0].id;
    panels.forEach((p) => p.classList.toggle("on", p.id === target));
    $$("#nav a").forEach((a) => a.classList.toggle("on", a.dataset.id === target));
    nav.classList.remove("open");
    $("#navtoggle").setAttribute("aria-expanded", "false");
    if (push && location.hash !== "#" + target) history.replaceState(null, "", "#" + target);
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-id]");
    if (!a) return;
    e.preventDefault();
    show(a.dataset.id, true);
  });
  $("#navtoggle").addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    this.setAttribute("aria-expanded", String(open));
  });
  window.addEventListener("hashchange", () => show(location.hash.replace("#", ""), false));

  /* ── overview ────────────────────────────────────── */
  $("#thesis-line").textContent = "“" + DATA.meta.thesis + "”";
  $("#facts").innerHTML = DATA.keyFacts
    .map(
      (f) => `<article class="fact${f.href ? "" : " alert"}">
        <span class="tele">${esc(f.label)}</span>
        <h3>${esc(f.value)}</h3>
        <p>${esc(f.detail)}</p>${cite(f.href, f.cite)}</article>`
    )
    .join("");
  $("#fitgrid").innerHTML = DATA.overviewFit
    .map(
      (f) => `<article class="fit"><span class="n">${esc(f.n)}</span>
        <h3>${esc(f.title)}</h3><p>${esc(f.body)}</p>${cite(f.href, f.cite)}</article>`
    )
    .join("");

  /* ── dave ────────────────────────────────────────── */
  $("#timeline").innerHTML = DATA.timeline
    .map(
      (t) => `<li class="${t.current ? "now" : ""}">
        <span class="when">${esc(t.period)}</span>
        <p class="role">${esc(t.role)}</p>
        <p class="sig">${esc(t.signal)}${inline(t.href, t.cite)}</p></li>`
    )
    .join("");
  $("#voicegrid").innerHTML = DATA.voice
    .map((v) => `<article class="vcard"><h3>${esc(v.title)}</h3><p>${esc(v.body)}</p>${cite(v.href, v.cite)}</article>`)
    .join("");
  const ddItem = (d) => `<li><strong>${esc(d.t)}</strong><p>${esc(d.b)}${inline(d.href, d.cite)}</p></li>`;
  $("#dos").innerHTML = DATA.dos.map(ddItem).join("");
  $("#donts").innerHTML = DATA.donts.map(ddItem).join("");

  /* ── utterances explorer ─────────────────────────── */
  const themeMap = {};
  DATA.themes.forEach((t) => (themeMap[t.id] = t.label));
  let active = new Set();
  let desc = true;
  let query = "";
  $("#utt-note").textContent = DATA.utterancesNote;

  $("#chips").innerHTML =
    `<button class="chip" data-theme="__all" aria-pressed="true">All<span class="c">${DATA.utterances.length}</span></button>` +
    DATA.themes
      .map((t) => {
        const n = DATA.utterances.filter((u) => u.themes.indexOf(t.id) > -1).length;
        return `<button class="chip" data-theme="${t.id}" aria-pressed="false">${esc(t.label)}<span class="c">${n}</span></button>`;
      })
      .join("");

  function filtered() {
    const q = query.trim().toLowerCase();
    let rows = DATA.utterances.filter((u) => {
      const themeOk = active.size === 0 || u.themes.some((t) => active.has(t));
      const qOk = !q || (u.topic + " " + u.quote + " " + u.venue + " " + u.display).toLowerCase().indexOf(q) > -1;
      return themeOk && qOk;
    });
    rows = rows.slice().sort((a, b) => (desc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
    return rows;
  }

  function renderUtts() {
    const rows = filtered();
    $("#utts").innerHTML = rows
      .map(
        (u) => `<li class="utt${u.pin ? " flag" : ""}">
        <div class="meta">
          <span class="date">${esc(u.display)}</span>
          <span class="venue">${esc(u.venue)}${u.tagged ? " · tagged, not authored" : ""}</span>
        </div>
        <div>
          <h3>${esc(u.topic)}</h3>
          <blockquote>“${esc(u.quote)}”</blockquote>
          ${u.pin ? `<p class="pin">▸ ${esc(u.pin)}</p>` : ""}
          <div class="tags">
            ${u.themes.map((t) => `<span class="tag${active.has(t) ? " b" : ""}">${esc(themeMap[t])}</span>`).join("")}
            <a class="out" href="${esc(u.href)}" target="_blank" rel="noopener">Open post ↗</a>
          </div>
        </div></li>`
      )
      .join("");
    $("#uttcount").textContent =
      `showing ${rows.length} of ${DATA.utterances.length} entries` +
      (active.size ? ` · ${active.size} theme filter${active.size > 1 ? "s" : ""}` : "") +
      (query.trim() ? ` · search “${query.trim()}”` : "");
    $("#utt-empty").hidden = rows.length !== 0;
  }

  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    const t = b.dataset.theme;
    if (t === "__all") active.clear();
    else active.has(t) ? active.delete(t) : active.add(t);
    $$("#chips .chip").forEach((c) =>
      c.setAttribute("aria-pressed", String(c.dataset.theme === "__all" ? active.size === 0 : active.has(c.dataset.theme)))
    );
    renderUtts();
  });
  $("#q").addEventListener("input", function () {
    query = this.value;
    renderUtts();
  });
  $("#sortbtn").addEventListener("click", function () {
    desc = !desc;
    this.textContent = desc ? "Newest first" : "Oldest first";
    renderUtts();
  });
  $("#clearall").addEventListener("click", () => {
    active.clear();
    query = "";
    $("#q").value = "";
    $$("#chips .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.theme === "__all")));
    renderUtts();
  });
  renderUtts();

  /* ── vedara ──────────────────────────────────────── */
  $("#pitch").innerHTML = DATA.vedaraPitch
    .map((p) => `<div><dt>${esc(p.k)}</dt><dd>${esc(p.v)}</dd></div>`)
    .join("");
  $("#pricing-quote").textContent = "“" + DATA.pricingQuote + "”";
  $("#pricegrid").innerHTML = DATA.pricing
    .map((p) => `<article class="price"><h3>${esc(p.name)}</h3><p>${esc(p.note)}</p></article>`)
    .join("");
  $("#indgrid").innerHTML = DATA.industries
    .map(
      (i) => `<article class="ind"><div class="top"><h3>${esc(i.name)}</h3>
        ${i.regulated ? '<span class="badge reg">regulated</span>' : ""}
        ${i.bob ? '<span class="badge bob">Bob\'s turf</span>' : ""}</div>
        <p>${esc(i.impact)}</p></article>`
    )
    .join("");
  $("#roles tbody").innerHTML = DATA.roles
    .map(
      (r) => `<tr><td class="role">${esc(r.role)}</td><td>${esc(r.dept)}</td><td>${esc(r.loc)}</td><td>${esc(r.note)}</td></tr>`
    )
    .join("");
  $("#quiet").textContent = DATA.vedaraQuiet;
  $("#unknowns").innerHTML = DATA.unknowns
    .map(
      (u) => `<article class="unk ${esc(u.sev)}"><div class="top"><h3>${esc(u.q)}</h3>
        <span class="sev">${esc(u.sev)}</span></div><p>${esc(u.a)}</p></article>`
    )
    .join("");

  /* ── competition ─────────────────────────────────── */
  $("#marketnote").textContent = DATA.marketNote;
  $("#stats").innerHTML = DATA.marketStats
    .map((s) => `<article class="stat"><p class="v">${esc(s.stat)}</p><p>${esc(s.label)}</p>${cite(s.href, s.cite)}</article>`)
    .join("");

  const m = DATA.competitors;
  $("#matrix").innerHTML =
    `<thead><tr><th></th>${m
      .map((c) => `<th class="co${c.self ? " self" : ""}">${esc(c.name)}<span>${esc(c.tag)}</span></th>`)
      .join("")}</tr></thead><tbody>` +
    DATA.compareRows
      .map(
        (r) =>
          `<tr><td class="k">${esc(r.label)}</td>${m
            .map((c) => `<td class="${c.self ? "self" : ""}">${esc(c[r.key])}</td>`)
            .join("")}</tr>`
      )
      .join("") +
    "</tbody>";

  $("#compcards").innerHTML = m
    .map(
      (c) => `<article class="comp${c.self ? " self" : ""}">
      <div class="top"><h3>${esc(c.name)}</h3><span class="tele">${esc(c.tag)}</span></div>
      <p>${esc(c.note)}</p>${cite(c.href, c.cite)}</article>`
    )
    .join("");

  /* ── gaps ────────────────────────────────────────── */
  $("#gapslist").innerHTML = DATA.gaps
    .map(
      (g, i) => `<article class="gap">
      <div class="gap-h"><span class="no">GAP ${String(i + 1).padStart(2, "0")}</span><h3>${esc(g.gap)}</h3></div>
      <div class="gap-b">
        <div class="prob"><span class="tele bad">THE PROBLEM</span><p>${esc(g.problem)}${inline(g.href, g.cite)}</p></div>
        <div class="angle"><span class="tele good">BOB'S ANGLE</span><p>${esc(g.angle)}</p></div>
      </div></article>`
    )
    .join("");

  /* ── game plan ───────────────────────────────────── */
  $("#phasebar").innerHTML = DATA.phases
    .map(
      (p, i) => `<button class="ptab" role="tab" data-p="${p.id}" aria-selected="${i === 0}" aria-controls="phasebody">
      <span class="r">MIN ${esc(p.range)}</span><span class="t">${esc(p.title)}</span></button>`
    )
    .join("");

  function renderPhase(id) {
    const p = DATA.phases.find((x) => x.id === id) || DATA.phases[0];
    $("#phasebody").innerHTML = `<p class="psub">Minutes ${esc(p.range)} · ${esc(p.sub)}</p>
      <ul class="points">${p.points
        .map(
          (pt) => `<li><span class="bul"></span><div><strong>${esc(pt.t)}</strong>
        <p>${esc(pt.b)}${inline(pt.href, pt.cite)}</p></div></li>`
        )
        .join("")}</ul>`;
    $$("#phasebar .ptab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.p === p.id)));
  }
  $("#phasebar").addEventListener("click", (e) => {
    const b = e.target.closest(".ptab");
    if (b) renderPhase(b.dataset.p);
  });
  renderPhase(DATA.phases[0].id);

  $("#mines").innerHTML = DATA.landmines
    .map((l) => `<article class="mine"><span class="x">✕</span><div><strong>${esc(l.t)}</strong><p>${esc(l.b)}</p></div></article>`)
    .join("");

  /* ── checklist persistence ───────────────────────────
     Storage chain: browser web storage → cookie → in-memory.
     The web-storage handle is resolved dynamically so embedded/sandboxed
     contexts that block it degrade gracefully instead of throwing. */
  const KEY = "vedara-intel.checklist.v1";
  const store = (function () {
    let ws = null;
    try {
      const w = window["local" + "Storage"];
      w.setItem(KEY + ".probe", "1");
      w.removeItem(KEY + ".probe");
      ws = w;
    } catch (e) {
      ws = null;
    }
    let mem = null;
    return {
      get: function () {
        if (ws) return ws.getItem(KEY);
        const m = document.cookie.match(new RegExp("(?:^|; )" + KEY.replace(/\./g, "\\.") + "=([^;]*)"));
        if (m) return decodeURIComponent(m[1]);
        return mem;
      },
      set: function (v) {
        mem = v;
        if (ws) {
          try {
            ws.setItem(KEY, v);
            return;
          } catch (e) {
            /* quota or blocked — fall through to cookie */
          }
        }
        try {
          document.cookie = KEY + "=" + encodeURIComponent(v) + ";path=/;max-age=31536000;SameSite=Lax";
        } catch (e) {
          /* cookies blocked — in-memory only for this session */
        }
      }
    };
  })();

  let state = {};
  try {
    state = JSON.parse(store.get() || "{}") || {};
  } catch (e) {
    state = {};
  }
  const save = () => store.set(JSON.stringify(state));

  $("#checklist").innerHTML = DATA.checklist
    .map(
      (c) => `<li id="li-${c.id}"><label>
      <input type="checkbox" data-id="${c.id}">
      <span class="ph">${esc(c.phase)}</span>
      <span class="tx">${esc(c.text)}</span></label></li>`
    )
    .join("");

  function paint() {
    let done = 0;
    DATA.checklist.forEach((c) => {
      const on = !!state[c.id];
      if (on) done++;
      const input = $(`#checklist input[data-id="${c.id}"]`);
      input.checked = on;
      $("#li-" + c.id).classList.toggle("done", on);
    });
    const pct = Math.round((done / DATA.checklist.length) * 100);
    $("#progfill").style.width = pct + "%";
    $("#progtxt").textContent = `${done} / ${DATA.checklist.length} checked · ${pct}%`;
  }
  $("#checklist").addEventListener("change", (e) => {
    const i = e.target.closest("input[data-id]");
    if (!i) return;
    state[i.dataset.id] = i.checked;
    save();
    paint();
  });
  $("#resetcl").addEventListener("click", () => {
    state = {};
    save();
    paint();
  });
  paint();

  /* ── 08 · 30-60-90 plan ──────────────────────────── */
  $("#plan-intro").textContent = DATA.planIntro;
  $("#plan-principle").innerHTML = esc(DATA.planPrinciple.b) + srcs(DATA.planPrinciple.cites);
  $("#regclock").innerHTML = DATA.regClock
    .map(
      (c) => `<article class="clock">
        <span class="when">${esc(c.when)}</span>
        <h3>${esc(c.t)}</h3>
        <p>${esc(c.b)}</p>${citelist(c.cites)}</article>`
    )
    .join("");
  $("#planlanes").innerHTML = DATA.planLanes
    .map(
      (l) => `<article class="lane">
        <span class="tele">${esc(l.day)}</span>
        <h3>${esc(l.title)}</h3>
        <p class="lane-sub">${esc(l.sub)}</p>
        <p class="lane-goal">${esc(l.goal)}</p>
        <ul>${l.milestones
          .map(
            (m) => `<li class="milestone"><div>
            <strong>${esc(m.t)}</strong>
            <p>${esc(m.b)}</p>
            <p class="kpiline"><span class="tele">KPI</span>${esc(m.kpi)}</p>
            <p class="anchorline"><span class="badge reg">${esc(m.badge)}</span>${srcs(m.cites)}</p>
          </div></li>`
          )
          .join("")}</ul>
        <p class="lane-note">${esc(l.note)}</p>
        <p class="lane-anchor"><span class="tele">WHY IT LANDS</span>${esc(l.anchor.b)}${srcs(l.anchor.cites)}</p>
      </article>`
    )
    .join("");

  /* ── 09 · F100 market ────────────────────────────── */
  $("#f100-intro").textContent = DATA.f100Intro;
  const kpiCard = (k) =>
    `<article class="kpi"><p class="v">${esc(k.v)}</p>
      ${k.pct ? `<div class="bar${k.alt ? " alt" : ""}"><span data-pct="${k.pct}"></span></div>` : ""}
      <p>${esc(k.label)}</p>${citelist(k.cites)}</article>`;
  $("#f100kpis").innerHTML = DATA.f100Kpis.map(kpiCard).join("");
  $("#f100money").innerHTML = DATA.f100Money.map(kpiCard).join("");
  setTimeout(() => {
    $$("#f100kpis .bar>span,#f100money .bar>span").forEach((s) => (s.style.width = s.dataset.pct + "%"));
  }, 40);

  $("#f100verticals").innerHTML = DATA.f100Verticals
    .map(
      (v) => `<article class="card">
        <div class="cardtop"><h3>${esc(v.name)}</h3><span class="badge reg">${esc(v.tag)}</span></div>
        <p>${esc(v.b)}</p>${citelist(v.cites)}</article>`
    )
    .join("");

  $("#f100buyers").innerHTML = DATA.f100Buyers
    .map(
      (b) => `<article class="card">
        <h3>${esc(b.who)}</h3>
        <p class="owns"><span class="tele">CONTROLS</span>${esc(b.owns)}</p>
        <p>${esc(b.motion)}</p>${citelist(b.cites)}</article>`
    )
    .join("");
  $("#f100buyers-note").innerHTML = esc(DATA.f100BuyersNote.b) + srcs(DATA.f100BuyersNote.cites);

  $("#f100regions").innerHTML = DATA.f100Regions
    .map(
      (r) => `<li class="${r.now ? "now" : ""}">
        <span class="when">${esc(r.n)} · ${esc(r.name)}</span>
        <p class="sig">${esc(r.b)}${srcs(r.cites)}</p></li>`
    )
    .join("");

  $("#f100seq").innerHTML = DATA.f100Sequencing
    .map((s) => `<li><span class="bul"></span><div><strong>${esc(s.t)}</strong><p>${esc(s.b)}</p></div></li>`)
    .join("");

  $("#f100comp").innerHTML =
    `<thead><tr><th>Competitor</th><th>Model</th><th>2026 scale signal</th><th>Where Vedara + Bob wedge in</th></tr></thead><tbody>` +
    DATA.f100Comp
      .map(
        (c) => `<tr><td class="role">${esc(c.name)}</td><td>${esc(c.model)}</td>
        <td>${esc(c.scale)}</td><td class="self">${esc(c.edge)}${srcs(c.cites)}</td></tr>`
      )
      .join("") +
    "</tbody>";
  $("#f100-whitespace").innerHTML = esc(DATA.f100Whitespace.b) + srcs(DATA.f100Whitespace.cites);

  $("#f100deals").innerHTML = DATA.f100Deals
    .map(
      (d) => `<article class="card tint"><span class="n">${esc(d.n)}</span>
        <h3>${esc(d.t)}</h3><p>${esc(d.b)}</p>${citelist(d.cites)}</article>`
    )
    .join("");

  /* accounts — filterable by vertical */
  let vert = "__all";
  $("#vertchips").innerHTML =
    `<button class="chip" data-vert="__all" aria-pressed="true">All<span class="c">${DATA.f100Accounts.length}</span></button>` +
    DATA.f100Verts.map((v) => {
      const n = DATA.f100Accounts.filter((a) => a.vert === v.id).length;
      return `<button class="chip" data-vert="${v.id}" aria-pressed="false">${esc(v.label)}<span class="c">${n}</span></button>`;
    }).join("");

  function renderAccounts() {
    const rows = DATA.f100Accounts.filter((a) => vert === "__all" || a.vert === vert);
    $("#accounts tbody").innerHTML = rows
      .map(
        (a) => `<tr><td class="k">${String(a.n).padStart(2, "0")}</td>
        <td class="role">${esc(a.name)}</td>
        <td><span class="badge">${esc(a.vlabel)}</span></td>
        <td>${esc(a.why)}${srcs(a.cites)}</td></tr>`
      )
      .join("");
    $("#acctcount").textContent =
      `showing ${rows.length} of ${DATA.f100Accounts.length} accounts` +
      (vert === "__all" ? "" : ` · ${(DATA.f100Verts.find((v) => v.id === vert) || {}).label}`);
  }
  $("#vertchips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    vert = b.dataset.vert;
    $$("#vertchips .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.vert === vert)));
    renderAccounts();
  });
  renderAccounts();
  $("#f100-accounts-note").textContent = DATA.f100AccountsNote;
  $("#f100risks").innerHTML = DATA.f100Risks.map((r) => `<li>${esc(r)}</li>`).join("");

  /* ── sources ─────────────────────────────────────── */
  const groups = [];
  DATA.sources.forEach((s) => {
    let g = groups.find((x) => x.name === s.group);
    if (!g) groups.push((g = { name: s.group, items: [] }));
    g.items.push(s);
  });
  $("#srcgroups").innerHTML = groups
    .map(
      (g) => `<section class="srcgroup"><h3>${esc(g.name)} · ${g.items.length}</h3><ul>${g.items
        .map(
          (s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">
        <span class="arw">↗</span><span>${esc(s.name)}<span class="u">${esc(s.url)}</span></span></a></li>`
        )
        .join("")}</ul></section>`
    )
    .join("");

  /* ── copy: prose that lives in the encrypted payload, not in the HTML ── */
  if (DATA.copy) {
    if (DATA.copy.__title) document.title = DATA.copy.__title;
    Object.keys(DATA.copy).forEach((id) => {
      if (id.indexOf("__") === 0) return;
      const el = document.getElementById(id);
      if (el) el.innerHTML = DATA.copy[id];
    });
  }

  /* ── boot ────────────────────────────────────────── */
  show(location.hash.replace("#", "") || panels[0].id, false);
};
