// Sample community data for a concept prototype. People, companies and sponsors are fictional.
// Catalog asset names are the real Precisely AI Studio skills/agents/apps observed Nov 7, 2026.
window.BC = {
  me: { id: "u-you", name: "You", handle: "you", level: 1, persona: "no-code" },

  viberant: [
    { k: "V", name: "Verified", plain: "We test it with your own examples before anyone else sees it.", auto: "Golden-example tests generated from 3 sample inputs you give" },
    { k: "I", name: "Infrastructure, handled", plain: "One click to run. Every change is saved and can be undone.", auto: "Versioned config, one-click environments, rollback" },
    { k: "B", name: "Built on certified parts", plain: "You assemble from parts Precisely and partners already trust.", auto: "Only certified skills and templates; pinned versions" },
    { k: "E", name: "End-to-end safe", plain: "Private data stays private. It only touches what you allow.", auto: "PII guard, least-privilege data scopes, policy gates" },
    { k: "R", name: "Reliable", plain: "If a data source hiccups, it says so instead of guessing.", auto: "Retries, fallbacks, sample-vs-live labels, rate limits" },
    { k: "A", name: "Well-architected", plain: "You see the cost before it runs. No surprise bills.", auto: "Credit budget, cost preview, well-architected checks" },
    { k: "N", name: "No area missed", plain: "It writes its own instructions and tells you who owns it.", auto: "Auto docs, logs, owner + runbook, accessibility check" },
    { k: "T", name: "Trusted", plain: "Every answer shows where it came from. A human approves anything sent outside.", auto: "Evidence bundle, provenance, audit log, human approval gates" }
  ],

  ladder: [
    { lvl: 1, name: "Spark", desc: "Ran a ready-made app on your own example", next: "Remix one prototype" },
    { lvl: 2, name: "Tinkerer", desc: "Remixed a prototype and shared it", next: "Post your first build" },
    { lvl: 3, name: "Builder", desc: "Posted a build others rated 4+", next: "Join a hackathon team" },
    { lvl: 4, name: "Maker", desc: "Shipped a pilot with a sponsor", next: "Mentor two Sparks" },
    { lvl: 5, name: "Mentor", desc: "Coached others to their first build", next: "Lead a build session" }
  ],

  statuses: ["Idea", "Prototype", "Pilot", "Production candidate", "Certified"],
  tiers: { precisely: "Precisely-built", partner: "Partner-certified", community: "Community" },

  catalog: {
    skills: ["Address Verification", "Address Parsing", "Geocoding", "Places Discovery", "Property Intelligence", "Spatial Risk", "Tax Jurisdiction", "Timezone", "Route Planning", "Travel Analysis", "Service Area Market", "Emergency Services", "Contact Validation", "Data Quality Rules", "Data Quality Hotspots", "Geolocation", "Business Term Linkage", "Semantic Model Tagging"],
    agents: ["Underwriting Risk Assessor", "Real Estate Intelligence", "Logistics Optimizer", "Network Build Prioritization", "Address Quality", "Address Verification", "Contact Enrichment", "Duplicate Rule Finder"],
    apps: ["Property Analyzer", "Fleet Commander", "GeoTAX", "Data Quality Boost", "Real Estate Intelligence: Commercial", "Data Graph Enrich"]
  },

  people: [
    { id: "p1", name: "Maya Ortiz", role: "Claims operations lead", org: "Heartland Mutual (insurer)", persona: "no-code", level: 3, skills: ["Spatial Risk", "Property Intelligence", "Emergency Services"], open: ["mentor", "team"], builds: 3, rep: 412, approach: "Invite me to a build session", avoid: "Cold calls", tz: "Central" },
    { id: "p2", name: "Dev Patel", role: "Solutions engineer", org: "Northbeam Partners (SI)", persona: "pro-code", level: 5, skills: ["Route Planning", "Geocoding", "Travel Analysis", "MCP"], open: ["hire", "mentor"], builds: 11, rep: 1290, approach: "Comment on my build", avoid: "Long decks", tz: "Pacific" },
    { id: "p3", name: "Grace Liu", role: "Revenue ops analyst", org: "Cascade Fiber (telco)", persona: "low-code", level: 3, skills: ["Service Area Market", "Geocoding", "Data Quality Rules"], open: ["team", "hire"], builds: 4, rep: 530, approach: "Send a 2-minute video", avoid: "Meetings before a demo", tz: "Mountain" },
    { id: "p4", name: "Samuel Okafor", role: "County GIS coordinator", org: "Kittitas-area public works", persona: "no-code", level: 2, skills: ["Tax Jurisdiction", "Emergency Services", "Geocoding"], open: ["team"], builds: 1, rep: 140, approach: "Async in the community thread", avoid: "Sales sequences", tz: "Pacific" },
    { id: "p5", name: "Priya Raman", role: "Data steward", org: "Lakeshore Credit Union", persona: "low-code", level: 4, skills: ["Data Quality Rules", "Duplicate Rule Finder", "Contact Validation"], open: ["mentor"], builds: 6, rep: 760, approach: "Office hours, bring my data", avoid: "Generic newsletters", tz: "Eastern" },
    { id: "p6", name: "Leo Brandt", role: "Student, data science", org: "Central Washington University", persona: "low-code", level: 2, skills: ["Places Discovery", "Geolocation"], open: ["hire", "team"], builds: 2, rep: 210, approach: "Invite me to the next hackathon", avoid: "Unpaid take-homes", tz: "Pacific" },
    { id: "p7", name: "Ana Ferreira", role: "Fleet dispatcher", org: "Rio Verde Logistics", persona: "no-code", level: 1, skills: ["Route Planning"], open: ["team"], builds: 0, rep: 35, approach: "Show me a template first", avoid: "Jargon", tz: "Mountain" }
  ],

  posts: [
    { id: "b1", kind: "build", title: "Wildfire renewal triage for rural policies", author: "p1", tier: "community", status: "Pilot", persona: "no-code", industry: "Insurance",
      summary: "Drop in a renewal list; it flags homes over 30/50 on wildfire, more than 15 minutes from a fire station, or with a roof mismatch between records and imagery.",
      uses: ["Underwriting Risk Assessor", "Spatial Risk", "Emergency Services"], up: 184, down: 6, ratings: [5,5,4,5,4,5,5,4], forks: 23, credits: 410, vr: 8, age: 2,
      comments: [{ who: "p2", t: "Nice. The roof-mismatch flag is the one underwriters will love. Want a batch mode?" }, { who: "p5", t: "Does it keep the policy numbers out of the evidence bundle?" }, { who: "p1", t: "Yes, PII guard salts them. You can see it in the trust card." }] },
    { id: "b2", kind: "mashup", title: "Fiber site picker + tax lookup mashup", author: "p3", tier: "community", status: "Prototype", persona: "low-code", industry: "Telecom",
      summary: "Ranks candidate fiber sites by premises inside a drive-time band, then adds the local tax burden so finance can see true payback.",
      uses: ["Network Build Prioritization", "Tax Jurisdiction", "Service Area Market"], up: 96, down: 4, ratings: [5,4,4,4,5], forks: 9, credits: 260, vr: 7, age: 4,
      comments: [{ who: "p2", t: "Add Brighton-style growth weighting and this becomes a board slide." }] },
    { id: "b3", kind: "build", title: "Clean my member list before the mailer goes out", author: "p5", tier: "partner", status: "Production candidate", persona: "low-code", industry: "Banking",
      summary: "Finds duplicates, fixes addresses to ZIP+4, standardizes dates. Before/after score you can show your manager.",
      uses: ["Data Quality Boost", "Address Verification", "Duplicate Rule Finder"], up: 231, down: 9, ratings: [5,5,5,4,5,5,4,5,5], forks: 41, credits: 980, vr: 8, age: 6,
      comments: [{ who: "p7", t: "Could this work for delivery addresses too?" }, { who: "p5", t: "Yes. Remix it and swap the member file for your stops." }] },
    { id: "b4", kind: "ask", title: "Ask: how do I check which 911 center covers each of our sites?", author: "p4", tier: "community", status: "Idea", persona: "no-code", industry: "Public sector",
      summary: "We have 140 facilities across two counties. Need the PSAP and fire authority for each, in a spreadsheet.",
      uses: ["Emergency Services"], up: 38, down: 0, ratings: [], forks: 0, credits: 0, vr: 0, age: 1,
      comments: [{ who: "p1", t: "I used this in my wildfire build. Happy to pair for 20 minutes." }] },
    { id: "b5", kind: "build", title: "Same-day route plan with typo catcher", author: "p2", tier: "partner", status: "Certified", persona: "pro-code", industry: "Logistics",
      summary: "Catches misspelled stops before dispatch, then builds per-driver routes with ETAs. Template version for dispatchers with no setup.",
      uses: ["Fleet Commander", "Route Planning", "Address Verification"], up: 312, down: 11, ratings: [5,5,4,5,5,5,4,5,5,5], forks: 77, credits: 1560, vr: 8, age: 12,
      comments: [{ who: "p7", t: "Used the template today. It fixed two of my stops." }] },
    { id: "b6", kind: "build", title: "Campus site-selection scout", author: "p6", tier: "community", status: "Prototype", persona: "low-code", industry: "Retail",
      summary: "For a coffee cart near campus: nearby places, parcel facts, risk, and a clear note when foot-traffic numbers are sample data.",
      uses: ["Real Estate Intelligence: Commercial", "Places Discovery"], up: 44, down: 7, ratings: [4,3,4,4], forks: 3, credits: 90, vr: 6, age: 3,
      comments: [{ who: "p3", t: "Love that it labels sample vs live. More builds should." }] }
  ],

  hackathons: [
    { id: "h1", name: "Build on Trusted Data: Insurance", when: "Dec 4–5, 2026 · virtual", sponsor: "s1", prize: "$15,000 + pilot with sponsor", teams: 18, joined: false,
      challenges: ["Catastrophe exposure in under 5 minutes", "Explain a risk score to a homeowner", "Renewal triage for rural books"], hiringNote: "Sponsor hires from finalist teams instead of a take-home." },
    { id: "h2", name: "Agentic-Ready Data Jam: Public Sector", when: "Jan 15, 2027 · Seattle + virtual", sponsor: "s3", prize: "$8,000 + county pilot", teams: 9, joined: false,
      challenges: ["Which 911 center serves every facility", "Annexation-aware tax lookups", "Plain-language parcel reports"], hiringNote: "Two paid fellowships for student builders." },
    { id: "h3", name: "Mashup Monday (weekly)", when: "Every Monday · 45 min · virtual", sponsor: "s2", prize: "Credits + badge", teams: 31, joined: false,
      challenges: ["Combine any two skills into something useful", "Remix the most-forked build of the week"], hiringNote: "Partners scout for contractors here." }
  ],

  sponsors: [
    { id: "s1", name: "Heartland Mutual", kind: "Enterprise customer", seeks: "Prototypes that cut catastrophe-review time", budget: "$40k pilot pool", industries: ["Insurance"], skills: ["Spatial Risk", "Property Intelligence", "Underwriting Risk Assessor"] },
    { id: "s2", name: "Northbeam Partners", kind: "System integrator", seeks: "Builders to productize community mashups for clients", budget: "Paid contracts", industries: ["Logistics", "Retail", "Telecom"], skills: ["Route Planning", "Geocoding", "Fleet Commander"] },
    { id: "s3", name: "Evergreen Counties Consortium", kind: "Public sector", seeks: "Plain-language tools for facility, tax and 911 coverage", budget: "$25k grants", industries: ["Public sector"], skills: ["Emergency Services", "Tax Jurisdiction", "Geocoding"] },
    { id: "s4", name: "Precisely Builder Fund", kind: "Platform", seeks: "Any build that reaches 4.5 stars and a pilot", budget: "Credits + co-marketing", industries: ["Insurance", "Banking", "Telecom", "Logistics", "Retail", "Public sector"], skills: [] }
  ],

  // Seller lens: builders are the invitation. Signals come from community behavior, not cold lists.
  accounts: [
    { org: "Heartland Mutual", industry: "Insurance", people: ["p1"], stage: 3, signals: ["Pilot build with 184 upvotes", "3 teammates joined in 7 days", "410 credits used", "Asked about batch mode"], credits: 410, approach: "Invite me to a build session", avoid: "Cold calls",
      serve: "Offer a 30-minute co-build on her real renewal file with a forward-deployed builder. Bring batch mode, not a deck.", hero: "Maya" },
    { org: "Lakeshore Credit Union", industry: "Banking", people: ["p5"], stage: 4, signals: ["Partner-certified build", "980 credits", "41 forks across 6 orgs", "Hosts office hours"], credits: 980, approach: "Office hours, bring my data", avoid: "Generic newsletters",
      serve: "Ask Priya to co-host a credit-union build session. Spotlight her build in the release notes; let her peers ask for it.", hero: "Priya" },
    { org: "Cascade Fiber", industry: "Telecom", people: ["p3"], stage: 2, signals: ["Mashup with finance angle", "Asked for growth weighting", "260 credits"], credits: 260, approach: "Send a 2-minute video", avoid: "Meetings before a demo",
      serve: "Record a 2-minute video adding growth weighting to her mashup. No meeting request; offer the remix link.", hero: "Grace" },
    { org: "Kittitas-area public works", industry: "Public sector", people: ["p4"], stage: 1, signals: ["Posted an Ask", "Mentor offered to pair"], credits: 0, approach: "Async in the community thread", avoid: "Sales sequences",
      serve: "Answer in the thread with a ready template for 140 sites. Point to the Public Sector jam and the county grant.", hero: "Samuel" },
    { org: "Rio Verde Logistics", industry: "Logistics", people: ["p7"], stage: 0, signals: ["Used a certified template", "Asked a reuse question"], credits: 40, approach: "Show me a template first", avoid: "Jargon",
      serve: "Send the dispatcher template pre-filled with her depot. Invite her to Mashup Monday as a guest, not a lead.", hero: "Ana" }
  ],
  stages: ["Curious", "Builder", "Champion", "Team", "Sponsored pilot", "Paid expansion"],

  soul: [
    "Serve before you sell. Make the builder the hero.",
    "Plain words first. If a non-coder can't follow it, rewrite it.",
    "Show where every answer came from. Label sample data as sample.",
    "Ask before sending, buying, or sharing anything outside.",
    "Kind, curious, a little playful. Never condescending."
  ],
  brain: [
    { k: "Trusted data", v: "Precisely skills on live, verified data (address, property, risk, tax, places)" },
    { k: "Community memory", v: "Top-rated builds, remixes, and the comments that improved them" },
    { k: "Org context", v: "Your team's policies, approved data scopes, and credit budget" },
    { k: "Lessons", v: "What failed last time, and the fix (e.g. coverage gaps in small towns)" }
  ],
  agentsRoster: [
    { name: "Guide", job: "Turns your plain-language idea into a plan and picks certified parts" },
    { name: "Builder", job: "Assembles the prototype from skills and your examples" },
    { name: "Guardian", job: "Applies the eight VibeRANT checks quietly and blocks unsafe steps" },
    { name: "Scout", job: "Finds people, sponsors, and builds like yours in the community" },
    { name: "Herald", job: "Writes the post, trust card, and a 2-minute demo script" }
  ]
};
