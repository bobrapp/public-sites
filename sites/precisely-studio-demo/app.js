(function(){
const INIT_HASH = location.hash||'';
const D = window.DEMO;
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => n.toLocaleString('en-US');
const facts = rows => `<dl class="facts">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
const chips = (arr, cls='chip chip--mono') => `<div class="chips">${arr.map(a=>`<span class="${cls}">${esc(a)}</span>`).join('')}</div>`;
let maps = [];

/* credits total */
const total = D.credits.reduce((a,b)=>a+b.v,0);
$('#creditTotal').textContent = fmt(Math.round(total));

/* stack layers */
const ranBy = {apps:new Set(["Property Analyzer","Fleet Commander","GeoTAX","Real Estate Intelligence: Commercial","Data Quality Boost"]), agents:new Set(["Underwriting Risk Assessor","Network Build Prioritization","Address Quality","Contact Enrichment","Address Verification"]), skills:new Set(), mcp:new Set()};
const layerText = {
  apps: ["Hosted apps open in their own workspace with history, maps and step-by-step flows. Each one is powered by an agent underneath.", D.catalog.apps],
  agents: ["Agents take a natural-language prompt, call precisely_actions_describe to discover tools, then precisely_actions_execute to run them. Every answer ends with a list of the platform actions it used.", D.catalog.agents],
  skills: ["Skills are single capabilities on live Precisely data — the building blocks the agents compose. They weren't run on their own here; they ran inside the agents and apps above.", D.catalog.skills],
  mcp: ["One HTTP MCP endpoint (api.cloud.precisely.com/mcp) exposes the same tools to Claude Desktop, Claude Code, GitHub Copilot CLI, VS Code Copilot and Databricks.", ["Claude Desktop","Claude Code","GitHub Copilot CLI","VS Code Copilot","Databricks"]]
};
function showLayer(k){
  document.querySelectorAll('.layer').forEach(b=>b.setAttribute('aria-selected', b.dataset.layer===k));
  const [desc, items] = layerText[k];
  $('#layerPanel').innerHTML = `<p>${esc(desc)}</p><div class="label">${k==='mcp'?'Supported clients':'In the catalog'}${(k==='apps'||k==='agents')?' · highlighted = run in this test':''}</div><div class="chips">${items.map(i=>`<span class="chip ${ranBy[k].has(i)?'chip--run':''}">${esc(i)}</span>`).join('')}</div>`;
}
document.querySelectorAll('.layer').forEach(b=>{
  b.addEventListener('click',()=>showLayer(b.dataset.layer));
  b.addEventListener('keydown',e=>{
    const list=[...document.querySelectorAll('.layer')]; const i=list.indexOf(b);
    if(e.key==='ArrowRight'){list[(i+1)%list.length].focus();list[(i+1)%list.length].click();e.preventDefault()}
    if(e.key==='ArrowLeft'){list[(i-1+list.length)%list.length].focus();list[(i-1+list.length)%list.length].click();e.preventDefault()}
  });
});
showLayer('apps');

/* tour stops */
const stops = [
{
  title:"Underwriting Risk Assessor", kind:"Agent", place:"Fairplay, Colorado",
  headline:"13", headlineSub:"platform actions in one prompt",
  prompt:`Tell me about the risks at <b>42 Valley of the Sun Dr, Fairplay, CO</b>`,
  actions:D.underwriting.actions,
  body(){
    const u=D.underwriting;
    return `<div class="cols"><div>
      <div class="label">Wildfire — the dominant risk</div>
      <div class="gauge"><div><b>${u.overall.baseline}</b>/50<span>Baseline model <span class="pill pill--warn">High</span></span></div><div><b>${u.overall.extreme}</b>/50<span>Extreme model <span class="pill pill--bad">Very high</span></span></div></div>
      ${u.wildfire.map(([k,v])=>`<div class="hbar"><span>${esc(k)}</span><div class="hbar__track"><div class="hbar__fill" style="width:0" data-w="${v/50*100}"></div></div><span class="hbar__v">${v}</span></div>`).join('')}
      <p class="panel__note">Sub-ratings on a 0–50 scale; higher means more exposure. Intermix landscape, 686 ft from the wildland-urban interface.</p>
    </div><div>
      <div class="label">Underwriting file</div>${facts(u.facts)}
      <p class="panel__note">Also returned: roof and vegetation read from Oct 2024 imagery (gable, excellent condition, 0% overhang), quake fault 3.35 mi away, and hail, wind and tornado history.</p>
    </div></div>`;
  },
  shots:[["underwriting-top","Agent output header and address verification"],["underwriting-wildfire","Wildfire model detail"]],
  good:["One plain-English prompt fans out to 13 live data actions and returns a full underwriting file.","Fire-station drive time and the serving 911 center are details most risk tools don't include."],
  watch:["Assessor records say metal roof; imagery says shingle. Both are reported without reconciling them.","\"Owner-occupied as an absentee arrangement\" reads as a contradiction."]
},
{
  title:"Property Analyzer", kind:"App", place:"Ellensburg, Washington",
  headline:"8.6%", headlineSub:"combined sales tax at CWU",
  prompt:`Analyze: <b>400 E University Way, Ellensburg, WA 98926</b>`,
  actions:["property.attributes","property.parcels","tax.jurisdiction","timezone.lookup","places.points_of_interest"],
  body(){
    const p=D.property;
    return `<div class="cols"><div>
      <div class="label">${esc(p.label)}</div>${facts(p.facts)}
    </div><div>
      <div class="label">Places found at the address</div>${chips(p.pois,'chip')}
      <p class="panel__note">The app's narrative explains that the $100 assessed value is a nominal figure for a tax-exempt state parcel, not a market price. A good catch for a non-expert reader.</p>
      <div class="label">Composite score shown</div>
      <div class="gauge"><div><b>11</b>/100<span>"Low risk"</span></div><div><b>3 of 4</b><span>risk signals "Not available"</span></div></div>
    </div></div>`;
  },
  shots:[["property-analyzer-1","Dashboard after the run — note the concatenated address field"],["property-analyzer-2","Full intelligence report"]],
  good:["Surfaces Kittitas County's four special-purpose tax districts automatically.","Shows which skills ran (geocoding, places, property, tax, timezone) as chips under the input."],
  watch:["The address field kept the previous sample (1600 Pennsylvania Ave) and appended mine, so the agent analyzed both properties in one report.","A confident \"11 / Low risk\" score is shown while flood, seismic and crime all read \"Not available.\""]
},
{
  title:"GeoTAX", kind:"App", place:"Ellensburg City Hall",
  headline:"100%", headlineSub:"rooftop match confidence",
  prompt:`<b>501 N Anderson St, Ellensburg, WA 98926</b> · Essentials + Premium · $5,000 transaction`,
  actions:["Streets data geocode","Master Location Data","Tax rate match","Jurisdiction layers"],
  body(){
    const g=D.geotax;
    return `<div class="cols"><div>
      <div class="calc">
        <label for="amt"><span>Transaction amount</span><span id="amtV">$5,000</span></label>
        <input id="amt" type="range" min="100" max="50000" step="100" value="5000" aria-describedby="amtNote">
        <div class="stackbar" aria-hidden="true"><span style="width:${6.5/8.6*100}%;background:var(--ink)"></span><span style="width:${2.1/8.6*100}%;background:var(--accent)"></span></div>
        <div class="legend"><span><i style="background:var(--ink)"></i>State 6.5%</span><span><i style="background:var(--accent)"></i>Municipal 2.1%</span><span><i style="background:var(--offset);border:1px solid var(--line-strong)"></i>County 0%</span></div>
        <div class="total"><span>State <b id="tS" style="font-size:var(--text-base)">$325.00</b></span><span>City <b id="tM" style="font-size:var(--text-base)">$105.00</b></span><span>Total tax <b id="tT">$430.00</b></span></div>
        <p class="panel__note" id="amtNote">Rates returned by GeoTAX for this rooftop; drag to recalculate.</p>
      </div>
      <div class="label">Jurisdiction layers</div>
      <table class="table"><thead><tr><th>Layer</th><th>Name</th><th class="num">FIPS</th></tr></thead><tbody>${g.layers.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="num">${r[2]}</td></tr>`).join('')}</tbody></table>
    </div><div>
      <div class="map map--sm" id="mapGeo" role="img" aria-label="Map of the GeoTAX and site-selection points in Ellensburg"></div>
      <div class="label">Freshness flags</div>${chips(g.freshness,'chip')}
      <p class="panel__note">Orange: City Hall (GeoTAX). Teal: 201 E University Way (site-selection stop). Census block ${g.block}. The "Annexed May 2026" flag means the boundary changed recently — exactly when a stale tax table would get it wrong.</p>
    </div></div>`;
  },
  after(){
    const r=D.geotax.rates; const a=$('#amt');
    const f=v=>'$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    const up=()=>{const v=+a.value; $('#amtV').textContent='$'+fmt(v); $('#tS').textContent=f(v*r.state/100); $('#tM').textContent=f(v*r.municipal/100); $('#tT').textContent=f(v*(r.state+r.municipal)/100);};
    a.addEventListener('input',up); up();
    mkMap('mapGeo',[[D.geotax.lat,D.geotax.lon,'City Hall · GeoTAX','#b43d0c'],[D.rei.lat,D.rei.lon,'201 E University Way · site selection','#0f766e']],15);
  },
  shots:[["geotax-1","Geocode, jurisdiction layers and freshness"],["geotax-2","Sales and use tax breakdown"]],
  good:["Rooftop geocode, FIPS layers and census block in one lookup.","Jurisdiction freshness with annexation date is a real differentiator for tax teams."],
  watch:["Footer copy says it \"retrieves property tax information\" — the results are sales and use tax."]
},
{
  title:"Real Estate Intelligence: Commercial", kind:"App", place:"Ellensburg, Washington",
  headline:"Live + Sample", headlineSub:"labeled side by side",
  prompt:`Site: <b>201 E University Way, Ellensburg, WA 98926</b> · 90-day lookback`,
  actions:["precisely_geocoding","precisely_data_graph","precisely_places","precisely_property_risk"],
  body(){
    const r=D.rei;
    return `<div class="label">Overview strip (as shown in the app)</div>
    <div class="tablewrap"><table class="table"><thead><tr><th>Metric</th><th>Value</th><th>Source</th></tr></thead><tbody>${r.kpis.map(k=>`<tr><td>${k[0]}</td><td>${k[1]}</td><td><span class="pill pill--${k[2]}">${k[2]}</span></td></tr>`).join('')}</tbody></table></div>
    <div class="cols" style="margin-top:var(--space-4)"><div>
      <div class="label">Site from the Data Graph · ${esc(r.pid)}</div>${facts(r.site)}
    </div><div>
      <div class="label">Risk and insurance (live)</div>${facts(r.risk)}
      <div class="label">Neighborhood segment</div><p style="font-size:var(--text-sm)">${esc(r.psyte)}</p>
    </div></div>`;
  },
  shots:[["rei-commercial-1","Overview strip with live and sample badges"],["rei-commercial-2","Site details, places and risk"],["rei-commercial-3","Demographics and foot traffic"]],
  good:["Every panel is badged Live or Sample, so you can tell real data from filler.","PSYTE segment, crime index and parcel APN come straight from the Data Graph."],
  watch:["No PlaceIQ foot-traffic coverage in a small town, so the eye-catching KPIs (+59.9% YoY visits) are sample data. Easy to misread in a screenshot."]
},
{
  title:"Fleet Commander", kind:"App", place:"Chicago sample fleet",
  headline:"2 of 8", headlineSub:"bad addresses caught pre-dispatch",
  prompt:`City: <b>Chicago</b> · Drivers: <b>all 4</b> · Stops: <b>all 8</b> → Run fleet analysis`,
  actions:["Address verification","Route optimization","Service coverage","Mission brief"],
  body(){
    const f=D.fleet;
    return `<div class="cols"><div>
      <div class="map" id="mapFleet" role="img" aria-label="Map of optimized delivery stops in Chicago, colored by driver"></div>
      <p class="panel__note">Stops plotted from the agent's verified coordinates, colored by route. Fleet total ${esc(f.total)}.</p>
    </div><div>
      <div class="label">Routes</div>
      <table class="table"><thead><tr><th>Driver</th><th class="num">Stops</th><th class="num">km</th><th class="num">ETA</th></tr></thead><tbody>${f.routes.map(r=>`<tr><td><span class="swatch" style="background:${r.color}"></span>${r.id} · ${r.driver}</td><td class="num">${r.stops.length}</td><td class="num">${r.km}</td><td class="num">${r.eta}</td></tr>`).join('')}</tbody></table>
      <div class="label">Typos fixed before the truck left</div>
      ${f.fixes.map(x=>`<div class="vrow"><span class="c">${Math.round(x[2]*100)}</span><div><s style="color:var(--bad)">${esc(x[0])}</s><div class="o">${esc(x[1])}</div></div></div>`).join('')}
    </div></div>`;
  },
  after(){
    const pts=[]; D.fleet.routes.forEach(r=>r.stops.forEach((s,i)=>pts.push([s[1],s[2],`${r.id}${i+1} · ${s[0]}${s[3]?' (corrected)':''}`,r.color,`${r.id}${i+1}`])));
    mkMap('mapFleet',pts,12,D.fleet.routes);
  },
  shots:[["fleet-routes","Routes and coverage map in the app"],["fleet-map","Full agent output"]],
  good:["Catches \"Chcago\" and \"Michgan\" and corrects them to ZIP+4 before routing.","One click gives per-driver ETAs, a coverage map and a mission brief."],
  watch:["The \"+23% efficiency\" badge has no stated baseline, so it can't be checked."]
},
{
  title:"Network Build Prioritization", kind:"Agent", place:"Colorado Front Range",
  headline:"36,379", headlineSub:"premises within a 2-mile drive (Denver)",
  prompt:`Rank these candidate fiber build sites by <b>serviceable premises within a 2-mile drive</b>, and give households now and in 5 years: Longmont, Denver, Brighton.`,
  actions:["geo_addressing.geocode ×3","routing.reachable_area ×3","spatial.aggregate_statistics ×6"],
  body(){
    return `<div class="seg" role="group" aria-label="Rank by"><button aria-pressed="true" data-m="premises">Premises today</button><button aria-pressed="false" data-m="hhg">5-yr household growth</button></div>
      <div id="netBars"></div>
      <div class="tablewrap" style="margin-top:var(--space-4)"><table class="table"><thead><tr><th>Site</th><th class="num">Households</th><th class="num">In 5 yrs</th><th class="num">Population</th><th class="num">In 5 yrs</th></tr></thead><tbody>${D.network.map(n=>`<tr><td>${n.site}</td><td class="num">${fmt(n.hh)}</td><td class="num">${fmt(n.hh5)}</td><td class="num">${fmt(n.pop)}</td><td class="num">${fmt(n.pop5)}</td></tr>`).join('')}</tbody></table></div>
      <p class="panel__note">Flip the ranking: Brighton is last on today's premises but first on forecast growth (+8.1% households). The agent called this out unprompted.</p>`;
  },
  after(){
    const draw=m=>{
      const arr=[...D.network].sort((a,b)=>b[m]-a[m]); const max=Math.max(...arr.map(a=>a[m]));
      $('#netBars').innerHTML=arr.map(n=>`<div class="hbar"><span>${n.site}</span><div class="hbar__track"><div class="hbar__fill" style="width:${n[m]/max*100}%;background:${m==='hhg'?'var(--teal)':'var(--accent)'}"></div></div><span class="hbar__v" style="min-width:56px">${m==='hhg'?'+'+n.hhg+'%':fmt(n.premises)}</span></div>`).join('');
      document.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===m));
    };
    document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>draw(b.dataset.m)));
    draw('premises');
  },
  shots:[["agent-network","Agent ranking in the catalog page"]],
  good:["Real drive-distance bands (road network, not radius circles) with 5-year forecasts.","Explains its method: premises are address counts; households are block-group weighted."],
  watch:["Only sample prompts run on the catalog page — custom sites need the MCP connector or a build kit."]
},
{
  title:"Data Quality Boost", kind:"App", place:"Insurance policies sample",
  headline:"+22", headlineSub:"quality points in 23 seconds",
  prompt:`Dataset: <b>Policies</b> (320 records, 14 columns) → Run quality analysis → accept AI fixes → Build pipeline`,
  actions:["Profile","Score","Recommend fixes","Build & run pipeline (4 operators)"],
  body(){
    const q=D.dq;
    return `<div class="dqscore"><span class="big">${q.before}</span><span class="arrow" aria-hidden="true">→</span><span class="big" style="color:var(--teal)">${q.after}</span><span class="delta">+${q.after-q.before} points</span><span style="font-size:var(--text-sm);color:var(--muted)">${q.improved} of ${q.rows} records improved · ${q.dupGroups} duplicate groups (${q.dupRows} rows) merged</span></div>
      <div class="legend" style="margin-bottom:var(--space-3)"><span><i style="background:#c9a28e"></i>Before</span><span><i style="background:var(--teal)"></i>After</span></div>
      ${q.cols.map(c=>`<div class="dqbar"><span>${c[0]}</span><div class="dqbar__track"><div class="dqbar__a" style="width:0" data-w="${c[2]}"></div><div class="dqbar__b" style="width:0" data-w="${c[1]}"></div></div><span class="dqbar__v">${c[1].toFixed(1)} → ${c[2].toFixed(1)}</span></div>`).join('')}
      <div class="label">The two fixes the AI chose</div>
      <ul style="margin:0;padding-left:1.1em;font-size:var(--text-sm)"><li>Merge 7 exact-duplicate policyholder groups into golden records.</li><li>Rewrite all ten date columns (20+ formats each) to ISO YYYY-MM-DD; blank what can't be parsed.</li></ul>`;
  },
  after(){ setTimeout(()=>document.querySelectorAll('.dqbar__a,.dqbar__b').forEach(e=>e.style.width=e.dataset.w+'%'),60); },
  shots:[["dq-analysis","Profile: 69/100 with 11 issues"],["dq-remediation","AI-recommended fixes"],["dq-results","Before and after by column"]],
  good:["No rules to write: profile, fixes and pipeline are generated and run end to end.","Column-level before/after makes the score change auditable."],
  watch:["The profile's Invalid count is 0 even for columns full of \"not-a-date\" and \"pending\".","Payment and review dates stall around 66–73 because unparseable values are blanked, not recovered."]
},
{
  title:"Address Verification & Quality", kind:"Agent", place:"Five mixed addresses",
  headline:"2 flagged", headlineSub:"below an 80% threshold",
  prompt:`Check these 5 addresses and <b>flag any below 80% confidence</b>: 1 Microsoft Way… 742 Evergreen Terrace… 350 5th Ave… 123 mane st chicgo il… 1600 Pennsylvania Ave NW…`,
  actions:["geo_addressing.verify_address ×5 (parallel)"],
  body(){
    return `<div class="thresh"><label for="th"><span>Flag threshold</span><span id="thV">80%</span></label><input id="th" type="range" min="50" max="100" value="80"><p class="panel__note" id="thN"></p></div><div id="vlist"></div>
      <div class="label">Separate runs on the same platform</div>
      ${facts([["Address Quality agent","\"123 mane st chicgo il\" → Grade D, 68 — resolved to Niles, IL, not Chicago"],["Contact Enrichment agent","Email check for temp@mailinator.com failed — verification.emails isn't enabled on this trial"]])}`;
  },
  after(){
    const t=$('#th');
    const draw=()=>{const v=+t.value; $('#thV').textContent=v+'%'; let n=0;
      $('#vlist').innerHTML=D.verify.map(a=>{const f=a.conf<v; if(f)n++; return `<div class="vrow ${f?'flag':''}"><span class="c">${a.conf}</span><div>${esc(a.input)} ${f?'<span class="pill pill--bad">flagged</span>':'<span class="pill pill--ok">pass</span>'}<div class="o">${esc(a.out)}</div></div></div>`}).join('');
      $('#thN').textContent=`${n} of ${D.verify.length} addresses fall below ${v}%.`;};
    t.addEventListener('input',draw); draw();
  },
  shots:[["agent-addrverify","Verification report"],["agent-addrquality","Address Quality grade D"],["agent-contact","Contact Enrichment entitlement gap"]],
  good:["Honest about uncertainty: it refuses to output a cleansed address on a street-level-only match.","Parallel tool calls keep a five-address batch fast."],
  watch:["A sample prompt on the Contact Enrichment page fails on the trial because the email action isn't licensed.","\"chicgo\" lands in Niles, IL — flagged correctly, but a surprising default."]
}
];

const RATINGS={"Underwriting Risk Assessor": [5, 5, 4, 5], "Property Analyzer": [3, 4, 2, 4], "GeoTAX": [4, 4, 5, 5], "Real Estate Intelligence: Commercial": [4, 4, 3, 3], "Fleet Commander": [5, 4, 4, 5], "Network Build Prioritization": [4, 5, 5, 3], "Data Quality Boost": [5, 4, 4, 5], "Address Verification & Quality": [3, 3, 5, 3]};
/* rail */
const rail=$('#rail');
rail.innerHTML=stops.map((s,i)=>`<li><button data-i="${i}"><span class="n">${String(i+1).padStart(2,'0')}</span><span class="t">${esc(s.title)}<span class="k">${s.kind} · ${esc(s.place)}</span></span></button></li>`).join('');
rail.addEventListener('click',e=>{const b=e.target.closest('button'); if(b) go(+b.dataset.i, true)});

let cur=0;
function go(i, focusStage){
  cur=Math.max(0,Math.min(stops.length-1,i));
  maps.forEach(m=>m.remove()); maps=[];
  const s=stops[cur];
  $('#stage').innerHTML=`<article class="stop" aria-labelledby="stopTitle">
    <div class="stop__head"><div>
      <div class="stop__meta"><span class="tag ${s.kind==='Agent'?'tag--agent':''}">${s.kind}</span><span class="tag tag--place">${esc(s.place)}</span></div>
      <h3 id="stopTitle" tabindex="-1">${esc(s.title)}</h3></div>
      <div class="headline">${esc(s.headline)}<small>${esc(s.headlineSub)}</small></div>
    </div>
    <div class="prompt">${s.prompt}</div>
    <div class="label">Platform actions called</div>${chips(s.actions)}
    <div class="body">${s.body()}</div>
    <div class="verdict"><div class="good"><h4>Standout</h4><ul>${s.good.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></div><div class="watch"><h4>Watch for</h4><ul>${s.watch.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></div></div>
    <div class="label">Evidence from the live run</div>
    <div class="evidence">${s.shots.map(([f,c])=>`<button class="thumb" data-src="assets/${f}.webp" data-cap="${esc(c)}"><img src="assets/${f}.webp" alt="Screenshot: ${esc(c)}" loading="lazy" width="180" height="97"><span>${esc(c)}</span></button>`).join('')}</div>
  </article>`;
  setTimeout(()=>document.querySelectorAll('#stage .hbar__fill[data-w]').forEach(e=>e.style.width=e.dataset.w+'%'),60);
  if(s.after) s.after();
  rail.querySelectorAll('button').forEach((b,j)=>{ if(j===cur){b.setAttribute('aria-current','step'); if(window.innerWidth<960) b.scrollIntoView({inline:'center',block:'nearest'});} else b.removeAttribute('aria-current'); });
  $('#stopNum').textContent=cur+1;
  $('#progressBar').style.width=((cur+1)/stops.length*100)+'%';
  $('#prevBtn').disabled=cur===0; $('#nextBtn').disabled=cur===stops.length-1;
  try{ history.replaceState(null,'','#stop-'+(cur+1)); }catch(_){}
  if(focusStage){ $('#stopTitle').focus({preventScroll:true}); const top=$('#tour').getBoundingClientRect().top; if(top<-40||top>200) $('#tour').scrollIntoView({behavior:'smooth'}); }
}
$('#prevBtn').addEventListener('click',()=>go(cur-1,true));
$('#nextBtn').addEventListener('click',()=>go(cur+1,true));
document.addEventListener('keydown',e=>{
  if(!$('#lightbox').hidden){ if(e.key==='Escape') closeLB(); return; }
  if(e.target.matches('input,textarea')) return;
  const r=$('#tour').getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return;
  if(e.key==='ArrowRight') go(cur+1,false); if(e.key==='ArrowLeft') go(cur-1,false);
});

/* maps */
function mkMap(id, pts, zoom, routes){
  if(!window.L) { $('#'+id).innerHTML='<p style="padding:1rem;font-size:.875rem;color:var(--muted)">Map unavailable offline.</p>'; return; }
  const m=L.map(id,{scrollWheelZoom:false,attributionControl:true,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);
  const b=[];
  if(routes) routes.forEach(r=>{ if(r.stops.length>1) L.polyline(r.stops.map(s=>[s[1],s[2]]),{color:r.color,weight:3,opacity:.8,dashArray:'6 6'}).addTo(m); });
  pts.forEach(p=>{
    const icon=L.divIcon({className:'',html:`<div class="mk" style="background:${p[3]}">${p[4]||''}</div>`,iconSize:[26,26],iconAnchor:[13,13]});
    L.marker([p[0],p[1]],{icon,title:p[2]}).addTo(m).bindPopup(esc(p[2])); b.push([p[0],p[1]]);
  });
  if(b.length>1) m.fitBounds(b,{padding:[30,30],maxZoom:zoom}); else m.setView(b[0],zoom);
  maps.push(m); setTimeout(()=>{ if(maps.includes(m)) m.invalidateSize(false); },120);
}

/* lightbox */
const lb=$('#lightbox'); let lastFocus=null;
document.addEventListener('click',e=>{const t=e.target.closest('.thumb'); if(!t) return; lastFocus=t; $('#lbImg').src=t.dataset.src; $('#lbImg').alt=t.dataset.cap; $('#lbCap').textContent=t.dataset.cap; lb.hidden=false; $('#lbClose').focus();});
function closeLB(){lb.hidden=true; if(lastFocus) lastFocus.focus();}
$('#lbClose').addEventListener('click',closeLB);
lb.addEventListener('click',e=>{if(e.target===lb) closeLB();});

/* review lists */
const cool=[
  ["Underwriting in one sentence","13 live data actions — flood, wildfire, quake, roof imagery, fire-station drive time, 911 center — from one prompt."],
  ["Self-driving data cleanup","Data Quality Boost profiles, picks fixes and runs a pipeline: 69 → 91 with no rules written."],
  ["Tax jurisdiction with freshness","GeoTAX flags a May 2026 annexation alongside rooftop geocode and FIPS layers."],
  ["Every asset is a build kit","\"Try with LLM\" hands Claude Code or Copilot a spec to rebuild the app on your own model and the Precisely MCP."],
  ["Drive-time market sizing","Network Build ranks fiber sites by premises in real road-network bands, with 5-year forecasts."],
  ["Transparent processing","Each agent answer ends by listing the exact platform actions it called — useful for audit trails."]
];
$('#coolList').innerHTML=cool.map(([t,d])=>`<li><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join('');
const issues=[
  ["Property Analyzer","Input isn't cleared between runs","My address was appended to the prior sample, and the agent quietly analyzed both."],
  ["Property Analyzer","Confident score on missing data","\"11 / Low risk\" displays while 3 of 4 risk signals are unavailable."],
  ["Contact Enrichment","Sample prompt fails on trial","Email verification isn't licensed in the trial workspace, though the catalog advertises it."],
  ["Real Estate: Commercial","Sample KPIs sit beside live ones","Badged correctly, but +59.9% YoY visits is sample data for this site."],
  ["Underwriting","Conflicting roof material","Assessor says metal, imagery says shingle; no reconciliation."],
  ["Data Quality Boost","Profile undercounts invalids","\"Invalid\" shows 0 for columns of not-a-date strings."],
  ["Fleet Commander","Unexplained efficiency badge","\"+23%\" has no stated baseline."],
  ["Agents catalog","Sample-only Try tab","Custom prompts require the MCP connector or a build kit."],
  ["Account","No credit ceiling shown","Usage is split by area with no total or remaining balance."]
];
$('#issueList').innerHTML=issues.map(([w,t,d])=>`<li><span class="where">${esc(w)}</span><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join('');
const cmax=Math.max(...D.credits.map(c=>c.v));
$('#creditBars').innerHTML=D.credits.map(c=>`<div class="hbar"><span>${c.k}</span><div class="hbar__track"><div class="hbar__fill" style="width:${c.v/cmax*100}%;background:var(--ink)"></div></div><span class="hbar__v">${fmt(c.v)}</span></div>`).join('')+`<p class="panel__note">Total ≈ ${fmt(Math.round(total))} credits for the ten runs. Data Quality's 320 credits match the 320 rows processed.</p>`;

/* build steps */
const steps=[
  ["Generate an API key","Account → MCP Set Up → Generate API key. The key and secret display once. This workspace already has 1 of 2 keys in use, and the usage page tracks credits by product area.","SHOTS"],
  ["Register the connector (Claude Code)","Run once per machine; saved to ~/.claude.json so every project sees it. Region is US1 · Northern Virginia.",`claude mcp add --transport http --scope user precisely https://api.cloud.precisely.com/mcp --header "Authorization: Apikey <your-token>"`],
  ["Test the connection","Paste this into your AI client. The answer proves the MCP server is reachable and its tools are listed.",`List the tools available from the precisely MCP server, then use them to verify this address: 1700 District Ave, Burlington, MA 01803`],
  ["Rebuild an app from its kit","Download any app's build kit, open the folder in Claude Code, and paste the setup sentence. It asks for your stack and model provider, then stops for credentials.",`Read BUILD.md in this folder and follow its Prepare section for Property Analyzer. Ask me which implementation stack, model provider (bedrock, anthropic, openai, google, azure-openai), model ID, and credential option to use, and wait for my answer. Then set up the project, .gitignore, .env.example, and .env.local, and stop at the runtime-credentials checkpoint.`]
];
$('#steps').innerHTML=steps.map(([t,d,c])=>`<li><h3>${esc(t)}</h3><p>${esc(d)}</p>${c==='SHOTS'?`<div class="evidence evidence--dark"><button class="thumb" data-src="assets/account-mcp-setup.webp" data-cap="MCP Set Up page: clients, region, and API keys"><img src="assets/account-mcp-setup.webp" alt="Screenshot: MCP Set Up page" loading="lazy" width="180" height="97"><span>MCP Set Up page</span></button><button class="thumb" data-src="assets/account-usage.webp" data-cap="Usage metrics: trial credits by product area"><img src="assets/account-usage.webp" alt="Screenshot: usage metrics page" loading="lazy" width="180" height="97"><span>Usage metrics</span></button></div>`:c?`<div class="code"><button class="copy" data-c="${esc(c)}">Copy</button>${esc(c)}</div>`:''}</li>`).join('');
document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',async()=>{
  try{ await navigator.clipboard.writeText(b.dataset.c); b.textContent='Copied'; }
  catch{ const r=document.createRange(); r.selectNodeContents(b.parentElement); const s=getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent='Selected'; }
  setTimeout(()=>b.textContent='Copy',1600);
}));

go(0,false);

/* deep link */
const m0=INIT_HASH.match(/^#stop-(\d)$/);
if(m0){ go(+m0[1]-1,false); setTimeout(()=>$('#tour').scrollIntoView(),50); }
$('#copyLink').addEventListener('click',async()=>{
  const url=location.href.split('#')[0]+'#stop-'+(cur+1); const btn=$('#copyLink');
  try{ await navigator.clipboard.writeText(url); btn.textContent='link copied'; }catch(_){ btn.textContent='#stop-'+(cur+1); }
  setTimeout(()=>btn.textContent='copy link to this stop',1800);
});

/* presenter mode */
const DWELL=12000; let timer=null, t0=0, raf=0;
const bar=$('#playBar'), pb=$('#playBtn');
function tick(){ const p=Math.min(1,(performance.now()-t0)/DWELL); bar.style.width=(p*100)+'%'; if(p>=1){ if(cur>=stops.length-1){ stopPlay(); return; } go(cur+1,false); t0=performance.now(); } raf=requestAnimationFrame(tick); }
function startPlay(){ if(cur>=stops.length-1) go(0,false); t0=performance.now(); pb.setAttribute('aria-pressed','true'); pb.textContent='❚❚ Pause'; pb.setAttribute('aria-label','Pause presenter mode'); $('#tour').scrollIntoView({behavior:'smooth'}); raf=requestAnimationFrame(tick); timer=true; }
function stopPlay(){ cancelAnimationFrame(raf); timer=null; bar.style.width='0'; pb.setAttribute('aria-pressed','false'); pb.textContent='▶ Present'; pb.setAttribute('aria-label','Start presenter mode'); }
pb.addEventListener('click',()=>timer?stopPlay():startPlay());
['prevBtn','nextBtn'].forEach(id=>$('#'+id).addEventListener('click',()=>{ if(timer) t0=performance.now(); }));
rail.addEventListener('click',()=>{ if(timer) stopPlay(); });
$('#stage').addEventListener('pointerdown',()=>{ if(timer) stopPlay(); });
document.addEventListener('keydown',e=>{ if(e.target.matches('input,textarea')||!$('#lightbox').hidden) return; if(e.key==='p'||e.key==='P'){ timer?stopPlay():startPlay(); } });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&timer) stopPlay(); });

/* scorecard */
const crit=[['Wow factor','How impressive it is in a live demo'],['Data depth','How much useful data one run returns'],['Trustworthiness','Accuracy and honesty about gaps'],['Trial-ready','Works fully on the trial as shipped']];
let sortCol=-1, sortDir=-1;
function dots(n){ return `<span class="dots" role="img" aria-label="${n} of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`; }
function drawScore(){
  let rows=stops.map((s,i)=>({i,s,r:RATINGS[s.title],t:RATINGS[s.title].reduce((a,b)=>a+b,0)}));
  if(sortCol>=0) rows.sort((x,y)=>{ const d=(sortCol===4?y.t-x.t:y.r[sortCol]-x.r[sortCol])*(-sortDir); return d||x.i-y.i; });
  const th=(lbl,idx,title)=>`<th class="${idx>=0?'num':''}" ${idx>=0?`aria-sort="${sortCol===idx?(sortDir<0?'descending':'ascending'):'none'}"`:''}>${idx>=0?`<button class="sortbtn" data-c="${idx}" title="${esc(title)}">${lbl}${sortCol===idx?(sortDir<0?' ↓':' ↑'):''}</button>`:lbl}</th>`;
  $('#scoreTable').innerHTML=`<thead><tr>${th('Stop',-1)}${crit.map((c,i)=>th(c[0],i,c[1])).join('')}${th('Total',4,'Sum of all four, out of 20')}</tr></thead><tbody>${rows.map(x=>`<tr tabindex="0" data-i="${x.i}"><td><span class="tag ${x.s.kind==='Agent'?'tag--agent':''}">${x.s.kind}</span> <b>${esc(x.s.title)}</b></td>${x.r.map(v=>`<td class="num">${dots(v)}</td>`).join('')}<td class="num"><b class="tot">${x.t}</b><span class="of">/20</span></td></tr>`).join('')}</tbody>`;
  $('#scoreTable').querySelectorAll('.sortbtn').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); const c=+b.dataset.c; if(sortCol===c) sortDir*=-1; else { sortCol=c; sortDir=-1; } drawScore(); $('#scoreTable .sortbtn[data-c="'+c+'"]').focus(); }));
  $('#scoreTable').querySelectorAll('tbody tr').forEach(tr=>{ const f=()=>{ go(+tr.dataset.i,false); $('#tour').scrollIntoView({behavior:'smooth'}); }; tr.addEventListener('click',f); tr.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); f(); } }); });
}
drawScore();

})();
