// All values below were observed in live runs on precisely.ai (trial workspace, US1), Nov 7, 2026.
window.DEMO = {
  catalog: {
    apps: ["Data Quality Boost", "Fleet Commander", "GeoTAX", "Property Analyzer", "Real Estate Intelligence: Commercial", "Data Graph Enrich"],
    agents: ["Address Quality", "Address Verification", "Contact Enrichment", "Duplicate Rule Finder", "Logistics Optimizer", "Network Build Prioritization", "Real Estate Intelligence", "Underwriting Risk Assessor"],
    skills: ["Address Parsing", "Address Verification", "Business Term Linkage", "Contact Validation", "Data Quality Rules", "Emergency Services", "Data Quality Hotspots", "Geocoding", "Geolocation", "Places Discovery", "Property Intelligence", "Route Planning", "Semantic Model Tagging", "Service Area Market", "Spatial Risk", "Tax Jurisdiction", "Timezone", "Travel Analysis"]
  },
  credits: [
    { k: "Spatial Analytics", v: 617.07 },
    { k: "Data Enrichment", v: 393 },
    { k: "Data Quality", v: 320 },
    { k: "Geo Addressing", v: 131 },
    { k: "Spatial Routing", v: 11 }
  ],
  underwriting: {
    address: "42 Valley of the Sun Dr, Fairplay, CO 80440",
    actions: ["geo_addressing.verify_address", "property.attributes", "property.roof_attributes", "property.structure", "property.replacement_cost", "property.vegetation_proximity", "risk.flood", "risk.wildfire", "risk.earthquake", "risk.coastal", "risk.fire_station", "risk.weather", "emergency.services"],
    facts: [
      ["Match confidence", "89 · deliverable"],
      ["Built", "2016 · 2 stories · 1,928 sq ft"],
      ["Replacement cost", "$419,411 (high confidence)"],
      ["2025 market value", "$759,994"],
      ["Elevation", "11,448 ft"],
      ["FEMA zone", "X (minimal) · panel 08093C0500C"],
      ["Nearest fire station", "8.36 mi · ~20–22 min · mostly volunteer"],
      ["911 PSAP", "Park County Communications Center (FCC 1240)"]
    ],
    wildfire: [
      ["Address-to-road distance", 49],
      ["Fire station distance", 50],
      ["Structure density", 47],
      ["Crown fire", 44],
      ["Design wind speed", 44],
      ["Topography", 42],
      ["Mitigation difficulty", 42],
      ["Ember cast (extreme)", 42],
      ["Ember ignition (extreme)", 45]
    ],
    overall: { baseline: 30, extreme: 36 }
  },
  property: {
    address: "400 E University Way, Ellensburg, WA 98926",
    label: "Central Washington University campus",
    facts: [
      ["Property type", "Governmental / public use — commercial"],
      ["Lot size", "0.16 acres (6,978 sq ft)"],
      ["Assessed value", "$100 (nominal, tax-exempt state parcel)"],
      ["Tax jurisdiction", "Ellensburg, Kittitas County, WA"],
      ["Combined sales tax", "8.6% (6.5% state + 2.1% municipal)"],
      ["Special districts", "4 (TBD, housing, mental health, emergency comms)"],
      ["Timezone", "America/Los_Angeles"],
      ["Address quality", "89 / 100"]
    ],
    pois: ["CWU Gym", "Black Hall", "CWU Career Services", "CWU Business", "Freshëns", "1891 Bistro"]
  },
  geotax: {
    address: "501 N Anderson St, Ellensburg, WA 98926-3147",
    lat: 46.996818, lon: -120.542026,
    layers: [["State", "WA", "53"], ["County", "Kittitas", "037"], ["Place", "Ellensburg", "21240"]],
    rates: { state: 6.5, county: 0, municipal: 2.1 },
    block: "530379756001020",
    freshness: ["Verified Jun 2026", "Annexed May 2026"]
  },
  rei: {
    address: "201 E University Way, Ellensburg, WA 98926",
    lat: 46.999932, lon: -120.544676,
    pid: "P0000OE7VD9A",
    kpis: [
      ["Visits total", "No data", "live"],
      ["Unique visitors", "No data", "live"],
      ["Avg dwell (min)", "52.10", "sample"],
      ["YoY visits", "+59.9%", "sample"],
      ["Avg frequency", "1.98", "sample"],
      ["Trade area reach", "13.14 mi", "sample"]
    ],
    site: [["Land use", "Retail store"], ["Year built", "1981"], ["Building", "2,448 sq ft"], ["APN", "18-18-35057-0715"], ["Place found", "Central Market & Smoke Shop (grocery)"]],
    risk: [["Flood", "Moderate"], ["Storm / wind", "Low"], ["Wildfire", "Minimal"], ["Earthquake", "High"], ["Crime index", "Above average (national 128)"]],
    psyte: "Hometown Singles · 08.2 — young, single-family, urban block"
  },
  fleet: {
    total: "38.8 km · 99 min · last ETA 8:06 AM",
    efficiency: "+23%",
    routes: [
      { id: "A", driver: "Marcus Johnson", km: 4.1, min: 14, eta: "7:44", color: "#c2410c",
        stops: [["Willis Tower Cafe", 41.878908, -87.635489], ["Michigan Ave Pharmacy", 41.886247, -87.624959, "corrected"]] },
      { id: "B", driver: "Sarah Chen", km: 14.2, min: 36, eta: "8:06", color: "#0f766e",
        stops: [["Navy Pier Gift Shop", 41.891689, -87.608341], ["Gold Coast Wellness", 41.899262, -87.625262], ["Lakeshore Coffee", 41.908099, -87.626488, "corrected"]] },
      { id: "C", driver: "Luis Rivera", km: 12.2, min: 28, eta: "7:58", color: "#1d4ed8",
        stops: [["Wrigley Field Sports", 41.947639, -87.656371], ["Lincoln Park Pharmacy", 41.924564, -87.635869]] },
      { id: "D", driver: "Priya Patel", km: 8.3, min: 21, eta: "7:51", color: "#a16207",
        stops: [["Wicker Park Cafe", 41.907922, -87.673152]] }
    ],
    fixes: [
      ["1400 N Lakeshore Dr, Chcago, IL 60610", "1400 N LAKE SHORE DR, CHICAGO, IL 60610-1674", 0.88],
      ["200 N Michgan Ave, Chicago, IL 60601", "200 N MICHIGAN AVE, CHICAGO, IL 60601-5909", 0.93]
    ]
  },
  network: [
    { site: "2755 N Milwaukee St, Denver", premises: 36379, hh: 25428, hh5: 26815, hhg: 5.5, pop: 52909, pop5: 54630, popg: 3.3 },
    { site: "300 Main St, Longmont", premises: 15409, hh: 10673, hh5: 11096, hhg: 4.0, pop: 25326, pop5: 25649, popg: 1.3 },
    { site: "500 S 4th Ave, Brighton", premises: 9919, hh: 6714, hh5: 7255, hhg: 8.1, pop: 19213, pop5: 20349, popg: 5.9 }
  ],
  dq: {
    before: 69, after: 91, seconds: 23, rows: 320, improved: 313, dupGroups: 7, dupRows: 14,
    cols: [
      ["Quote_Date", 43.75, 100], ["Application_Date", 43.88, 100], ["Effective_Date", 46.5, 100], ["Expiration_Date", 47.5, 100],
      ["Next_Payment_Date", 36.63, 73.35], ["Underwriting_Date", 35.75, 71.05], ["Last_Payment_Date", 34.75, 69.14],
      ["Inspection_Date", 37.75, 71.25], ["Renewal_Date", 35.88, 68.95], ["Last_Reviewed_Date", 35.38, 66.07]
    ]
  },
  verify: [
    { input: "1 Microsoft Way, Redmond WA 98052", conf: 100, out: "1 MICROSOFT WAY, REDMOND WA 98052-8300" },
    { input: "350 5th Ave, NY NY 10118", conf: 95, out: "350 5TH AVE, NEW YORK NY 10118-0110" },
    { input: "1600 Pennsylvania Ave NW, Washington DC", conf: 89, out: "1600 PENNSYLVANIA AVE NW, WASHINGTON DC 20502-0001" },
    { input: "742 Evergreen Terrace, Springfield IL", conf: 79, out: "Street-level only — closest: EVERGREEN CT, Springfield IL 62704" },
    { input: "123 mane st chicgo il", conf: 68, out: "Street-level only — best match W MAIN ST, NILES IL 60714" }
  ]
};
