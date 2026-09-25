/**
 * Public-site content — single source for navigation, homepage and inner pages.
 *
 * Claims policy: every capability stated here exists in the production platform
 * code (workflow engine with approval chain and append-only decision ledger,
 * role-based workspaces, boundary capture with GPS accuracy and area, offline
 * capture queue, warehouse transfer workflow, CSV import, PDF/CSV reports). No farmer, warehouse,
 * production or impact figures are published; the Liberia programme is described
 * only as a pilot being validated.
 */

export type Practice = {
  id: string;
  n: string;
  title: string;
  short: string;
  outcome: string;
  scope: string[];
  delivers: string;
  products: string[];
  tone: "navy" | "forest" | "sand" | "earth";
};

export const PRACTICES: Practice[] = [
  {
    id: "systems",
    n: "01",
    title: "Agricultural Systems & Digital Infrastructure",
    short: "The shared data model, identity, access and integration layer an agricultural institution runs on.",
    outcome: "One trusted record of farmers, farms, inputs and activity, owned by the institution.",
    scope: ["Institutional data model", "Identity and role-based access", "Administrative geography", "Integration and data exchange"],
    delivers: "A system of record configured to the institution's own structure — national, county, district and field levels.",
    products: ["operations-platform", "farmer-registry"],
    tone: "navy",
  },
  {
    id: "field",
    n: "02",
    title: "Field Operations & Digitization",
    short: "Moving registration, inspection and extension work from paper to supervised digital workflows.",
    outcome: "Field work that arrives verified, attributed and on time — including from areas without coverage.",
    scope: ["Registration and inspection workflows", "Offline-first capture", "Supervision and review chains", "Officer training"],
    delivers: "Digital field workflows that officers can run offline, reviewed by the level above before they count.",
    products: ["offline-field", "operations-platform"],
    tone: "forest",
  },
  {
    id: "gis",
    n: "03",
    title: "GIS & Land Intelligence",
    short: "Plot boundaries, administrative geography and facility locations tied to operational records.",
    outcome: "Every plot, facility and record placed on the map it belongs to — and traceable back to who captured it.",
    scope: ["Field boundary capture", "Area estimation", "County and district geography", "Operational mapping"],
    delivers: "Approximate operational boundaries captured on the ground and linked to the farmer record — not cadastral survey.",
    products: ["gis-boundary"],
    tone: "earth",
  },
  {
    id: "supply",
    n: "04",
    title: "Supply Chain & Traceability",
    short: "Warehouse registries, receipts, transfers and custody chains for inputs and produce.",
    outcome: "A custody trail for inputs and produce that reconciles without re-keying.",
    scope: ["Warehouse registry", "Receipts and stock", "Transfer requests, dispatch and delivery", "Discrepancy handling"],
    delivers: "Transfers that move through request, approval, dispatch and delivery with each step attributed.",
    products: ["warehouse-traceability"],
    tone: "sand",
  },
  {
    id: "reporting",
    n: "05",
    title: "Reporting & Institutional Intelligence",
    short: "County, national, donor and executive reporting generated from the operational record.",
    outcome: "Reports that can be traced back to the records they were built from.",
    scope: ["Executive and national reporting", "Donor and programme reporting", "Compliance reporting", "Controlled exports"],
    delivers: "Reports produced from the operational record, not from re-keyed spreadsheets.",
    products: ["reporting-intelligence"],
    tone: "navy",
  },
  {
    id: "programmes",
    n: "06",
    title: "Programme Design & Implementation",
    short: "Scoping, workflow design, training, rollout and measurement for agricultural programmes.",
    outcome: "A programme that is designed around the institution, delivered in phases and measured against agreed criteria.",
    scope: ["Diagnostic and scoping", "Workflow and role design", "Phased rollout and training", "Measurement and handover"],
    delivers: "One accountable team from diagnosis to handover, with software arriving in the middle of the process.",
    products: ["operations-platform", "offline-field"],
    tone: "forest",
  },
];

export type Product = {
  id: string;
  code: string;
  name: string;
  line: string;
  problem: string;
  capabilities: string[];
  workflow: string[];
  users: string[];
  integrations: string[];
  deployment: string;
  practices: string[];
  /** Illustrative record lineage shown in product previews — always labelled SAMPLE. */
  lineage: { step: string; actor: string; status: "done" | "current" | "pending"; label: string }[];
};

export const PRODUCTS: Product[] = [
  {
    id: "operations-platform",
    code: "P1",
    name: "AgriVault Operations Platform",
    line: "One operational record from field capture through district verification, county approval and national reporting.",
    problem: "Programmes run on parallel lists, maps and ledgers that no one can reconcile, so leadership sees activity weeks late and cannot trace a figure back to its source.",
    capabilities: [
      "Approval chain from field to national level, with corrections and escalation",
      "Role-based and geography-based access for every user",
      "Append-only decision ledger and audit trail",
      "Workspaces for field, district, county and national teams",
    ],
    workflow: ["Captured in the field", "District verification", "County approval", "National consolidation"],
    users: ["Field officers", "District agriculture officers", "County coordinators", "National programme teams", "Auditors"],
    integrations: ["CSV import for registries and ledgers", "PDF and CSV exports"],
    deployment: "Configured to the institution's administrative levels and rolled out in phases, starting with a defined area.",
    practices: ["01", "02", "06"],
    lineage: [
      { step: "Captured in the field", actor: "Field officer · offline", status: "done", label: "Synced" },
      { step: "District verification", actor: "District agriculture officer", status: "done", label: "Verified" },
      { step: "County approval", actor: "County office", status: "current", label: "Approved" },
      { step: "National consolidation", actor: "Programme team", status: "pending", label: "Pending" },
    ],
  },
  {
    id: "farmer-registry",
    code: "P2",
    name: "Farmer Registry",
    line: "Farmer and farm profiles registered in the field and verified by district reviewers.",
    problem: "Beneficiary lists are duplicated across programmes and cannot be verified, which undermines targeting and subsidy delivery.",
    capabilities: [
      "Farmer and farm profiles captured by field officers",
      "District review and verification workflow",
      "Bulk CSV import for existing registries",
      "Registry exports",
    ],
    workflow: ["Register", "Verify", "Approve", "Use in programmes"],
    users: ["Field officers", "District reviewers", "Programme managers"],
    integrations: ["Bulk CSV import", "Registry exports"],
    deployment: "Deployed with the Operations Platform or as the first module of a wider programme.",
    practices: ["01"],
    lineage: [
      { step: "Farmer registered", actor: "Field officer · assigned area", status: "done", label: "Registered" },
      { step: "Profile completed", actor: "Field officer", status: "done", label: "Ready" },
      { step: "Profile verified", actor: "District reviewer", status: "current", label: "Verified" },
      { step: "Eligible for programme", actor: "Programme manager", status: "pending", label: "Pending" },
    ],
  },
  {
    id: "gis-boundary",
    code: "P3",
    name: "GIS & Boundary Intelligence",
    line: "Plot boundaries walked on the ground, measured, and tied to the farmer record.",
    problem: "Plot maps live in separate GIS files that are not linked to farmers, so area, location and eligibility cannot be checked together.",
    capabilities: [
      "Walk-the-corners boundary capture with recorded GPS accuracy",
      "Area estimation in hectares and acres from the captured outline",
      "Boundaries linked to the farmer's field visit record",
      "County and district geography for every record",
    ],
    workflow: ["Walk corners", "Close outline", "Link to farmer", "Review on the map"],
    users: ["Field officers", "District reviewers", "GIS and programme analysts"],
    integrations: ["GeoJSON boundaries", "Mapbox basemaps"],
    deployment: "Boundaries are operational outlines for traceability — approximate, not cadastral survey.",
    practices: ["03"],
    lineage: [
      { step: "Corners walked", actor: "Field officer · GPS", status: "done", label: "Captured" },
      { step: "Outline closed", actor: "Area estimated", status: "done", label: "Measured" },
      { step: "Linked to farmer", actor: "Farmer record", status: "current", label: "Linked" },
      { step: "Reviewed on the map", actor: "District reviewer", status: "pending", label: "Pending" },
    ],
  },
  {
    id: "warehouse-traceability",
    code: "P4",
    name: "Warehouse & Traceability",
    line: "Receipts, transfers and custody for inputs and produce, attributed at every step.",
    problem: "Stock ledgers are reconciled by hand, and transfers between facilities leave no trail that auditors or donors can follow.",
    capabilities: [
      "Warehouse registry and stock records",
      "Transfer lifecycle: requested, approved, dispatched, in transit, delivered",
      "Scoped access for assigned warehouse managers",
      "Discrepancy and dispute recording",
    ],
    workflow: ["Receive", "Request transfer", "Approve and dispatch", "Confirm delivery"],
    users: ["Warehouse managers", "County coordinators", "National logistics teams"],
    integrations: ["Ledger CSV import", "Custody and transfer exports"],
    deployment: "Rolled out facility by facility alongside the programme's input distribution cycle.",
    practices: ["04"],
    lineage: [
      { step: "Transfer requested", actor: "Warehouse manager", status: "done", label: "Requested" },
      { step: "Transfer approved", actor: "County coordinator", status: "done", label: "Approved" },
      { step: "Dispatched", actor: "Origin warehouse", status: "current", label: "In transit" },
      { step: "Delivery confirmed", actor: "Receiving warehouse", status: "pending", label: "Pending" },
    ],
  },
  {
    id: "reporting-intelligence",
    code: "P5",
    name: "Reporting & Executive Intelligence",
    line: "County, national, donor and executive reporting generated from the operational record.",
    problem: "Quarterly reports are compiled from re-keyed spreadsheets and cannot be traced back to what happened in the field.",
    capabilities: [
      "Executive, compliance, donor and programme reports",
      "PDF reports and CSV exports",
      "Reports generated on demand from the operational record",
    ],
    workflow: ["Approved records", "Scoped report", "Export", "Review"],
    users: ["National leadership", "Programme managers", "Development partners", "Auditors"],
    integrations: ["PDF reports", "CSV exports"],
    deployment: "Report sets are agreed during design and generated on demand from the live record.",
    practices: ["05"],
    lineage: [
      { step: "Approved records", actor: "Operational record", status: "done", label: "Approved" },
      { step: "Scoped to role", actor: "County view", status: "done", label: "Scoped" },
      { step: "Report generated", actor: "Programme report", status: "current", label: "Generated" },
      { step: "Reviewed", actor: "Programme lead", status: "pending", label: "Pending" },
    ],
  },
  {
    id: "offline-field",
    code: "P6",
    name: "Offline Field Operations",
    line: "Capture that keeps working without coverage and syncs when it returns.",
    problem: "Field teams work where connectivity is intermittent; paper fills the gap and is re-keyed weeks later — if at all.",
    capabilities: [
      "Installable field app with an offline capture queue",
      "Queued records sync when the connection returns",
      "Queue status visible to the officer",
    ],
    workflow: ["Capture offline", "Queue on device", "Reconnect", "Sync and review"],
    users: ["Field officers", "Extension teams", "District supervisors"],
    integrations: ["Installable web app (PWA)"],
    deployment: "Designed for intermittent coverage and shared devices from the first day of deployment.",
    practices: ["02"],
    lineage: [
      { step: "Captured offline", actor: "Field officer · no coverage", status: "done", label: "Queued" },
      { step: "Held on device", actor: "Capture queue", status: "done", label: "Held" },
      { step: "Connection returns", actor: "Device", status: "current", label: "Syncing" },
      { step: "Synced for review", actor: "District reviewer", status: "pending", label: "Pending" },
    ],
  },
];

export type Stage = { n: string; phase: "Before" | "Live" | "Review" | "After"; name: string; body: string; output: string; activities: string[] };

export const STAGES: Stage[] = [
  {
    n: "01",
    phase: "Before",
    name: "Diagnose",
    body: "Understand the programme as it runs today: structures, data, connectivity and constraints.",
    output: "Diagnostic report and recommended path",
    activities: ["Stakeholder and site visits", "Data and process inventory", "Connectivity and device review"],
  },
  {
    n: "02",
    phase: "Before",
    name: "Design",
    body: "Configure workflows, roles and reports around the institution's existing administrative levels.",
    output: "Programme and system design",
    activities: ["Workflow and approval design", "Role and geography model", "Reporting requirements"],
  },
  {
    n: "03",
    phase: "Live",
    name: "Deploy",
    body: "Train officers, equip teams and go live in phases, starting with a defined area.",
    output: "Live pilot in agreed geography",
    activities: ["Officer training", "Phased go-live", "Field support"],
  },
  {
    n: "04",
    phase: "Live",
    name: "Operate",
    body: "Run, support and maintain day-to-day operations alongside institutional teams.",
    output: "Operational support and service reporting",
    activities: ["Service support", "Data quality review", "Change management"],
  },
  {
    n: "05",
    phase: "Review",
    name: "Measure",
    body: "Assess results against the criteria agreed at the design stage.",
    output: "Evaluation against agreed criteria",
    activities: ["Criteria agreed up front", "Evidence from the record", "Independent review where required"],
  },
  {
    n: "06",
    phase: "After",
    name: "Transfer capability",
    body: "Hand over skills, documentation and ownership so the institution can run the system.",
    output: "Capability and ownership plan",
    activities: ["Skills transfer", "Documentation", "Ownership and continuity plan"],
  },
];

export type EngagementModel = { n: string; name: string; kind: string; summary: string; suited: string; stages: string[] };

export const ENGAGEMENT_MODELS: EngagementModel[] = [
  {
    n: "01",
    name: "Diagnostic & advisory",
    kind: "Advisory",
    summary: "An independent view of how a programme runs today and what it would take to strengthen it — before any system is chosen.",
    suited: "Institutions deciding where to start",
    stages: ["01", "02"],
  },
  {
    n: "02",
    name: "System deployment",
    kind: "Technology",
    summary: "Our products configured to your workflows, roles and geography, deployed in phases and supported through go-live.",
    suited: "Programmes with a defined operating model",
    stages: ["02", "03", "04"],
  },
  {
    n: "03",
    name: "Programme implementation",
    kind: "Delivery",
    summary: "Design, deployment, training and measurement delivered as a single programme with one accountable team.",
    suited: "New or expanding national programmes",
    stages: ["01", "02", "03", "04", "05"],
  },
  {
    n: "04",
    name: "Managed operational support",
    kind: "Operations",
    summary: "Day-to-day operation, data quality and service reporting run alongside institutional teams.",
    suited: "Live systems that need dependable operation",
    stages: ["04", "05"],
  },
  {
    n: "05",
    name: "Capacity transfer",
    kind: "Handover",
    summary: "Skills, documentation and ownership transferred so the institution runs the system itself.",
    suited: "Institutions taking full ownership",
    stages: ["05", "06"],
  },
];

export const MARKETS = [
  { name: "National governments", note: "Modernising the systems behind national agricultural programmes." },
  { name: "Ministries & agencies", note: "Operational visibility from field offices to the national level." },
  { name: "Development partners", note: "Programme records that hold up to review and reporting." },
  { name: "Agricultural programmes", note: "Registration, delivery and measurement on one record." },
  { name: "Cooperatives", note: "Member registries, inputs and produce with a custody trail." },
  { name: "Supply-chain operators", note: "Warehouse, transfer and traceability records that reconcile." },
];

export const OUTCOMES = [
  { title: "Better programme visibility", body: "Leadership sees field activity as it is recorded, not weeks later in a compiled report." },
  { title: "Traceable field records", body: "Each record carries who captured it, where, when and who approved it." },
  { title: "Stronger reporting", body: "Reports are produced from the operational record instead of re-keyed spreadsheets." },
  { title: "Better coordination", body: "Field, district, county and national teams work from the same information." },
  { title: "More defensible data", body: "Figures hold up to review by auditors, donors and oversight bodies." },
  { title: "Operational continuity", body: "Work continues offline and through staff changes because the process lives in the system." },
  { title: "Reduced fragmentation", body: "Fewer parallel lists, maps and ledgers describing the same farmers and stock." },
];

/** The institutional problem, as sources held separately today and linked in one record. */
export const FRAGMENTS = [
  { kind: "Paper", title: "Field forms", issue: "Re-keyed weeks later", resolved: "Captured once, synced from the field" },
  { kind: "Spreadsheet", title: "Beneficiary lists", issue: "Duplicates across lists", resolved: "One verified registry" },
  { kind: "GIS file", title: "Plot maps", issue: "Not linked to farmers", resolved: "Boundaries tied to the farmer record" },
  { kind: "Warehouse", title: "Stock ledgers", issue: "Reconciled by hand", resolved: "Transfers attributed at every step" },
  { kind: "PDF", title: "Quarterly report", issue: "Cannot be traced", resolved: "Built from the operational record" },
  { kind: "Phone calls", title: "Officer updates", issue: "Not recorded", resolved: "Recorded in the workflow" },
];

export const LIBERIA = {
  name: "Liberia Agricultural Intelligence Programme",
  status: "Pilot, 2026 · being validated",
  counties: ["Nimba", "Bong", "Lofa"],
  posture: [
    { k: "Counterparties", v: "County and district agriculture offices, with programme partners" },
    { k: "Scope", v: "Nimba, Bong and Lofa counties" },
    { k: "Engagement", v: "Pilot implementation programme" },
    { k: "Phasing", v: "Diagnose → pilot → phased expansion" },
    { k: "Status", v: "Pilot, 2026 · being validated" },
  ],
  components: [
    { title: "Field-to-national reporting", body: "One record from officer to national view." },
    { title: "Farmer registration", body: "Registered in the field, verified by district reviewers." },
    { title: "GIS", body: "Plot boundaries and county geography." },
    { title: "Verification", body: "District review, county approval." },
    { title: "Warehouse operations", body: "Receipts, transfers, custody." },
    { title: "Offline field capture", body: "Designed for intermittent coverage." },
    { title: "National reporting", body: "Built from the operational record." },
  ],
};

export const CONTACT_EMAIL = "partnerships@agrivaultdata.com";

export type NavGroup = {
  id: string;
  label: string;
  href: string;
  intro: string;
  columns: { title: string; items: { label: string; href: string; description?: string }[] }[];
  feature?: { eyebrow: string; title: string; body: string; href: string; cta: string };
};

export const NAV: NavGroup[] = [
  {
    id: "what-we-do",
    label: "What We Do",
    href: "/what-we-do",
    intro: "Six practices, each defined by the institutional outcome it produces.",
    columns: [
      {
        title: "Practices",
        items: PRACTICES.map((p) => ({ label: p.title, href: `/what-we-do#${p.id}`, description: p.short })),
      },
    ],
    feature: {
      eyebrow: "How engagements start",
      title: "Most programmes combine several practices.",
      body: "We start with a diagnostic and scope only what the programme needs.",
      href: "/how-we-work",
      cta: "How we work",
    },
  },
  {
    id: "products",
    label: "Products",
    href: "/products",
    intro: "Systems we build and configure to each programme, geography and institution.",
    columns: [
      {
        title: "Products we deploy",
        items: PRODUCTS.map((p) => ({ label: p.name, href: `/products#${p.id}`, description: p.line })),
      },
    ],
    feature: {
      eyebrow: "Flagship product",
      title: "AgriVault Operations Platform",
      body: "One operational record from field capture to national reporting.",
      href: "/products#operations-platform",
      cta: "View the platform",
    },
  },
  {
    id: "programmes",
    label: "Programmes",
    href: "/programmes",
    intro: "Programme-led delivery: the system arrives inside the work, not before it.",
    columns: [
      {
        title: "Programmes",
        items: [
          { label: "Programme-led delivery", href: "/programmes", description: "How we design, deploy and measure programmes." },
          { label: "Governments & ministries", href: "/governments", description: "Institutional engagement with ministries and agencies." },
        ],
      },
    ],
    feature: {
      eyebrow: "Starting market",
      title: "Liberia Agricultural Intelligence Programme",
      body: "Three pilot counties, a field-to-national workflow and a phased path to expansion.",
      href: "/programmes/liberia",
      cta: "Read the programme",
    },
  },
  {
    id: "how-we-work",
    label: "How We Work",
    href: "/how-we-work",
    intro: "Six stages from diagnosis to handover, delivered by one accountable team.",
    columns: [
      {
        title: "Methodology",
        items: STAGES.map((s) => ({ label: `${s.n} · ${s.name}`, href: `/how-we-work#${s.name.toLowerCase().split(" ")[0]}` })),
      },
    ],
    feature: {
      eyebrow: "Engagement models",
      title: "Five ways to work with us.",
      body: "From a diagnostic engagement to managed operations and capacity transfer.",
      href: "/how-we-work#engagement-models",
      cta: "Compare models",
    },
  },
  {
    id: "governments",
    label: "Governments",
    href: "/governments",
    intro: "Institutional modernisation that leaves the institution in control.",
    columns: [
      {
        title: "Institutional partners",
        items: [
          { label: "Governments & ministries", href: "/governments", description: "Operational visibility, interoperability and continuity." },
          { label: "Data ownership & control", href: "/governments#control-title", description: "The operational record belongs to the institution." },
          { label: "Starting an engagement", href: "/governments#engage-title", description: "Begin with a diagnostic, not a software procurement." },
        ],
      },
    ],
    feature: {
      eyebrow: "Security & governance",
      title: "Built to hold up to review.",
      body: "Role-based access, approval chains and an append-only decision ledger.",
      href: "/security",
      cta: "Security & governance",
    },
  },
  {
    id: "company",
    label: "Company",
    href: "/about",
    intro: "An independent agricultural systems, technology, advisory and implementation company.",
    columns: [
      {
        title: "Company",
        items: [
          { label: "About", href: "/about", description: "Why AgriVault exists and how we work." },
          { label: "Contact", href: "/contact", description: "Start a conversation about a programme." },
        ],
      },
    ],
  },
];
