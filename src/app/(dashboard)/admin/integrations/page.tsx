import Link from "next/link";

const API_ENDPOINTS = [
  { path: "/api/farmers", purpose: "Farmer registry records", auth: "Bearer token (required)" },
  { path: "/api/registrations", purpose: "Farm registration and renewal data", auth: "Bearer token (required)" },
  { path: "/api/production", purpose: "Rice production and county telemetry", auth: "Bearer token (required)" },
  { path: "/api/reports", purpose: "Generated report metadata and links", auth: "Bearer token (required)" },
];

const CONNECTOR_STATUS = [
  { system: "National ID systems", status: "Ready", note: "API scaffolding completed; mapping configuration pending." },
  { system: "Land administration", status: "Ready", note: "Plot profile and geo-reference structure available." },
  { system: "Finance / treasury", status: "In progress", note: "Programme and allocation datasets prepared for integration." },
  { system: "Customs", status: "In progress", note: "Compliance and movement export surfaces active." },
  { system: "Donor reporting systems", status: "Ready", note: "CSV/PDF export and donor report workflows live." },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-4 max-w-6xl">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Interoperability</div>
        <h1 className="mt-2 font-display text-[24px] text-gray-900">Integration and API readiness center</h1>
        <p className="mt-2 text-[13px] text-gray-600 max-w-3xl">
          Institutional integration readiness for ministry systems, partner reporting, and future national data
          exchange.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-display text-[18px] text-gray-900">API documentation</h2>
          <p className="mt-1 text-[12px] text-gray-600">
            Core secure endpoints for government and integration partners.
          </p>
          <div className="mt-3 space-y-2">
            {API_ENDPOINTS.map((endpoint) => (
              <div key={endpoint.path} className="rounded-md border border-gray-100 px-3 py-2 bg-gray-50">
                <div className="font-mono text-[11px] text-forest-800">{endpoint.path}</div>
                <div className="text-[12px] text-gray-700">{endpoint.purpose}</div>
                <div className="text-[11px] text-gray-500">{endpoint.auth}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-display text-[18px] text-gray-900">Import / export operations</h2>
          <p className="mt-1 text-[12px] text-gray-600">
            Data exchange tooling for ingestion and formal report outputs.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <Quick href="/admin/api-docs" title="API documentation page" body="Endpoint contracts and auth model for integrations." />
            <Quick href="/admin/import" title="CSV Import center" body="Schema-validated bulk import for operational datasets." />
            <Quick href="/admin/reports" title="Reports center" body="Generate and export structured ministry reports." />
            <Quick href="/rice/reports" title="Rice ministry reports" body="County production and pilot reporting outputs." />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 font-mono text-[10px] uppercase tracking-widest text-gray-400">
          Connected systems status
        </div>
        <div className="divide-y divide-gray-100">
          {CONNECTOR_STATUS.map((row) => (
            <div key={row.system} className="px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-medium text-gray-900">{row.system}</div>
                <div className="mt-1 text-[12px] text-gray-600">{row.note}</div>
              </div>
              <span
                className={`font-mono text-[10px] px-2 py-1 rounded-md border ${
                  row.status === "Ready"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-display text-[18px] text-gray-900">Sample secure request</h2>
        <pre className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-[11px] overflow-x-auto">
{`curl -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  https://your-domain.com/api/farmers?limit=50`}
        </pre>
      </section>
    </div>
  );
}

function Quick({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-md border border-gray-100 px-3 py-2 block hover:bg-gray-50">
      <div className="text-[13px] font-medium text-gray-900">{title}</div>
      <div className="mt-0.5 text-[12px] text-gray-600">{body}</div>
    </Link>
  );
}

