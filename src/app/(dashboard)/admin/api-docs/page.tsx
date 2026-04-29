const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/farmers",
    description: "Returns farmer registry records.",
    params: "limit, county",
  },
  {
    method: "GET",
    path: "/api/registrations",
    description: "Returns farm profile / registration records.",
    params: "limit",
  },
  {
    method: "GET",
    path: "/api/production",
    description: "Returns production telemetry records.",
    params: "limit, season",
  },
  {
    method: "GET",
    path: "/api/reports",
    description: "Returns report metadata and export endpoints.",
    params: "none",
  },
];

export default function ApiDocsPage() {
  return (
    <div className="space-y-4 max-w-5xl">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">API documentation</div>
        <h1 className="mt-2 font-display text-[24px] text-gray-900">Interoperability API surface</h1>
        <p className="mt-2 text-[13px] text-gray-600">
          Token-protected endpoints for ministry and institutional system integrations.
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 font-mono text-[10px] uppercase tracking-widest text-gray-400">
          Endpoint reference
        </div>
        <div className="divide-y divide-gray-100">
          {ENDPOINTS.map((endpoint) => (
            <div key={endpoint.path} className="px-4 py-3">
              <div className="font-mono text-[11px] text-gray-500">
                {endpoint.method} {endpoint.path}
              </div>
              <div className="mt-1 text-[13px] text-gray-900">{endpoint.description}</div>
              <div className="text-[12px] text-gray-600">Params: {endpoint.params}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="font-display text-[18px] text-gray-900">Authentication</div>
        <p className="mt-2 text-[12px] text-gray-600">
          Provide a valid bearer token in the Authorization header. Unauthenticated requests return HTTP 401.
        </p>
      </section>
    </div>
  );
}

