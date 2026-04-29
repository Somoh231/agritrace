const RENEWAL_ROWS = [
  { county: "Nimba", due30: 164, due60: 223, completed: 412, completionRate: 73 },
  { county: "Bong", due30: 101, due60: 146, completed: 271, completionRate: 69 },
  { county: "Lofa", due30: 87, due60: 132, completed: 236, completionRate: 64 },
];

export default function RiceRenewalsPage() {
  return (
    <div className="space-y-4 max-w-5xl">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Annual recertification</div>
        <h1 className="mt-2 font-display text-[24px] text-gray-900">Farmer renewal and recertification flow</h1>
        <p className="mt-2 text-[13px] text-gray-600">
          Tracks annual farmer profile refresh, compliance recertification, and county follow-up workload.
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 font-mono text-[10px] uppercase tracking-widest text-gray-400">
          Renewal status by county
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-[12px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">County</th>
                <th className="text-left font-medium px-3 py-3">Due (30 days)</th>
                <th className="text-left font-medium px-3 py-3">Due (31-60 days)</th>
                <th className="text-left font-medium px-3 py-3">Completed this cycle</th>
                <th className="text-left font-medium px-3 py-3">Completion rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RENEWAL_ROWS.map((row) => (
                <tr key={row.county} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.county}</td>
                  <td className="px-3 py-3">{row.due30}</td>
                  <td className="px-3 py-3">{row.due60}</td>
                  <td className="px-3 py-3">{row.completed}</td>
                  <td className="px-3 py-3">
                    <span className="font-mono">{row.completionRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

