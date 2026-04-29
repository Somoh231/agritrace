const ALLOCATION = [
  { county: "Nimba", fieldAgents: 34, tabletsOnline: 28, allocationScore: "High", risk: "Low" },
  { county: "Bong", fieldAgents: 22, tabletsOnline: 16, allocationScore: "Medium", risk: "Medium" },
  { county: "Lofa", fieldAgents: 19, tabletsOnline: 11, allocationScore: "Medium", risk: "High" },
];

export default function ResourceAllocationPage() {
  return (
    <div className="space-y-4 max-w-5xl">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Resource allocation</div>
        <h1 className="mt-2 font-display text-[24px] text-gray-900">County resource deployment tracker</h1>
        <p className="mt-2 text-[13px] text-gray-600">
          Tracks personnel and device allocation readiness for field operations and collection coverage.
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 font-mono text-[10px] uppercase tracking-widest text-gray-400">
          Allocation snapshot
        </div>
        <div className="divide-y divide-gray-100">
          {ALLOCATION.map((row) => (
            <div key={row.county} className="px-4 py-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-[12px]">
              <div className="font-medium text-gray-900">{row.county}</div>
              <div>Agents: {row.fieldAgents}</div>
              <div>Devices online: {row.tabletsOnline}</div>
              <div>Allocation: {row.allocationScore}</div>
              <div>Risk: {row.risk}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

