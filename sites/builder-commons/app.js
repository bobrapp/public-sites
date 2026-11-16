(function(){
"use strict";
const BC = window.BC;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = n => Number(n).toLocaleString("en-US");
const GUEST = { name: "Community builder", role: "Builder", org: "Builder Commons", persona: "no-code", level: 2 };
const person = id => BC.people.find(p => p.id === id) || (id === "u-guest" ? GUEST : { name: "You", role: "Builder", org: "Your team", persona: BC.me.persona, level: lvlOf(S.xp) });
const initials = n => n.split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase();
const avatar = (id, lg) => { const p = person(id); return `<span class="av ${lg?'av--lg':''}" aria-hidden="true" style="background:${hue(p.name)}">${esc(initials(p.name))}</span>`; };
function hue(s){ let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))%360; return `oklch(0.88 0.05 ${h})`; }

/* ---------- state (kept in this browser only) ---------- */
const S = Object.assign({
  votes: {}, myRatings: {}, extraComments: {}, newPosts: [], xp: 0, joined: {}, bannerHidden: false,
  kit: { soul: BC.soul.slice(), brain: BC.brain.map(b => `${b.k}: ${b.v}`), skills: ["Address Verification","Spatial Risk","Property Intelligence"], agents: BC.agentsRoster.map(a => a.name), task: "Triage our renewal list for wildfire and fire-station distance, and explain each flag in plain words." },
  stageOverride: {}, filters: { kind: "all", persona: "all", sort: "hot" }, peopleOpen: "all"
}, load());
/* ---------- persistence (server-side, keyed by the visitor id the host proxy assigns) ---------- */
function load(){ return {}; }
const RAW_API = String(window.__API_BASE__ || "");
const IS_LOCAL = ["localhost","127.0.0.1","[::1]"].includes(location.hostname);
const API = RAW_API.startsWith("__PORT_") ? (IS_LOCAL ? "http://localhost:8000" : null) : RAW_API.replace(/\/$/, "");
const CLIENT_ID = new URLSearchParams(location.search).get("vid") || "local-dev";
const SV = { votesOthers: {}, ratingsOthers: {}, online: false };
async function api(method, path, body){
  if (!API) throw new Error("no backend");
  const r = await fetch(API + path, { method, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-BC-Client": CLIENT_ID }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
function setSync(ok){ SV.online = ok; const el = $("#syncNote"); if (el) { el.textContent = ok ? "Saved to the commons" : "Offline: changes stay in this tab"; el.classList.toggle("off", !ok); } }
function send(method, path, body){ return api(method, path, body).then(() => setSync(true)).catch(() => { setSync(false); }); }
let saveT;
function save(){
  clearTimeout(saveT);
  saveT = setTimeout(() => { const st = {}; ["xp","joined","bannerHidden","kit","stageOverride","filters","peopleOpen"].forEach(k => st[k] = S[k]); send("PUT", "/api/me", { state: st }); }, 250);
}
async function hydrate(){
  try {
    const d = await api("GET", "/api/state");
    Object.assign(S, d.me || {});
    S.votes = d.votes || {}; S.myRatings = d.ratings || {}; S.extraComments = d.comments || {}; S.newPosts = d.posts || [];
    SV.votesOthers = d.votesOthers || {}; SV.ratingsOthers = d.ratingsOthers || {};
    setSync(true);
  } catch(_) { setSync(false); }
}

const allPosts = () => [...S.newPosts, ...BC.posts];
const postById = id => allPosts().find(p => p.id === id);
const myVote = id => S.votes[id] || 0;
const score = p => p.up - p.down + (SV.votesOthers[p.id] || 0) + myVote(p.id);
const ratingsOf = p => { const r = [...p.ratings, ...(SV.ratingsOthers[p.id] || [])]; if (S.myRatings[p.id]) r.push(S.myRatings[p.id]); return r; };
const avg = p => { const r = ratingsOf(p); return r.length ? r.reduce((a,b)=>a+b,0)/r.length : 0; };
const commentsOf = p => [...(p.comments||[]), ...(S.extraComments[p.id]||[])];

/* ---------- ladder / xp ---------- */
const THRESH = [0, 20, 60, 120, 200];
function lvlOf(xp){ let l = 1; THRESH.forEach((t,i) => { if (xp >= t) l = i+1; }); return l; }
function gain(n, why){
  const before = lvlOf(S.xp); S.xp += n; save(); renderMe();
  const after = lvlOf(S.xp);
  toast(after > before ? `You're now a ${BC.ladder[after-1].name}. ${BC.ladder[after-1].desc}.` : `+${n} XP · ${why}`);
}
function renderMe(){
  const l = lvlOf(S.xp), cur = BC.ladder[l-1], nxt = THRESH[l] ?? THRESH[4], prev = THRESH[l-1];
  const pct = l >= 5 ? 100 : Math.round((S.xp - prev) / (nxt - prev) * 100);
  $("#meCard").innerHTML = `<b>You · ${esc(cur.name)}</b><div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div><div>${S.xp} XP${l<5?` · next: ${esc(cur.next)}`:" · top rung"}</div><div class="sync ${SV.online?'':'off'}" id="syncNote" role="status">${SV.online?"Saved to the commons":"Offline: changes stay in this tab"}</div>`;
  $("#navCount").textContent = allPosts().length;
}

/* ---------- ui helpers ---------- */
let toastT;
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove("show"), 2600); }
function modal(html){ const m = $("#modal"); $("#modalBody").innerHTML = `<div class="modal__in">${html}</div>`; if (m.showModal) m.showModal(); else m.setAttribute("open",""); const f = m.querySelector("textarea,input,button"); if (f) f.focus(); }
function closeModal(){ const m = $("#modal"); if (m.close) m.close(); else m.removeAttribute("open"); }
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); if (e.target.closest("[data-close]")) closeModal(); });
async function copy(text, btn){
  try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); }
  catch(_) { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Copied to clipboard"); } catch(e) { toast("Select the text and copy it manually"); } ta.remove(); }
}
function download(name, text){
  try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type:"text/markdown"})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500); toast(`Downloaded ${name}`); }
  catch(_) { copy(text); }
}
const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/></svg>';
function stars(p, interactive){
  const a = avg(p), mine = S.myRatings[p.id] || 0, n = ratingsOf(p).length;
  const shown = interactive && mine ? mine : Math.round(a);
  const btns = [1,2,3,4,5].map(i => interactive
    ? `<button data-rate="${p.id}" data-v="${i}" class="${i<=shown?'on':''}" aria-label="Rate ${i} of 5${mine===i?' (your rating)':''}">${STAR}</button>`
    : `<span class="${i<=shown?'on':''}" style="color:${i<=shown?'var(--gold)':'var(--tint2)'};line-height:0">${STAR}</span>`).join("");
  return `<span class="stars" role="group" aria-label="Rating ${a.toFixed(1)} from ${n} ratings">${btns}<span class="val">${n ? a.toFixed(1) : "—"}</span><span class="muted">&nbsp;(${n})</span></span>`;
}
const vrBadges = n => `<span class="vr" aria-label="VibeRANT checks passed: ${n} of 8" title="VibeRANT checks: ${n}/8">${BC.viberant.map((v,i)=>`<i class="${i<n?'on':''}">${v.k}</i>`).join("")}</span>`;
const tierTag = p => p.kind === "ask" ? `<span class="tag tag--ask">Ask</span>` : `${p.kind==="mashup"?'<span class="tag tag--mashup">Mashup</span> ':''}<span class="tag tag--${p.tier}">${esc(BC.tiers[p.tier])}</span>`;
function voteBox(p){
  const v = myVote(p.id);
  return `<div class="vote" role="group" aria-label="Vote on ${esc(p.title)}">
    <button class="up" data-vote="${p.id}" data-d="1" aria-pressed="${v===1}" aria-label="Upvote"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5l7 9H5z" fill="currentColor"/></svg></button>
    <b aria-live="polite">${fmt(score(p))}</b>
    <button class="down" data-vote="${p.id}" data-d="-1" aria-pressed="${v===-1}" aria-label="Downvote"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19l7-9H5z" fill="currentColor"/></svg></button>
  </div>`;
}

/* ---------- global delegated actions ---------- */
document.addEventListener("click", e => {
  const vb = e.target.closest("[data-vote]");
  if (vb){ const id = vb.dataset.vote, d = +vb.dataset.d, cur = myVote(id);
    // upsert / flip / toggle-off, matching the VSSM marketplace rule
    S.votes[id] = cur === d ? 0 : d; if (!S.votes[id]) delete S.votes[id];
    send("PUT", "/api/vote", { post_id: id, d: S.votes[id] || 0 });
    if (cur === 0 && S.votes[id]) gain(2, d>0 ? "upvoted a build" : "flagged a build for improvement");
    rerenderPostBits(id); return; }
  const rb = e.target.closest("[data-rate]");
  if (rb){ const id = rb.dataset.rate, v = +rb.dataset.v, first = !S.myRatings[id];
    S.myRatings[id] = v; send("PUT", "/api/rate", { post_id: id, v });
    if (first) gain(3, `rated ${v} of 5`); else toast(`Rating updated to ${v}`);
    rerenderPostBits(id); return; }
  const op = e.target.closest("[data-open]");
  if (op){ location.hash = `#/post/${op.dataset.open}`; return; }
});
function rerenderPostBits(id){
  const p = postById(id); if (!p) return;
  $$(`[data-post="${id}"] .vote`).forEach(el => el.outerHTML = voteBox(p));
  $$(`[data-post="${id}"] .stars`).forEach(el => el.outerHTML = stars(p, true));
}

/* ---------- router ---------- */
const routes = { commons, journey, post, build, hack, sponsors, people, kit, invites, why, proof };
function route(){
  const [, r = "commons", arg] = (location.hash || "#/commons").split("/");
  const fn = routes[r] || commons;
  $$(".nav a").forEach(a => { if (a.dataset.r === (r === "post" ? "commons" : r)) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  const v = $("#view"); v.innerHTML = `<div class="fade">${fn(arg)}</div>`; v.focus({preventScroll:true}); window.scrollTo(0,0);
  if (fn.after) fn.after(arg);
  $("#side").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded","false");
}
window.addEventListener("hashchange", route);
$("#menuBtn").addEventListener("click", () => { const o = $("#side").classList.toggle("open"); $("#menuBtn").setAttribute("aria-expanded", o); });
document.addEventListener("keydown", e => { if (e.key === "Escape") $("#side").classList.remove("open"); });
document.addEventListener("pointerdown", e => { const s = $("#side"); if (s.classList.contains("open") && !s.contains(e.target) && !e.target.closest("#menuBtn")) { s.classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded","false"); } });
$("#q").addEventListener("input", () => { const r = (location.hash.split("/")[1]||"commons"); if (r !== "commons" && r !== "people") location.hash = "#/commons"; else { const fn = routes[r]; $("#view").innerHTML = `<div>${fn()}</div>`; if (fn.after) fn.after(); } });
const query = () => $("#q").value.trim().toLowerCase();


/* ---------- PROOF VIDEO ---------- */
const CHAPTERS = [
  [0, "Governance first", "Every output carries provenance; an agent on Precisely's own MCP server."],
  [17.68, "Policy before any call", "Five read-only tools allowed, writes denied, hard budget, PII hashed. A write attempt is refused and logged."],
  [47.88, "What a business user gets", "Eight addresses: seven graded A, one F held for a human; a duplicate caught; high wildfire risk flagged."],
  [77.16, "Receipts an auditor can check", "Hash-chained evidence; an independent verifier passes, then fails when one value is changed."],
  [103.28, "The proposal", "A forward-deployed team doing this inside top accounts, with every Studio asset shipping its evidence bundle."]
];
const mmss = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
function proof(){
  return `<div class="phead"><div><p class="eyebrow">Proof video · 2:04</p><h1>Trusted Enrichment Agent: a live run on Precisely AI Studio</h1></div></div>
  <div class="proof">
    <div class="proof__player"><video id="proofVid" controls playsinline preload="metadata" poster="./assets/proof-poster.jpg" src="./assets/proof.mp4"></video></div>
    <aside class="panel">
      <p class="eyebrow">Chapters</p>
      <ol class="chapters">${CHAPTERS.map(([t,n,d])=>`<li><button data-seek="${t}"><span class="mono">${mmss(t)}</span><b>${esc(n)}</b><small>${esc(d)}</small></button></li>`).join("")}</ol>
    </aside>
  </div>
  <div class="prose" style="margin-top:var(--s6)">
    <p>This is the "below the water" part of the iceberg, made real. A small agent built by Bob Rapp runs live against Precisely's MCP server (51 tools discovered, 40 calls), reads a policy before every call, and leaves behind a hash-chained evidence bundle that an independent verifier can check without trusting the agent. It took an afternoon on AI Studio.</p>
    <p class="small muted">Recorded Nov 7, 2026. Live run against api.cloud.precisely.com with a trial workspace. The "Atlantis, Florida" address is deliberately fake test data.</p>
  </div>`;
}
proof.after = () => { const v = $("#proofVid"); $$("[data-seek]").forEach(b => b.onclick = () => { v.currentTime = +b.dataset.seek; v.play().catch(()=>{}); }); };


/* ---------- JOURNEY ---------- */
const SRC = {
  sp: "https://www.spglobal.com/ratings/en/regulatory/article/-/view/type/HTML/id/3583315",
  now: "https://www.precisely.com/blog/ai-ready-data/5-takeaways-from-precisely-now-trusted-ai-starts-with-trusted-data/",
  awards: "https://www.precisely.com/press-release/precisely-awards-h12026/",
  chapter: "https://www.precisely.com/blog/cat-careers/a-new-chapter-of-growth-at-precisely/",
  tf: "https://www.techfinitive.com/interviews/precisely-ceo-walid-abu-hadba/",
  studio: "https://www.precisely.com/press-release/precisely-launches-ai-studio/",
  udm: "https://www.precisely.com/blog/unified-data-management/unified-data-management-for-ai-readiness-whats-new-whats-next/",
  ml: "https://mitchellake.com/intelligence/wire/precisely-leadership-change-2026-04-02",
  arr: "https://www.linkedin.com/in/vineshvis"
};
const src = (k, label) => `<a href="${SRC[k]}" target="_blank" rel="noopener">${esc(label)}</a>`;
const DOUBTS = { logos: "New logos", nrr: "Net retention", prod: "Sales productivity", moat: "Trusted-data moat", capital: "Capital-light growth" };

const JSTAGES = [
  { key: "oneshot", name: "One-shot vibe coder", short: "One-shot", berg: "Cracked ice",
    walid: { line: `His big idea in reverse: the app looks finished, but it runs on whatever data was lying around. "If you want trusted AI, you need trusted data" (${src("now","Precisely Now")}). This stage is the demand he is betting on.`, doubts: ["moat"], move: "Meet builders where they already are: ChatGPT, Copilot and Claude, which AI Studio already reaches over MCP." } },
  { key: "viberant", name: "VibeRANT builder", short: "VibeRANT", berg: "Solid ice",
    walid: { line: `The same idea, rebuilt on Precisely parts with eight checks applied quietly. Every output carries its lineage, which is what he asked for: "every output would carry provenance" (${src("tf","TechFinitive")}).`, doubts: ["moat"], move: "Trusted data reaches an agent the customer built herself, through a certified part." } },
  { key: "self", name: "Self-selecting customer", short: "Self-selects", berg: "Surfacing",
    walid: { line: `She buys because the build is used, not because someone called her. That is the product-led motion his board expects (${src("ml","Mitchellake")}) and his own "simplifying how we go to market" (${src("chapter","A New Chapter of Growth")}).`, doubts: ["logos"], move: "Free trial, no sales call, then credits metered as the build gets real use." } },
  { key: "grow", name: "Grows: organic or juiced", short: "Grows", berg: "Spreading",
    walid: { line: `Expansion inside the 12,000 customers he already has. S&P says expansion, not churn, is the gap; every point of net retention on about $1B ARR is about $10M (${src("sp","S&P")}, ${src("arr","Precisely CRO")}).`, doubts: ["nrr", "prod"], move: "The forward-deployed team goes only where a builder has already pulled, so every seller hour lands on warm demand." } },
  { key: "advocate", name: "Advocate", short: "Advocate", berg: "Community",
    walid: { line: `Customers recruit customers. He built Microsoft's developer community and ran quarterly AI hackathons at Sage; this is that playbook running on trusted data.`, doubts: ["prod", "logos"], move: "References, talks and remixes replace cold outreach. Lower cost to acquire, faster cycles." } },
  { key: "partner", name: "Partner", short: "Partner", berg: "Ecosystem",
    walid: { line: `Certified assets from customers and partners fill AI Studio before Platform GA in early 2027, which is Matt Waxman's "community of builders sharing tools with one another" (${src("now","Precisely Now")}).`, doubts: ["capital", "logos"], move: "Partners carry the build to new accounts. Growth without new debt." } }
];

const PERSONAS = {
  maya: { id: "p1", path: "Organic + juiced", tag: "Forward-deployed team joins", color: "var(--gold)",
    intro: "Claims operations lead at a regional insurer. Lives in spreadsheets and Copilot. Has never written code and doesn't plan to.",
    stages: [
      { says: "I asked ChatGPT for a wildfire renewal triage tool. It looked amazing in ten minutes.", did: "Pasted 40 policies into a chat and got a slick dashboard back.", quiet: "Nothing. Addresses were never verified, the risk scores were guessed, and nobody could say where an answer came from.", signal: "None. Precisely can't see her.", result: "It broke on her real renewal file: 1 in 6 addresses didn't match and two fire stations were made up.", app: ["#/build", "Try the no-code builder"] },
      { says: "Same idea, but now it tells me why each policy got flagged.", did: "Rebuilt it in the Builder Commons wizard: described the problem, picked Address Verification, Spatial Risk and Property Intelligence, and gave three real examples.", quiet: "All eight VibeRANT checks switched on. Golden-example tests, pinned versions, PII hashed, lineage attached.", signal: "Posted as a Community build. 8/8 trust card. Rated 4.7.", result: "Her team trusts it enough to use on Monday's renewals.", app: ["#/post/b1", "See her build"] },
      { says: "Three teammates joined it this week. I need batch mode.", did: "Used 410 trial credits, invited teammates, asked about batch mode in the thread.", quiet: "Credits metered per verified address and risk lookup. Usage, not a contract, decides the price.", signal: "Heartland Mutual moves from Builder to Champion on the invitations board.", result: "Her manager approves a paid plan before anyone from Precisely has called.", app: ["#/invites", "See the signal"] },
      { says: "You brought batch mode to a 30-minute session and I drove. That was the sale.", did: "Accepted a co-build invite (her stated preference). A forward-deployed builder paired on her real renewal file.", quiet: "Batch mode, a sponsor-funded pilot and a Partner-certified version of her build.", signal: "Sponsored pilot → paid expansion to two more lines of business.", result: "Organic got her to Champion. The forward-deployed team turned one build into a department.", lane: "juiced", app: ["#/sponsors", "See sponsors"] },
      { says: "I showed it at our regional mutuals meeting. Four of them asked for the remix link.", did: "Reached the Mentor rung, co-hosted the insurance hackathon, recorded a 2-minute walkthrough.", quiet: "Her remix link carries the same eight checks into every copy.", signal: "Four inbound accounts, each tagged with her name as the source.", result: "Pipeline arrives warm, with a customer already vouching for it.", app: ["#/hack", "See the hackathon"] },
      { says: "We're a design partner now. Our triage model ships in AI Studio.", did: "Heartland's build is published as a Partner-certified asset other insurers can run on their own data.", quiet: "Certification keeps the eight checks and the evidence bundle attached to every install.", signal: "Revenue share on installs; Heartland is a named reference.", result: "A customer became a channel.", app: ["#/kit", "See the builder kit"] }
    ] },
  samuel: { id: "p4", path: "Organic", tag: "Community only, no seller", color: "var(--green)",
    intro: "GIS coordinator for a small county public works department. One-person team, tiny budget, says no to sales sequences.",
    stages: [
      { says: "I had Copilot write a script to match our 140 sites to tax districts. It sort of worked.", did: "Ran a generated script on a spreadsheet export.", quiet: "Nothing. No address standardization, no tax-jurisdiction source, no record of what changed.", signal: "None.", result: "Two sites landed in the wrong district and a bill went out wrong.", app: ["#/build", "Try the no-code builder"] },
      { says: "I posted an Ask, and a mentor answered with a template in an hour.", did: "Posted an Ask in the Commons, then remixed a certified Tax Jurisdiction template.", quiet: "Eight checks inherited from the template. Every district assignment cites its source.", signal: "First build posted. Mentor paired asynchronously, as he prefers.", result: "All 140 sites matched, with a trail he can show the auditor.", app: ["#/commons", "See the Commons"] },
      { says: "The county grant covers credits. I didn't need to talk to anyone.", did: "Joined the Public Sector data jam and ran the build on the full asset list.", quiet: "Credits metered per lookup and covered by a sponsor's grant.", signal: "Small, self-serve, paid. A new logo with no sales cost.", result: "A new logo Precisely didn't have to chase.", app: ["#/hack", "See the data jam"] },
      { says: "Two neighboring counties copied my build from the thread.", did: "Answered questions in the community thread and published a remix for neighboring counties.", quiet: "Remixes keep the eight checks. No seller is involved, by design.", signal: "Three counties, all organic. The board marks them Builder with no outreach.", result: "Organic growth: slower, cheaper, and it compounds.", lane: "organic", app: ["#/people", "See the people"] },
      { says: "I'm mentoring two other counties through their first build.", did: "Reached the Mentor rung and runs a monthly async clinic.", quiet: "His clinic is listed in the people finder with his preferences: async only.", signal: "Public-sector pipeline that respects \"please don't: sales sequences.\"", result: "The community does the selling, on his terms.", app: ["#/people", "See mentors"] },
      { says: "Northbeam packaged my template for the state association.", did: "His template becomes Partner-certified via Northbeam Partners, a systems integrator.", quiet: "The SI adds support; the certified asset keeps provenance attached.", signal: "Partner-sourced deals across the state's counties.", result: "One county's fix became a partner's product.", app: ["#/kit", "See the builder kit"] }
    ] }
};
const J = { who: "maya", stage: 0 };

/* growth model: illustrative, editable */
const GBASE = { arr: 1000, base: 2.0 };
const GLANES = [
  { k: "organic", name: "Organic self-serve new logos", unit: "new paying accounts", acvUnit: "first-year ACV ($k)", stage: "Self-selects", color: "#1d6b47" },
  { k: "expand", name: "Builder-led expansion in existing customers", unit: "accounts expanding", acvUnit: "added ARR each ($k)", stage: "Grows (organic)", color: "#3f9d6e" },
  { k: "fdt", name: "Forward-deployed \"juiced\" accounts", unit: "accounts co-built", acvUnit: "added ARR each ($k)", stage: "Grows (juiced)", color: "#d99a16" },
  { k: "partner", name: "Partner-sourced", unit: "active partners", acvUnit: "sourced ARR each ($k)", stage: "Partner", color: "#8a6a1d" }
];
const GPRESETS = {
  five: { organic: [400, 25], expand: [600, 15], fdt: [50, 150], partner: [10, 350] },
  ten: { organic: [1000, 30], expand: [1200, 20], fdt: [100, 200], partner: [20, 300] }
};
let G = JSON.parse(JSON.stringify(GPRESETS.five));
let gPreset = "five";

function jStageCard(){
  const P = PERSONAS[J.who], st = P.stages[J.stage], S0 = JSTAGES[J.stage], pp = person(P.id);
  const lane = J.stage === 3 ? `<div class="lanes">
      <div class="lane ${J.who==="samuel"?"on":""}"><b>Organic</b><span>Community, remixes, hackathons. No seller.</span></div>
      <div class="lane lane--j ${J.who==="maya"?"on":""}"><b>Organic + juiced</b><span>A forward-deployed builder co-builds where the customer already pulled.</span></div>
    </div>` : "";
  return `<div class="jcard">
    <div class="jcard__story">
      <p class="eyebrow">Stage ${J.stage+1} of 6 · ${esc(S0.name)}</p>
      <blockquote class="jquote">"${esc(st.says)}"<cite>${esc(pp.name)}, ${esc(pp.role)}</cite></blockquote>
      ${lane}
      <dl class="jdl">
        <div><dt>What ${esc(pp.name.split(" ")[0])} does</dt><dd>${esc(st.did)}</dd></div>
        <div><dt>What happens quietly</dt><dd>${esc(st.quiet)}</dd></div>
        <div><dt>Signal Precisely sees</dt><dd>${esc(st.signal)}</dd></div>
        <div><dt>Result</dt><dd>${esc(st.result)}</dd></div>
      </dl>
      <a class="btn btn--ghost btn--sm" href="${st.app[0]}">${esc(st.app[1])} →</a>
    </div>
    <aside class="jcard__walid">
      <p class="eyebrow">How this supports Walid</p>
      <p>${S0.walid.line}</p>
      <p class="small"><b>The move:</b> ${esc(S0.walid.move)}</p>
      <div class="doubts">${S0.walid.doubts.map(d=>`<span class="tag tag--doubt">${esc(DOUBTS[d])}</span>`).join(" ")}</div>
    </aside>
  </div>`;
}
function jRail(){
  return `<ol class="jrail" role="tablist" aria-label="Journey stages">${JSTAGES.map((s,i)=>`<li><button role="tab" aria-selected="${i===J.stage}" data-jstage="${i}" class="${i<J.stage?"done":""} ${i===J.stage?"on":""}"><i>${i+1}</i><span>${esc(s.short)}</span></button></li>`).join("")}</ol>`;
}
function gCalc(){
  const parts = GLANES.map(l => ({ ...l, n: G[l.k][0], acv: G[l.k][1], arr: G[l.k][0] * G[l.k][1] / 1000 }));
  const added = parts.reduce((a,p)=>a+p.arr,0);
  return { parts, added, total: GBASE.base + added / GBASE.arr * 100 };
}
function gView(){
  const c = gCalc(), max = 12;
  const seg = (w, color, label) => `<i style="width:${Math.max(0,w)/max*100}%;background:${color}" title="${esc(label)}"></i>`;
  return `<div class="gbar" aria-hidden="true">${seg(GBASE.base,"#9aa39c","Base ~2%")}${c.parts.map(p=>seg(p.arr/GBASE.arr*100,p.color,p.name)).join("")}</div>
    <div class="gscale" aria-hidden="true"><span>0%</span><span style="left:${5/max*100}%">5%</span><span style="left:${10/max*100}%">10%</span><span style="right:0">12%</span></div>
    <p class="gtotal" aria-live="polite"><b>${c.total.toFixed(1)}%</b> ARR growth · base ~${GBASE.base}% + ${(c.added/GBASE.arr*100).toFixed(1)} points from builders ($${Math.round(c.added)}M added on ~$${GBASE.arr/1000}B)</p>`;
}
function gRows(){
  return GLANES.map(l => `<div class="grow" style="--c:${l.color}">
    <div class="grow__h"><i></i><b>${esc(l.name)}</b><span class="tag">${esc(l.stage)}</span></div>
    <label>${esc(l.unit)} <output id="gn-${l.k}">${fmt(G[l.k][0])}</output><input type="range" min="0" max="${l.k==="partner"?60:l.k==="fdt"?300:3000}" step="${l.k==="partner"?1:10}" value="${G[l.k][0]}" data-g="${l.k}" data-i="0"></label>
    <label>${esc(l.acvUnit)} <output id="ga-${l.k}">${fmt(G[l.k][1])}</output><input type="range" min="0" max="${l.k==="partner"||l.k==="fdt"?600:100}" step="5" value="${G[l.k][1]}" data-g="${l.k}" data-i="1"></label>
    <p class="small muted" id="gr-${l.k}">= $${(G[l.k][0]*G[l.k][1]/1000).toFixed(1)}M</p>
  </div>`).join("");
}

function journey(){
  const P = PERSONAS[J.who];
  return `<div class="phead"><div><p class="eyebrow">The journey · start here</p><h1>From one-shot vibe coder to partner, and how each step grows Precisely.</h1></div></div>

  <section class="bigidea">
    <div>
      <p class="eyebrow">Walid's big idea</p>
      <p class="bigidea__q">"If you want trusted AI, you need trusted data."</p>
      <p class="small">Walid Abu-Hadba at ${src("now","Precisely Now")}. Elsewhere: "With no human judgment in the loop, the quality of the data becomes the quality of the decision" (${src("udm","Precisely blog")}), and "We are building the leading AI company delivering Agentic-Ready Data" (${src("awards","Precisely release")}).</p>
    </div>
    <div>
      <p class="eyebrow">The Builder Commons answer</p>
      <p class="bigidea__a">Let the people who own the business problems build on trusted data, without code. Their builds pull Precisely into every agent they make, and they show sellers where to go.</p>
      <p class="small">From ~2% ARR growth today (${src("sp","S&P")}) to a proposed 5%, then 10%. Bob's targets, not Precisely guidance.</p>
    </div>
  </section>

  <h2 class="jh">Pick a builder</h2>
  <div class="personas" role="radiogroup" aria-label="Persona">${Object.entries(PERSONAS).map(([k,p])=>{ const pp = person(p.id); return `<button role="radio" aria-checked="${J.who===k}" data-who="${k}" class="persona ${J.who===k?"on":""}" style="--pc:${p.color}">
      ${avatar(p.id,true)}<span><b>${esc(pp.name)}</b><small>${esc(pp.role)} · ${esc(pp.org)}</small><small class="persona__intro">${esc(p.intro)}</small><span class="tag tag--path">${esc(p.path)}: ${esc(p.tag)}</span></span></button>`; }).join("")}</div>

  <h2 class="jh">${esc(person(P.id).name.split(" ")[0])}'s six stages</h2>
  ${jRail()}
  <div id="jcardWrap">${jStageCard()}</div>
  <div class="jnav"><button class="btn btn--ghost btn--sm" id="jPrev" ${J.stage===0?"disabled":""}>← Previous stage</button><button class="btn btn--primary btn--sm" id="jNext" ${J.stage===5?"disabled":""}>Next stage →</button></div>

  <h2 class="jh">What each stage answers for Walid</h2>
  <p class="muted small" style="max-width:70ch">S&P says Precisely's rating hinges on whether the AI platform drives new logos and net retention, and flags sales productivity during the leadership change (${src("sp","S&P")}). Each stage answers at least one of those doubts, or builds the trusted-data moat and capital-light growth that matter before the 2028 debt maturity S&P flags.</p>
  <div class="scoreboard">${Object.entries(DOUBTS).map(([k,label])=>`<div class="sb"><b>${esc(label)}</b><div>${JSTAGES.map((s,i)=>s.walid.doubts.includes(k)?`<button class="jchip" data-jstage="${i}">${i+1} · ${esc(s.short)}</button>`:"").join("")}</div></div>`).join("")}</div>

  <h2 class="jh">From 2% to 5% to 10%</h2>
  <div class="gwrap">
    <div class="gtop">
      <div class="seg" role="group" aria-label="Scenario"><button data-gp="five" aria-pressed="${gPreset==="five"}">5% year</button><button data-gp="ten" aria-pressed="${gPreset==="ten"}">10% year</button></div>
      <div id="gView">${gView()}</div>
    </div>
    <div class="grows">${gRows()}</div>
    <p class="small muted">Illustrative model, editable with the sliders. Inputs are Bob's working assumptions, not Precisely data or guidance. Base: ~2% ARR growth in 2025 (${src("sp","S&P estimate")}) on ~$1B ARR (${src("arr","Precisely CRO profile")}); about 12,000 customers (${src("udm","Precisely")}). The 5% case needs ~$30M of new ARR from builders; the 10% case needs ~$80M.</p>
  </div>`;
}
journey.after = () => {
  const rer = () => { $("#jcardWrap").innerHTML = jStageCard(); $$(".jrail button").forEach((b,i)=>{ b.classList.toggle("on", i===J.stage); b.classList.toggle("done", i<J.stage); b.setAttribute("aria-selected", i===J.stage); }); $("#jPrev").disabled = J.stage===0; $("#jNext").disabled = J.stage===5; };
  $$("[data-jstage]").forEach(b => b.onclick = () => { J.stage = +b.dataset.jstage; rer(); if (b.classList.contains("jchip")) $(".jrail").scrollIntoView({behavior:"smooth", block:"start"}); });
  $("#jPrev").onclick = () => { if (J.stage>0){ J.stage--; rer(); } };
  $("#jNext").onclick = () => { if (J.stage<5){ J.stage++; rer(); } };
  $$("[data-who]").forEach(b => b.onclick = () => { J.who = b.dataset.who; const y = window.scrollY; route(); window.scrollTo(0, y); });
  const upd = () => { $("#gView").innerHTML = gView(); GLANES.forEach(l => { $("#gn-"+l.k).textContent = fmt(G[l.k][0]); $("#ga-"+l.k).textContent = fmt(G[l.k][1]); $("#gr-"+l.k).textContent = `= $${(G[l.k][0]*G[l.k][1]/1000).toFixed(1)}M`; }); };
  $$("[data-g]").forEach(r => r.oninput = () => { G[r.dataset.g][+r.dataset.i] = +r.value; gPreset = ""; $$("[data-gp]").forEach(b=>b.setAttribute("aria-pressed","false")); upd(); });
  $$("[data-gp]").forEach(b => b.onclick = () => { gPreset = b.dataset.gp; G = JSON.parse(JSON.stringify(GPRESETS[gPreset])); $$("[data-gp]").forEach(x=>x.setAttribute("aria-pressed", x===b)); $$("[data-g]").forEach(r => r.value = G[r.dataset.g][+r.dataset.i]); upd(); });
};

/* ---------- COMMONS ---------- */
function postCard(p){
  const a = person(p.author), n = commentsOf(p).length;
  return `<article class="post" data-post="${p.id}">
    ${voteBox(p)}
    <div>
      <div class="post__meta">${tierTag(p)}<span class="status" data-s="${esc(p.status)}">${esc(p.status)}</span><span>· ${esc(p.industry)}</span><span>· ${esc(p.persona)}</span></div>
      <button class="post__title" data-open="${p.id}">${esc(p.title)}</button>
      <p class="post__sum">${esc(p.summary)}</p>
      <div class="post__foot">
        <span style="display:inline-flex;gap:6px;align-items:center">${avatar(p.author)} ${esc(a.name)} · ${esc(a.org || "")}</span>
        ${p.kind !== "ask" ? stars(p, true) : ""}
        ${p.kind !== "ask" ? vrBadges(p.vr) : ""}
        <span>${n} comment${n===1?"":"s"}</span>
        ${p.forks ? `<span>${p.forks} remixes</span>` : ""}
      </div>
    </div>
  </article>`;
}
function filteredPosts(){
  const f = S.filters, q = query();
  let list = allPosts().filter(p => (f.kind === "all" || p.kind === f.kind) && (f.persona === "all" || p.persona === f.persona));
  if (q) list = list.filter(p => (p.title + " " + p.summary + " " + p.uses.join(" ") + " " + p.industry + " " + person(p.author).name).toLowerCase().includes(q));
  const hot = p => score(p) / Math.pow((p.age||0) + 2, 1.2);
  const sorts = { hot: (a,b) => hot(b)-hot(a), top: (a,b) => score(b)-score(a), new: (a,b) => (a.age||0)-(b.age||0), rated: (a,b) => avg(b)-avg(a) };
  return list.sort(sorts[f.sort]);
}
function commons(){
  const l = lvlOf(S.xp);
  const banner = S.bannerHidden ? "" : `<section class="banner" aria-labelledby="bannerT">
    <button class="close-x" id="hideBanner" aria-label="Hide introduction">✕</button>
    <div>
      <p class="eyebrow" style="color:var(--gold)">From vibe-coding to VibeRANT</p>
      <h1 id="bannerT">Most people with the best ideas will never write code. Build with them anyway.</h1>
      <p>Describe a problem in plain words, assemble certified Precisely parts, and let eight quiet guardrails make it safe, tested and traceable. Then share it, get rated, find a sponsor, and get hired for what you built.</p>
      <div class="banner__cta"><a class="btn btn--gold" href="#/build">Build without code</a><a class="btn btn--ghost" href="#/hack">Join this week's mashup</a><a class="btn btn--ghost" href="#/journey">Follow a builder's journey</a></div>
    </div>
    <div class="ladder" aria-label="Builder ladder">${BC.ladder.map(r=>`<div class="rung ${r.lvl<=l?'on':''} ${r.lvl===l?'here':''}"><i>${r.lvl}</i><div><b>${esc(r.name)}</b><br><span>${esc(r.desc)}</span></div></div>`).join("")}</div>
  </section>`;
  const f = S.filters, list = filteredPosts();
  const topBuilders = BC.people.slice().sort((a,b)=>b.rep-a.rep).slice(0,4);
  const ev = BC.hackathons[2];
  return `${banner}
  <div class="commons-grid"><div>
    <div class="toolbar">
      <div class="chips" role="group" aria-label="Post type">${[["all","All"],["build","Builds"],["mashup","Mashups"],["ask","Asks"]].map(([k,l])=>`<button class="chip" data-fk="${k}" aria-pressed="${f.kind===k}">${l}</button>`).join("")}</div>
      <div class="seg" role="group" aria-label="Sort">${[["hot","Hot"],["top","Top"],["new","New"],["rated","Best rated"]].map(([k,l])=>`<button data-fs="${k}" aria-pressed="${f.sort===k}">${l}</button>`).join("")}</div>
    </div>
    <div class="chips" role="group" aria-label="Builder type" style="margin-bottom:var(--s4)">${[["all","Everyone"],["no-code","No-code"],["low-code","Low-code"],["pro-code","Pro-code"]].map(([k,l])=>`<button class="chip" data-fp="${k}" aria-pressed="${f.persona===k}">${l}</button>`).join("")}</div>
    <div class="feed" id="feed">${list.length ? list.map(postCard).join("") : `<div class="empty">Nothing matches yet. <a href="#/build">Be the first to build it.</a></div>`}</div>
  </div>
  <aside class="side-rail">
    <div class="panel"><p class="eyebrow">This week</p><h2 style="margin:var(--s2) 0">${esc(ev.name)}</h2><p class="small muted">${esc(ev.when)} · ${ev.teams + (S.joined[ev.id]?1:0)} teams</p><a class="btn btn--ghost btn--sm" style="margin-top:var(--s3)" href="#/hack">See challenges</a></div>
    <div class="panel"><p class="eyebrow">Top builders</p><ul class="mini" style="margin-top:var(--s3)">${topBuilders.map(p=>`<li><span style="display:flex;gap:8px;align-items:center">${avatar(p.id)}<span>${esc(p.name)}<br><span class="small muted">${esc(BC.ladder[p.level-1].name)} · ${p.builds} builds</span></span></span><span class="small" style="font-family:var(--mono)">${fmt(p.rep)}</span></li>`).join("")}</ul><a class="linkish small" href="#/people" style="display:inline-block;margin-top:var(--s3)">Find a person →</a></div>
    <div class="panel panel--tint"><p class="eyebrow">Sponsors looking</p><ul class="mini" style="margin-top:var(--s3)">${BC.sponsors.slice(0,3).map(s=>`<li><span>${esc(s.name)}<br><span class="small muted">${esc(s.seeks)}</span></span></li>`).join("")}</ul><a class="linkish small" href="#/sponsors" style="display:inline-block;margin-top:var(--s3)">Find a sponsor →</a></div>
  </aside></div>`;
}
commons.after = () => {
  const hb = $("#hideBanner"); if (hb) hb.onclick = () => { S.bannerHidden = true; save(); route(); };
  $$("[data-fk]").forEach(b => b.onclick = () => { S.filters.kind = b.dataset.fk; save(); route(); });
  $$("[data-fs]").forEach(b => b.onclick = () => { S.filters.sort = b.dataset.fs; save(); route(); });
  $$("[data-fp]").forEach(b => b.onclick = () => { S.filters.persona = b.dataset.fp; save(); route(); });
};

/* ---------- POST DETAIL ---------- */
function post(id){
  const p = postById(id); if (!p) return `<div class="empty">That post isn't here. <a href="#/commons">Back to the commons</a></div>`;
  const a = person(p.author), si = BC.statuses.indexOf(p.status);
  return `<p><a class="linkish small" href="#/commons">← Commons</a></p>
  <div class="detail" data-post="${p.id}" style="margin-top:var(--s4)">
    <div class="panel">
      <div style="display:grid;grid-template-columns:52px 1fr;gap:var(--s4)">
        ${voteBox(p)}
        <div>
          <div class="post__meta">${tierTag(p)}<span class="status" data-s="${esc(p.status)}">${esc(p.status)}</span><span>· ${esc(p.industry)}</span></div>
          <h1 style="margin:var(--s2) 0">${esc(p.title)}</h1>
          <p class="muted">${esc(p.summary)}</p>
          <div class="post__foot">${p.kind!=="ask"?stars(p,true):""}<span>${p.forks} remixes</span>${p.credits?`<span>${fmt(p.credits)} credits metered</span>`:""}</div>
        </div>
      </div>
      <div style="margin-top:var(--s5)"><p class="lbl">Built from</p><div class="chips" style="margin-top:var(--s2)">${p.uses.map(u=>`<span class="chip">${esc(u)}</span>`).join("")}</div></div>
      <div style="margin-top:var(--s5)"><p class="lbl">Where it is on the path to production</p>
        <div class="ladderbar" aria-hidden="true">${BC.statuses.map((s,i)=>`<span class="${i<=si?'on':''}"></span>`).join("")}</div>
        <div class="small muted" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--s2)">${BC.statuses.map((s,i)=>`<span style="${i===si?'color:var(--ink);font-weight:600':''}">${esc(s)}</span>`).join("")}</div></div>
      <div style="display:flex;gap:var(--s2);flex-wrap:wrap;margin-top:var(--s5)">
        ${p.kind!=="ask"?`<button class="btn btn--primary" id="remix">Remix this</button>`:`<button class="btn btn--primary" id="answer">Build an answer</button>`}
        <button class="btn btn--ghost" id="askSponsor">Find a sponsor for it</button>
        <button class="btn btn--ghost" id="pairUp">Ask the builder to pair</button>
      </div>
      <h2 style="margin-top:var(--s8)">Discussion</h2>
      <div class="comments" id="cmts">${commentsOf(p).map(c=>`<div class="cmt">${avatar(c.who)}<div><b>${esc(person(c.who).name)}</b> <span class="small muted">${esc(person(c.who).role||"")}</span><p>${esc(c.t)}</p></div></div>`).join("")}</div>
      <form id="cform" class="field" style="margin-top:var(--s4)"><label for="ctext">Add to the discussion</label><textarea id="ctext" rows="3" placeholder="Be kind, be specific. What would make this better?"></textarea><div><button class="btn btn--ghost btn--sm" type="submit">Post comment</button></div></form>
    </div>
    <aside class="side-rail">
      <div class="panel"><p class="eyebrow">Trust card</p><h2 style="margin:var(--s2) 0 var(--s3)">VibeRANT ${p.vr}/8</h2>
        <div class="trust">${BC.viberant.map((v,i)=>`<div><i class="${i<p.vr?'':'off'}">${v.k}</i><span>${esc(v.name)}<small>${esc(i<p.vr?v.plain:"Not yet applied. Remixing adds it automatically.")}</small></span></div>`).join("")}</div>
      </div>
      <div class="panel panel--tint"><div class="person__head">${avatar(p.author,true)}<div><h3>${esc(a.name)}</h3><p class="small muted">${esc(a.role)} · ${esc(a.org)}</p></div></div>
        ${a.approach?`<p class="approach" style="margin-top:var(--s3)">Best way to reach: ${esc(a.approach)}<br><s>Please don't:</s> ${esc(a.avoid)}</p>`:""}</div>
    </aside>
  </div>`;
}
post.after = id => {
  const p = postById(id); if (!p) return;
  const f = $("#cform"); if (f) f.onsubmit = e => { e.preventDefault(); const t = $("#ctext").value.trim(); if (!t) return;
    (S.extraComments[id] ||= []).push({ who: "u-you", t }); send("POST", "/api/comments", { post_id: id, t: t.slice(0,1000) }); gain(5, "added to the discussion"); route(); };
  const rx = $("#remix") || $("#answer"); if (rx) rx.onclick = () => { W.prefill = p; location.hash = "#/build"; if (p.kind !== "ask") gain(10, "started a remix"); };
  $("#askSponsor").onclick = () => sponsorModal(p);
  $("#pairUp").onclick = () => outreachModal(person(p.author), `pair on "${p.title}"`);
};

/* ---------- BUILD WIZARD (non-coders) ---------- */
const W = { step: 1, desc: "", parts: [], examples: ["","",""], title: "", kind: "build", reveal: false, prefill: null };
const STARTERS = [
  ["Which of our homes are riskiest to renew?", "Flood, wildfire, fire-station distance", ["Underwriting Risk Assessor","Spatial Risk","Emergency Services"]],
  ["Fix our customer list before a mailing", "Duplicates, bad addresses, messy dates", ["Data Quality Boost","Address Verification","Duplicate Rule Finder"]],
  ["Plan tomorrow's delivery routes", "Catch typos, then route each driver", ["Fleet Commander","Route Planning","Address Verification"]],
  ["What sales tax applies at each store?", "Rooftop-accurate, annexation-aware", ["GeoTAX","Tax Jurisdiction","Geocoding"]],
  ["Which 911 center covers each site?", "PSAP and fire authority per address", ["Emergency Services","Geocoding"]],
  ["Is this a good spot for a new location?", "Parcel, nearby places, risk, segment", ["Real Estate Intelligence: Commercial","Places Discovery"]]
];
function suggestParts(text){
  const t = text.toLowerCase(), out = new Set();
  const rules = [[/fire|flood|risk|renew|insur|hazard|quake/, ["Underwriting Risk Assessor","Spatial Risk"]],[/911|emergency|psap/, ["Emergency Services"]],[/address|mail|list|clean|duplicate/, ["Address Verification","Data Quality Boost"]],[/route|deliver|driver|fleet|dispatch/, ["Fleet Commander","Route Planning"]],[/tax/, ["GeoTAX","Tax Jurisdiction"]],[/store|site|location|retail|spot/, ["Real Estate Intelligence: Commercial","Places Discovery"]],[/fiber|telco|premises|household/, ["Network Build Prioritization","Service Area Market"]],[/phone|email|contact/, ["Contact Validation","Contact Enrichment"]],[/property|parcel|home|house/, ["Property Intelligence"]],[/time ?zone/, ["Timezone"]]];
  rules.forEach(([re, parts]) => { if (re.test(t)) parts.forEach(p => out.add(p)); });
  return [...out];
}
function vrOn(){ // which guardrails are switched on so far, in plain progression
  const on = new Set();
  if (W.desc.trim().length > 10) on.add("N");
  if (W.parts.length) { on.add("B"); on.add("I"); }
  if (W.examples.filter(x=>x.trim()).length >= 1) on.add("V");
  if (W.step >= 3) ["E","R","A","T"].forEach(k=>on.add(k));
  return on;
}
const credits = () => Math.max(0, W.parts.length * 35 + W.examples.filter(x=>x.trim()).length * 5);
function megaPrompt(o){
  const k = S.kit;
  return `# MEGA PROMPT — ${o.title || "Untitled build"}
_Generated in Builder Commons. Paste into Claude, Copilot, or any MCP-connected assistant with the Precisely connector._

## SOUL — how you behave
${k.soul.map(s=>`- ${s}`).join("\n")}

## BRAIN — what you know
${k.brain.map(s=>`- ${s}`).join("\n")}

## SKILLS — what you may call (Precisely MCP)
${(o.parts && o.parts.length ? o.parts : k.skills).map(s=>`- ${s}`).join("\n")}

## AGENTS — who does what
${BC.agentsRoster.filter(a=>k.agents.includes(a.name)).map(a=>`- ${a.name}: ${a.job}`).join("\n")}

## TASK
${o.desc || k.task}

## GOLDEN EXAMPLES — must pass before anyone else sees this
${(o.examples||[]).filter(x=>x.trim()).map((x,i)=>`${i+1}. ${x}`).join("\n") || "1. (Add at least one real example input and what a good answer looks like.)"}

## VIBERANT GUARDRAILS — apply quietly, report in the trust card
${BC.viberant.map(v=>`- ${v.k} · ${v.name}: ${v.auto}.`).join("\n")}

## OUTPUT
- A plain-language result a non-coder can act on.
- A trust card: data sources, live vs sample labels, credits used, which checks passed.
- Ask before sending, purchasing, publishing, or sharing anything outside the team.
`;
}
function build(){
  if (W.prefill){ const p = W.prefill; W.prefill = null; W.step = 2; W.desc = p.kind === "ask" ? p.summary : `Remix of "${p.title}": ${p.summary}`; W.parts = p.uses.slice(); W.title = p.kind === "ask" ? p.title.replace(/^Ask:\s*/i,"") : `${p.title} (remix)`; }
  const on = vrOn();
  const stepNames = ["Describe it","Pick parts","Quiet guardrails","Share it"];
  const steps = `<div class="steps" aria-label="Progress">${stepNames.map((n,i)=>`<span class="${W.step===i+1?'on':W.step>i+1?'done':''}"><i>${W.step>i+1?'✓':i+1}</i>${n}</span>`).join("")}</div>`;
  let body = "";
  if (W.step === 1) body = `<div class="field"><label for="desc">What do you want to get done? Say it like you'd say it to a colleague.</label>
      <textarea id="desc" rows="4" placeholder="e.g. Every Monday I get a list of homes up for renewal. I want to know which ones are risky because of wildfire or being far from a fire station.">${esc(W.desc)}</textarea>
      <p class="hint">No code, no jargon. The Guide turns this into a plan.</p></div>
      <p class="lbl" style="margin:var(--s5) 0 var(--s3)">Or start from what others built</p>
      <div class="starter">${STARTERS.map((s,i)=>`<button data-st="${i}"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></button>`).join("")}</div>`;
  if (W.step === 2) { const sug = suggestParts(W.desc); const pool = [...new Set([...sug, ...W.parts, ...BC.catalog.apps, ...BC.catalog.agents, ...BC.catalog.skills])];
    body = `<p class="lbl">Certified parts the Guide suggests</p><p class="small muted" style="margin:var(--s1) 0 var(--s3)">Suggested from your words. Tap to add or remove. Every part is Precisely-built or partner-certified.</p>
      <div class="parts" role="group" aria-label="Parts">${pool.slice(0,22).map(p=>`<button data-part="${esc(p)}" aria-pressed="${W.parts.includes(p)}">${sug.includes(p)?"★ ":""}${esc(p)}</button>`).join("")}</div>
      <div class="field" style="margin-top:var(--s6)"><label>Give three real examples (this becomes your test)</label><p class="hint">An input and what a good answer looks like. Like "123 Pine Rd, Paradise CA → should flag wildfire".</p>
      ${W.examples.map((x,i)=>`<input type="text" data-ex="${i}" value="${esc(x)}" aria-label="Example ${i+1}" placeholder="Example ${i+1}">`).join("")}</div>`; }
  if (W.step === 3) body = `<h2>Your build is now VibeRANT.</h2><p class="muted" style="margin:var(--s2) 0 var(--s4)">You didn't have to do any of this. The Guardian added it while you worked. Open the panel to see exactly what it did.</p>
      <div class="grid2">${BC.viberant.map(v=>`<div class="panel panel--tint"><p><b style="font-family:var(--mono);color:var(--green)">${v.k}</b> · <b>${esc(v.name)}</b></p><p class="small" style="margin-top:var(--s1)">${esc(v.plain)}</p></div>`).join("")}</div>`;
  if (W.step === 4) { if (!W.title) W.title = W.desc.split(/[.?!]/)[0].slice(0,70);
    const prev = { id:"preview", kind: W.kind, title: W.title || "Untitled build", author:"u-you", tier:"community", status:"Prototype", persona: BC.me.persona, industry:"Community", summary: W.desc, uses: W.parts, up:0, down:0, ratings:[], forks:0, credits: credits(), vr: on.size, age:0, comments:[] };
    body = `<div class="field"><label for="title">Give it a name people will search for</label><input id="title" type="text" value="${esc(W.title)}"></div>
      <div class="field" style="margin-top:var(--s4)"><span class="lbl">Post it as</span><div class="seg" role="group" aria-label="Post type">${[["build","Build"],["mashup","Mashup"]].map(([k,l])=>`<button data-kind="${k}" aria-pressed="${W.kind===k}">${l}</button>`).join("")}</div></div>
      <p class="lbl" style="margin:var(--s5) 0 var(--s2)">Preview</p><div class="preview-card"><div class="post__meta">${tierTag(prev)}<span class="status" data-s="Prototype">Prototype</span></div><h3 style="font-family:var(--display);font-size:var(--text-lg);margin:var(--s2) 0">${esc(prev.title)}</h3><p class="small muted">${esc(prev.summary)}</p><div class="post__foot">${vrBadges(prev.vr)}<span>${prev.uses.length} parts · ~${credits()} credits per run</span></div></div>
      <details style="margin-top:var(--s5)"><summary class="lbl" style="cursor:pointer">Mega prompt (for builders who want to take it into Claude or Copilot)</summary>
        <div class="prompt" style="margin-top:var(--s3)" id="mp">${esc(megaPrompt({ title: W.title, desc: W.desc, parts: W.parts, examples: W.examples }))}</div>
        <div style="display:flex;gap:var(--s2);margin-top:var(--s2)"><button class="btn btn--ghost btn--sm" id="cpMp">Copy</button><button class="btn btn--ghost btn--sm" id="dlMp">Download .md</button></div></details>`; }
  const canNext = W.step === 1 ? W.desc.trim().length > 10 : W.step === 2 ? W.parts.length > 0 : true;
  return `<div class="phead"><div><p class="eyebrow">Build without code</p><h1>Describe it. Assemble it. We'll make it safe.</h1><p>You bring the problem and three examples. Certified parts and quiet guardrails do the engineering.</p></div></div>
  <div class="wizard"><div class="panel">${steps}${body}
    <div style="display:flex;justify-content:space-between;gap:var(--s2);margin-top:var(--s6);flex-wrap:wrap">
      <button class="btn btn--ghost" id="back" ${W.step===1?"disabled":""}>Back</button>
      ${W.step<4?`<button class="btn btn--primary" id="next" ${canNext?"":"disabled"}>${W.step===3?"Looks good, share it":"Next"}</button>`:`<button class="btn btn--primary" id="publish">Post to the commons</button>`}
    </div></div>
    <aside class="quiet ${W.reveal?'reveal':''}" aria-labelledby="qT">
      <p class="eyebrow" style="color:var(--gold)">Quiet infrastructure</p><h2 id="qT" style="margin:var(--s2) 0">The Guardian is working</h2>
      <p class="small" style="color:#b8c1b7">Eight checks switch on as you go. You never have to touch them.</p>
      <div class="meter"><span class="small">VibeRANT</span><b>${on.size}/8</b></div>
      ${BC.viberant.map(v=>`<div class="q ${on.has(v.k)?'on':''}"><i>${v.k}</i><div><b>${esc(v.name)}</b><span>${esc(v.plain)}</span><span class="auto">→ ${esc(v.auto)}</span></div></div>`).join("")}
      <div class="meter"><span class="small">Estimated cost per run</span><b style="font-size:var(--text-lg)">~${credits()} credits</b></div>
      <button class="btn btn--ghost btn--sm" id="reveal" style="background:transparent;color:#fff;border-color:#ffffff40;margin-top:var(--s2)" aria-pressed="${W.reveal}">${W.reveal?"Hide the details":"Show me what you did"}</button>
    </aside></div>`;
}
build.after = () => {
  const d = $("#desc"); if (d) d.oninput = () => { W.desc = d.value; const n = $("#next"); if (n) n.disabled = W.desc.trim().length <= 10; refreshQuiet(); };
  $$("[data-st]").forEach(b => b.onclick = () => { const s = STARTERS[+b.dataset.st]; W.desc = s[0] + " — " + s[1] + "."; W.parts = s[2].slice(); W.title = s[0]; W.step = 2; route(); });
  $$("[data-part]").forEach(b => b.onclick = () => { const p = b.dataset.part; W.parts = W.parts.includes(p) ? W.parts.filter(x=>x!==p) : [...W.parts, p]; b.setAttribute("aria-pressed", W.parts.includes(p)); const n = $("#next"); if (n) n.disabled = !W.parts.length; refreshQuiet(); });
  $$("[data-ex]").forEach(i => i.oninput = () => { W.examples[+i.dataset.ex] = i.value; refreshQuiet(); });
  $$("[data-kind]").forEach(b => b.onclick = () => { W.kind = b.dataset.kind; route(); });
  const t = $("#title"); if (t) t.oninput = () => { W.title = t.value; };
  const bk = $("#back"); if (bk) bk.onclick = () => { W.step = Math.max(1, W.step-1); route(); };
  const nx = $("#next"); if (nx) nx.onclick = () => { W.step = Math.min(4, W.step+1); route(); };
  $("#reveal").onclick = () => { W.reveal = !W.reveal; route(); };
  const mp = () => megaPrompt({ title: W.title, desc: W.desc, parts: W.parts, examples: W.examples });
  const c = $("#cpMp"); if (c) c.onclick = () => copy(mp());
  const dl = $("#dlMp"); if (dl) dl.onclick = () => download("MEGA-PROMPT.md", mp());
  const pub = $("#publish"); if (pub) pub.onclick = () => {
    const id = "n" + Date.now().toString(36);
    S.newPosts.unshift({ id, kind: W.kind, title: (W.title || "Untitled build").slice(0,90), author: "u-you", tier: "community", status: "Prototype", persona: BC.me.persona, industry: "Community", summary: W.desc, uses: W.parts.slice(), up: 1, down: 0, ratings: [], forks: 0, credits: 0, vr: vrOn().size, age: 0, comments: [] });
    send("POST", "/api/posts", { post: S.newPosts[0] });
    Object.assign(W, { step: 1, desc: "", parts: [], examples: ["","",""], title: "", kind: "build", reveal: false });
    gain(25, "posted a build"); location.hash = `#/post/${id}`;
  };
};
function refreshQuiet(){ const on = vrOn(); $$(".quiet .q").forEach((q,i) => q.classList.toggle("on", on.has(BC.viberant[i].k))); const m = $$(".quiet .meter b"); if (m[0]) m[0].textContent = `${on.size}/8`; if (m[1]) m[1].textContent = `~${credits()} credits`; }

/* ---------- HACKATHONS & MASHUPS ---------- */
const M = { a: "Emergency Services", b: "Tax Jurisdiction", c: "GeoTAX" };
function mashName(){ const w = s => s.split(/[\s:]+/)[0]; return `${w(M.a)} × ${w(M.b)}${M.c?` × ${w(M.c)}`:""}`; }
function hack(){
  const all = [...BC.catalog.apps, ...BC.catalog.agents, ...BC.catalog.skills];
  const sel = (k, label) => `<div class="field"><label for="m${k}">${label}</label><select id="m${k}">${k==="c"?'<option value="">(optional)</option>':""}${all.map(x=>`<option ${M[k]===x?"selected":""}>${esc(x)}</option>`).join("")}</select></div>`;
  return `<div class="phead"><div><p class="eyebrow">Hackathons &amp; mashups</p><h1>Hire by building together, not by interviewing.</h1><p>Sponsors post real challenges. Mixed teams of no-, low- and pro-coders build for a day. Sponsors fund pilots and hire from the finalists, and every entry stays in the commons to be remixed.</p></div></div>
  <div class="grid3">${BC.hackathons.map(h=>{ const sp = BC.sponsors.find(s=>s.id===h.sponsor); const j = !!S.joined[h.id];
    return `<article class="panel event"><div class="post__meta"><span class="tag tag--partner">${esc(sp.kind)}</span><span>${esc(sp.name)}</span></div><h2>${esc(h.name)}</h2><p class="small muted">${esc(h.when)} · ${h.teams + (j?1:0)} teams · ${esc(h.prize)}</p>
      <ul>${h.challenges.map(c=>`<li>${esc(c)}</li>`).join("")}</ul><p class="hire">${esc(h.hiringNote)}</p>
      <div style="display:flex;gap:var(--s2);flex-wrap:wrap"><button class="btn ${j?'btn--ghost':'btn--primary'} btn--sm" data-join="${h.id}" aria-pressed="${j}">${j?"✓ On a team":"Join a team"}</button><button class="btn btn--ghost btn--sm" data-findteam="${h.id}">Find teammates</button></div></article>`; }).join("")}</div>
  <section class="panel" style="margin-top:var(--s6)" aria-labelledby="mlT"><p class="eyebrow">Mashup lab</p><h2 id="mlT" style="margin:var(--s2) 0 var(--s4)">Snap two or three parts together and see what happens</h2>
    <div class="mash">${sel("a","First part")}<span class="plus" aria-hidden="true">+</span>${sel("b","Second part")}<span class="plus" aria-hidden="true">+</span>${sel("c","Third part")}</div>
    <div class="preview-card" style="margin-top:var(--s4)" id="mashOut"></div>
    <div style="display:flex;gap:var(--s2);margin-top:var(--s3);flex-wrap:wrap"><button class="btn btn--primary" id="mashPost">Post this mashup</button><button class="btn btn--ghost" id="mashBuild">Open in the builder</button><button class="btn btn--ghost" id="mashCopy">Copy mega prompt</button></div>
  </section>`;
}
function mashIdea(){
  const parts = [M.a, M.b, M.c].filter(Boolean);
  const verbs = { "Emergency Services":"which 911 center and fire authority serve it", "Tax Jurisdiction":"the exact tax jurisdiction", "GeoTAX":"the sales and use tax due", "Spatial Risk":"flood, wildfire and quake exposure", "Route Planning":"the fastest route", "Places Discovery":"what's nearby", "Property Intelligence":"parcel and building facts", "Address Verification":"whether the address is real and deliverable", "Network Build Prioritization":"how many premises are within a short drive", "Data Quality Boost":"a cleaner version of the list", "Underwriting Risk Assessor":"an underwriting risk file", "Fleet Commander":"per-driver routes", "Service Area Market":"households now and in 5 years", "Timezone":"the local time zone", "Contact Validation":"whether emails and phones are valid" };
  const desc = `For every address on your list, get ${parts.map(p=>verbs[p]||p.toLowerCase()).join(", then ")} — in one plain-language table with a trust card.`;
  return { title: mashName() + " mashup", desc, parts };
}
hack.after = () => {
  const draw = () => { const m = mashIdea(); $("#mashOut").innerHTML = `<div class="post__meta"><span class="tag tag--mashup">Mashup</span><span class="tag tag--community">Community</span></div><h3 style="font-family:var(--display);font-size:var(--text-lg);margin:var(--s2) 0">${esc(m.title)}</h3><p class="small muted">${esc(m.desc)}</p><div class="post__foot">${vrBadges(8)}<span>~${m.parts.length*35} credits per run</span></div>`; };
  ["a","b","c"].forEach(k => $("#m"+k).onchange = e => { M[k] = e.target.value; draw(); }); draw();
  $$("[data-join]").forEach(b => b.onclick = () => { const id = b.dataset.join, was = !!S.joined[id]; S.joined[id] = !was; if (!was) gain(15, "joined a hackathon team"); else save(); route(); });
  $$("[data-findteam]").forEach(b => b.onclick = () => { S.peopleOpen = "team"; location.hash = "#/people"; });
  $("#mashPost").onclick = () => { const m = mashIdea(), id = "n"+Date.now().toString(36);
    S.newPosts.unshift({ id, kind:"mashup", title:m.title, author:"u-you", tier:"community", status:"Idea", persona:BC.me.persona, industry:"Community", summary:m.desc, uses:m.parts, up:1, down:0, ratings:[], forks:0, credits:0, vr:8, age:0, comments:[] });
    send("POST", "/api/posts", { post: S.newPosts[0] });
    gain(25, "posted a mashup"); location.hash = `#/post/${id}`; };
  $("#mashBuild").onclick = () => { const m = mashIdea(); Object.assign(W, { step: 2, desc: m.desc, parts: m.parts, title: m.title, kind: "mashup" }); location.hash = "#/build"; };
  $("#mashCopy").onclick = () => { const m = mashIdea(); copy(megaPrompt({ title: m.title, desc: m.desc, parts: m.parts, examples: [] })); };
};

/* ---------- SPONSORS ---------- */
function mySkills(){ return new Set([...S.kit.skills, ...S.newPosts.filter(p=>p.author==="u-you").flatMap(p=>p.uses)]); }
function sponsorMatch(s){ const mine = mySkills(); if (!s.skills.length) return 70; const hit = s.skills.filter(k=>mine.has(k)).length; return Math.round(35 + hit / s.skills.length * 60); }
function sponsors(){
  const list = BC.sponsors.slice().sort((a,b)=>sponsorMatch(b)-sponsorMatch(a));
  return `<div class="phead"><div><p class="eyebrow">Find a sponsor</p><h1>Get your build funded by someone who needs it.</h1><p>Sponsors post what they're looking for and what they'll put in. Your match is based on the parts you build with. Strong ratings and a VibeRANT trust card move you up.</p></div><button class="btn btn--ghost" id="beSponsor">I want to sponsor builders</button></div>
  <div class="grid2">${list.map(s=>`<article class="panel person"><div class="person__head" style="justify-content:space-between"><div><span class="tag tag--partner">${esc(s.kind)}</span><h2 style="margin-top:var(--s2)">${esc(s.name)}</h2></div><div style="text-align:right"><div class="match">${sponsorMatch(s)}%</div><div class="small muted">match for you</div></div></div>
    <p><b>Looking for:</b> ${esc(s.seeks)}</p><p class="small muted">Puts in: ${esc(s.budget)} · ${esc(s.industries.join(", "))}</p>
    ${s.skills.length?`<div class="chips">${s.skills.map(k=>`<span class="chip" style="${mySkills().has(k)?'border-color:var(--green);color:var(--green-d)':''}">${mySkills().has(k)?"✓ ":""}${esc(k)}</span>`).join("")}</div>`:""}
    <div><button class="btn btn--primary btn--sm" data-sp="${s.id}">Request sponsorship</button></div></article>`).join("")}</div>`;
}
sponsors.after = () => {
  $$("[data-sp]").forEach(b => b.onclick = () => sponsorModal(null, BC.sponsors.find(s=>s.id===b.dataset.sp)));
  $("#beSponsor").onclick = () => modal(`<h2 id="modalTitle">Sponsor builders</h2><p class="muted">In the full product, a sponsor posts a challenge, a budget, and the data scopes builders may use. Builds that hit 4.5 stars and 8/8 VibeRANT get a pilot offer automatically.</p><div class="modal__foot"><button class="btn btn--primary" data-close>Got it</button></div>`);
};
function sponsorModal(p, s){
  const mine = allPosts().filter(x => x.author === "u-you");
  const target = p || mine[0] || BC.posts[0];
  s = s || BC.sponsors.slice().sort((a,b)=>sponsorMatch(b)-sponsorMatch(a))[0];
  const note = `Hi ${s.name} team,\n\nYou're looking for: ${s.seeks.toLowerCase()}. I built "${target.title}" on ${target.uses.slice(0,3).join(", ")}. It's at ${target.status.toLowerCase()} with a ${target.vr}/8 VibeRANT trust card${avg(target)?` and ${avg(target).toFixed(1)} stars from ${ratingsOf(target).length} builders`:""}.\n\nWhat I'd do with a pilot: run it on one of your real files, with your team driving, and share the before/after.\n\nNo deck needed. The build and its trust card are in the commons if you want to try it first.`;
  modal(`<h2 id="modalTitle">Request sponsorship from ${esc(s.name)}</h2><p class="small muted">Draft only. Nothing is sent from this prototype.</p><div class="field"><label for="spNote">Your note</label><textarea id="spNote" rows="10">${esc(note)}</textarea></div><div class="modal__foot"><button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--primary" id="spCopy">Copy note</button></div>`);
  $("#spCopy").onclick = () => { copy($("#spNote").value); closeModal(); };
}

/* ---------- PEOPLE ---------- */
function people(){
  const q = query(), o = S.peopleOpen;
  const list = BC.people.filter(p => (o === "all" || p.open.includes(o)) && (!q || (p.name+" "+p.role+" "+p.org+" "+p.skills.join(" ")).toLowerCase().includes(q)));
  const label = { hire: "Open to hire", mentor: "Mentors", team: "Looking for a team" };
  return `<div class="phead"><div><p class="eyebrow">Find a person</p><h1>Find the builder, mentor or teammate you need.</h1><p>Every profile says how that person wants to be approached, and what to skip. Builds count more than titles. To hire someone, invite them to a hackathon.</p></div></div>
  <div class="filters" role="group" aria-label="Filter people">${[["all","Everyone"],["hire","Open to hire"],["mentor","Mentors"],["team","Looking for a team"]].map(([k,l])=>`<button class="chip" data-po="${k}" aria-pressed="${o===k}">${l}</button>`).join("")}</div>
  <div class="grid3">${list.map(p=>`<article class="panel person"><div class="person__head">${avatar(p.id,true)}<div><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.role)}<br>${esc(p.org)}</p></div></div>
    <div class="post__meta"><span class="tag">${esc(p.persona)}</span><span class="tag tag--community">${esc(BC.ladder[p.level-1].name)}</span><span>${p.builds} builds · ${fmt(p.rep)} rep</span></div>
    <div class="chips">${p.skills.map(s=>`<span class="chip">${esc(s)}</span>`).join("")}</div>
    <p class="small">${p.open.map(x=>label[x]).join(" · ")}</p>
    <p class="approach">Reach me: ${esc(p.approach)}<br><s>Please don't:</s> ${esc(p.avoid)}</p>
    <div style="display:flex;gap:var(--s2);flex-wrap:wrap"><button class="btn btn--primary btn--sm" data-reach="${p.id}">Reach out their way</button>${p.open.includes("hire")?`<button class="btn btn--ghost btn--sm" data-hire="${p.id}">Invite to a hackathon</button>`:""}</div></article>`).join("") || `<div class="empty">No one matches. Try another filter.</div>`}</div>`;
}
people.after = () => {
  $$("[data-po]").forEach(b => b.onclick = () => { S.peopleOpen = b.dataset.po; save(); route(); });
  $$("[data-reach]").forEach(b => b.onclick = () => outreachModal(person(b.dataset.reach)));
  $$("[data-hire]").forEach(b => b.onclick = () => { const p = person(b.dataset.hire); const h = BC.hackathons[0];
    outreachModal(p, `join our team at ${h.name} (${h.when}). The sponsor hires from finalists instead of a take-home`); });
};
function outreachModal(p, purpose){
  const channel = p.approach || "the community thread";
  const best = p.builds ? `your ${p.builds} builds in the commons` : "your question in the commons";
  const msg = `Hi ${p.name.split(" ")[0]},\n\nI've been learning from ${best}${p.skills?.length?`, especially your work with ${p.skills[0]}`:""}. ${purpose ? `Would you be up for us to ${purpose}?` : "Would you be open to swapping notes on what you're building?"}\n\nYou said the best way to reach you is: "${channel.toLowerCase()}", so that's how I'm doing it. No pressure, and no follow-up sequence.`;
  modal(`<h2 id="modalTitle">Reach ${esc(p.name)} their way</h2><p class="approach">Preferred: ${esc(channel)} · <s>Avoid:</s> ${esc(p.avoid||"—")}</p><div class="field"><label for="oNote">Draft</label><textarea id="oNote" rows="9">${esc(msg)}</textarea></div><p class="small muted">Draft only. Nothing is sent from this prototype.</p><div class="modal__foot"><button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--primary" id="oCopy">Copy draft</button></div>`);
  $("#oCopy").onclick = () => { copy($("#oNote").value); closeModal(); };
}

/* ---------- BUILDER KIT: soul, brain, skills, agents, mega prompt ---------- */
let kitTab = "soul";
function kit(){
  const k = S.kit;
  const tabs = [["soul","Soul","Values and voice"],["brain","Brain","What it knows"],["skills","Skills","What it can call"],["agents","Agents","Who does what"],["mega","Mega prompt","All of it, assembled"]];
  let body = "";
  if (kitTab === "soul") body = listEditor("soul", "How should your assistant behave? These become its first lines.", k.soul);
  if (kitTab === "brain") body = listEditor("brain", "What should it know and remember? Trusted data first.", k.brain);
  if (kitTab === "skills") body = `<p class="muted" style="margin-bottom:var(--s3)">Pick the Precisely skills it may call through the MCP connector. Fewer is safer.</p><div class="parts" role="group" aria-label="Skills">${[...BC.catalog.skills, ...BC.catalog.agents].map(s=>`<button data-kskill="${esc(s)}" aria-pressed="${k.skills.includes(s)}">${esc(s)}</button>`).join("")}</div>`;
  if (kitTab === "agents") body = `<p class="muted" style="margin-bottom:var(--s3)">A small team of agents, each with one job. The Guardian can't be turned off.</p><div class="grid2">${BC.agentsRoster.map(a=>`<label class="panel panel--tint" style="display:flex;gap:var(--s3);align-items:flex-start;cursor:pointer"><input type="checkbox" data-kagent="${esc(a.name)}" ${k.agents.includes(a.name)?"checked":""} ${a.name==="Guardian"?"disabled":""} style="margin-top:4px;width:18px;height:18px;accent-color:var(--green)"><span><b>${esc(a.name)}</b>${a.name==="Guardian"?' <span class="tag">always on</span>':""}<br><span class="small muted">${esc(a.job)}</span></span></label>`).join("")}</div>`;
  if (kitTab === "mega") body = `<div class="field"><label for="ktask">The job, in plain words</label><textarea id="ktask" rows="3">${esc(k.task)}</textarea></div>
    <div class="prompt" style="margin-top:var(--s4)" id="kmp">${esc(megaPrompt({ title: "My builder assistant", desc: k.task, parts: k.skills, examples: [] }))}</div>
    <div style="display:flex;gap:var(--s2);margin-top:var(--s3);flex-wrap:wrap"><button class="btn btn--primary btn--sm" id="kCopy">Copy mega prompt</button><button class="btn btn--ghost btn--sm" id="kDl">Download MEGA-PROMPT.md</button><button class="btn btn--ghost btn--sm" id="kSoul">Download SOUL.md</button><button class="btn btn--ghost btn--sm" id="kBrain">Download BRAIN.md</button><button class="btn btn--ghost btn--sm" id="kAgents">Download AGENTS.md</button></div>`;
  return `<div class="phead"><div><p class="eyebrow">Builder kit</p><h1>Soul, brain, skills, agents. One mega prompt.</h1><p>The same anatomy pro builders use, in plain words. Shape it once, and every build you start inherits it. Take it into Claude, Copilot or any MCP-connected assistant.</p></div></div>
  <div class="anatomy" role="tablist" aria-label="Kit parts">${tabs.map(([key,n,d])=>`<button role="tab" data-kt="${key}" aria-pressed="${kitTab===key}" aria-selected="${kitTab===key}"><b>${n}</b><span>${d}</span></button>`).join("")}</div>
  <div class="panel" role="tabpanel">${body}</div>`;
}
function listEditor(key, hint, items){
  return `<p class="muted" style="margin-bottom:var(--s3)">${esc(hint)}</p><div class="editable" id="ed-${key}">${items.map((t,i)=>`<div class="row"><input type="text" data-ed="${key}" data-i="${i}" value="${esc(t)}" aria-label="${key} line ${i+1}"><button class="iconbtn" data-del="${key}" data-i="${i}" aria-label="Remove line ${i+1}">✕</button></div>`).join("")}</div>
  <button class="btn btn--ghost btn--sm" style="margin-top:var(--s3)" data-add="${key}">+ Add a line</button>`;
}
kit.after = () => {
  const k = S.kit;
  $$("[data-kt]").forEach(b => b.onclick = () => { kitTab = b.dataset.kt; route(); });
  $$("[data-ed]").forEach(i => i.oninput = () => { k[i.dataset.ed][+i.dataset.i] = i.value; save(); });
  $$("[data-del]").forEach(b => b.onclick = () => { k[b.dataset.del].splice(+b.dataset.i,1); save(); route(); });
  $$("[data-add]").forEach(b => b.onclick = () => { k[b.dataset.add].push(""); save(); route(); const ins = $$(`[data-ed="${b.dataset.add}"]`); ins[ins.length-1]?.focus(); });
  $$("[data-kskill]").forEach(b => b.onclick = () => { const s = b.dataset.kskill; k.skills = k.skills.includes(s) ? k.skills.filter(x=>x!==s) : [...k.skills, s]; b.setAttribute("aria-pressed", k.skills.includes(s)); save(); });
  $$("[data-kagent]").forEach(c => c.onchange = () => { const n = c.dataset.kagent; k.agents = c.checked ? [...new Set([...k.agents, n])] : k.agents.filter(x=>x!==n); save(); });
  const t = $("#ktask"); if (t) t.oninput = () => { k.task = t.value; save(); $("#kmp").textContent = megaPrompt({ title: "My builder assistant", desc: k.task, parts: k.skills, examples: [] }); };
  const mp = () => megaPrompt({ title: "My builder assistant", desc: k.task, parts: k.skills, examples: [] });
  const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  on("#kCopy", () => copy(mp())); on("#kDl", () => download("MEGA-PROMPT.md", mp()));
  on("#kSoul", () => download("SOUL.md", `# SOUL\n\n${k.soul.map(s=>`- ${s}`).join("\n")}\n`));
  on("#kBrain", () => download("BRAIN.md", `# BRAIN\n\n${k.brain.map(s=>`- ${s}`).join("\n")}\n`));
  on("#kAgents", () => download("AGENTS.md", `# AGENTS\n\n${BC.agentsRoster.filter(a=>k.agents.includes(a.name)).map(a=>`## ${a.name}\n${a.job}\n`).join("\n")}\n## Skills (Precisely MCP)\n${k.skills.map(s=>`- ${s}`).join("\n")}\n`));
};

/* ---------- INVITATIONS (seller lens) ---------- */
let acctSel = 0;
const NOTES = {
  "Heartland Mutual": "Maya — your wildfire triage build is the most-upvoted insurance build this month, and three teammates joined it in a week. You asked about batch mode. Want to try it on your real renewal file in a 30-minute build session? You drive; I'll bring one of our builders. If now isn't the time, I'll post the batch template in your thread instead.",
  "Lakeshore Credit Union": "Priya — 41 teams have remixed your member-list cleanup, six of them credit unions. Would you co-host a credit-union build session next month? We'll handle logistics and spotlight your build in the release notes. Your office-hours format is the one we'd copy.",
  "Cascade Fiber": "Grace — here's a 2-minute video adding growth weighting to your fiber mashup, the way you asked. The remix link is under the video. No meeting needed; if it's useful, tell me what to try next.",
  "Kittitas-area public works": "Samuel — answering in your thread: here's a template that returns the 911 center and fire authority for all 140 sites in one sheet. Maya offered to pair for 20 minutes. There's also a county grant in the Public Sector jam on Jan 15 if you want to take it further.",
  "Rio Verde Logistics": "Ana — I pre-filled the dispatcher template with your depot so you can try it without setup. If you like it, Mashup Monday is a relaxed 45 minutes where dispatchers swap tricks. Come as a guest."
};
function invites(){
  const acc = BC.accounts.map((a,i)=>({ ...a, i, stage: S.stageOverride[a.org] ?? a.stage }));
  const credits = acc.reduce((s,a)=>s+a.credits,0), champs = acc.filter(a=>a.stage>=2).length;
  const sel = acc[acctSel];
  return `<div class="phead"><div><p class="eyebrow" style="color:var(--gold-ink)">Seller lens · Invitations</p><h1>The builders are the invitation.</h1><p>No cold lists. Every opportunity here started with someone building something. Their build tells us what they need, and their profile tells us how they want to be approached. We serve first, make them the hero, and let them pull us in.</p></div></div>
  <p class="lens"><span aria-hidden="true">●</span><span>"Serve before you sell, make other people the hero and create so much value that the next conversation becomes inevitable." — <a href="https://www.linkedin.com/in/carsonvheady" target="_blank" rel="noopener">Carson V. Heady</a>, Microsoft</span></p>
  <div class="kpis"><div class="kpi"><b>${acc.length}</b><span>accounts sourced by builders</span></div><div class="kpi"><b>${champs}</b><span>champions (built + shared)</span></div><div class="kpi"><b>${fmt(credits)}</b><span>credits metered before any call</span></div><div class="kpi"><b>0</b><span>cold calls made</span></div></div>
  <div class="kanban" role="list" aria-label="Pipeline by stage">${BC.stages.map((st,si)=>`<div class="col" role="listitem"><h3><span>${esc(st)}</span><span>${acc.filter(a=>a.stage===si).length}</span></h3>${acc.filter(a=>a.stage===si).map(a=>`<button class="acct" data-acct="${a.i}" aria-pressed="${a.i===acctSel}"><b>${esc(a.org)}</b><span class="muted">${esc(a.industry)} · via ${esc(a.hero)}</span><span>${esc(a.signals[0])}</span></button>`).join("")}</div>`).join("")}</div>
  <div class="grid2" style="margin-top:var(--s5)">
    <section class="panel" aria-labelledby="sigT"><p class="eyebrow">What ${esc(sel.hero)} showed us</p><h2 id="sigT" style="margin:var(--s2) 0 var(--s3)">${esc(sel.org)}</h2>
      ${sel.signals.map(s=>`<div class="signal">${esc(s)}</div>`).join("")}
      <p class="approach" style="margin-top:var(--s4)">How ${esc(sel.hero)} wants to be called on: <b>${esc(sel.approach)}</b><br><s>Please don't:</s> ${esc(sel.avoid)}</p>
      <p class="lbl" style="margin-top:var(--s4)">Serve-first move</p><p class="small">${esc(sel.serve)}</p>
      <div style="display:flex;gap:var(--s2);margin-top:var(--s4);flex-wrap:wrap"><button class="btn btn--ghost btn--sm" id="stageBack" ${sel.stage===0?"disabled":""}>← Stage</button><button class="btn btn--primary btn--sm" id="stageNext" ${sel.stage>=BC.stages.length-1?"disabled":""}>They pulled us in → next stage</button></div>
    </section>
    <section class="panel panel--tint" aria-labelledby="noteT"><p class="eyebrow">Draft, in their channel</p><h2 id="noteT" style="margin:var(--s2) 0 var(--s3)">Make ${esc(sel.hero)} the hero</h2>
      <div class="field"><label for="inv" class="sr">Draft note</label><textarea id="inv" rows="8">${esc(NOTES[sel.org])}</textarea></div>
      <p class="small muted" style="margin-top:var(--s2)">Draft only. A human sends it, in ${esc(sel.hero)}'s preferred channel. Nothing leaves this prototype.</p>
      <div style="margin-top:var(--s3)"><button class="btn btn--primary btn--sm" id="invCopy">Copy draft</button></div>
      <p class="lbl" style="margin-top:var(--s5)">Guardrails for sellers</p>
      <ul class="small" style="margin:var(--s2) 0 0;padding-left:1.1em"><li>Only signals people chose to share in the commons. No scraping, no enrichment of private profiles.</li><li>Respect "please don't." It overrides any sequence.</li><li>Lead with their build, not our product.</li><li>One message, then wait for them to pull.</li></ul>
    </section>
  </div>`;
}
invites.after = () => {
  $$("[data-acct]").forEach(b => b.onclick = () => { acctSel = +b.dataset.acct; route(); });
  const sel = BC.accounts[acctSel], cur = S.stageOverride[sel.org] ?? sel.stage;
  $("#stageNext").onclick = () => { S.stageOverride[sel.org] = Math.min(BC.stages.length-1, cur+1); save(); route(); toast(`${sel.org} → ${BC.stages[S.stageOverride[sel.org]]}`); };
  $("#stageBack").onclick = () => { S.stageOverride[sel.org] = Math.max(0, cur-1); save(); route(); };
  $("#invCopy").onclick = () => copy($("#inv").value);
};

/* ---------- WHY ---------- */
function why(){
  return `<div class="phead"><div><p class="eyebrow">Why this works</p><h1>From vibe-coding to VibeRANT, with the majority who don't code.</h1></div><button class="btn btn--ghost" id="reset">Reset demo data</button></div>
  <div class="prose">
    <p>AI Studio already ships the parts: ready-made apps, agents and skills on trusted data, wired to Claude, Copilot and ChatGPT over MCP. Precisely's product lead has said customers and partners will contribute their own assets, "making AI Studio a community of builders sharing tools with one another" (<a href="https://www.precisely.com/blog/ai-ready-data/5-takeaways-from-precisely-now-trusted-ai-starts-with-trusted-data/" target="_blank" rel="noopener">Precisely Now takeaways</a>). Builder Commons sketches what that community could look like if it were built for the people who own the business problems, most of whom will never write code.</p>
    <h2>AI is what it eats</h2>
    <figure class="berg">
      <img src="./assets/iceberg.webp" width="1224" height="1285" alt="Split illustration. Left, labeled Vibe-coding: a flashy app tower on a small cracked chunk of ice, with a thin fractured spike below the water and broken laptops and servers on the sea floor. Right, labeled VibeRANT: a calm building where a small group builds together, sitting on a huge solid iceberg with eight glowing bands below the waterline." loading="lazy">
      <figcaption>
        <div class="berg__cols">
          <div><b>Above the water</b><span>What a builder sees: a working app in plain words, a trust card, votes and an 8/8 badge.</span></div>
          <div><b>Below the water</b><span>What Precisely brings: verified address, property, risk and location data, plus eight checks applied quietly.</span></div>
        </div>
        <ol class="berg__bands">${BC.viberant.map(v=>`<li><i>${esc(v.k)}</i>${esc(v.name || v.title || v.label || "")}</li>`).join("")}</ol>
        <small>Vibe-coding builds the tower first and hopes the ice holds. VibeRANT builds the ice first: trusted data and guardrails make up most of the mass, so the part people see can stay simple. Concept adapted from Justin R.'s "AI First vs. Data First" iceberg; illustration generated for this prototype.</small>
      </figcaption>
    </figure>
    <h2>Four moves</h2>
    <div class="flow"><div><b>1 · Invite</b>Plain-language builds, starters, and remixes. Spark → Mentor ladder.</div><div><b>2 · Protect quietly</b>Eight VibeRANT checks applied while you work. A trust card on every post.</div><div><b>3 · Reward</b>Votes, ratings, remixes, sponsors, and hiring through hackathons.</div><div><b>4 · Meter</b>Credits accrue as builds get used. Free becomes paid on its own.</div><div><b>5 · Be invited</b>Sellers follow the builders' signals and their stated preferences.</div></div>
    <h2>VibeRANT, made invisible</h2>
    <p>Vibe-coding gets something on screen fast. VibeRANT makes it Verified, built on handled Infrastructure, Built from certified parts, End-to-end safe, Reliable, well-Architected, with No area missed and Trusted. Pro builders read those as engineering practices. Non-coders shouldn't have to read them at all, so the platform applies them and shows the result as a simple 8/8.</p>
    <h2>Sell the way people want to buy</h2>
    <blockquote>"Serve before you sell, make other people the hero and create so much value that the next conversation becomes inevitable."<cite>Carson V. Heady, Microsoft (<a href="https://www.linkedin.com/in/carsonvheady" target="_blank" rel="noopener">LinkedIn</a>)</cite></blockquote>
    <p>Every profile carries "reach me" and "please don't." Every build is a public signal of need. The seller lens turns those into a pipeline where the first move is always a gift: a template, a co-build, a 2-minute video. Heady talks about wanting customers to "buy with me" rather than from him (<a href="https://www.youtube.com/watch?v=SX0ph512Yrc" target="_blank" rel="noopener">Selling from the Heart</a>). Here, they build with us first.</p>
    <h2>What the prototype shows, and what it doesn't</h2>
    <p>Everything is interactive: voting (up, down, flip, undo), 1–5 ratings, comments, a 4-step no-code builder, the mashup lab, hackathon teams, sponsor and people matching, the soul/brain/skills/agents kit with downloadable files, and the seller pipeline. People, organizations and sponsors are made up. Nothing calls Precisely's API, and nothing is sent anywhere. Your votes, ratings, comments, posts and XP are saved on the demo server under an anonymous visitor ID, so they survive a reload. Posts, comments and vote totals are visible to other visitors. "Reset demo data" erases everything you added.</p>
  </div>`;
}
why.after = () => { $("#reset").onclick = async () => { try { await api("DELETE", "/api/me"); } catch(_) {} location.hash = "#/commons"; location.reload(); }; };

$("#view").innerHTML = '<p class="muted" style="padding:var(--s6)">Loading the commons…</p>';
hydrate().then(() => { renderMe(); route(); });
})();
