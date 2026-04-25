import * as React from "react";

export default function ComplianceRing({
  compliant,
  pending,
  flagged,
  unchecked,
  checklistItems,
}: {
  compliant: number;
  pending: number;
  flagged: number;
  unchecked: number;
  checklistItems: Array<{ label: string; pct: number }>;
}) {
  const total = Math.max(1, compliant + pending + flagged + unchecked);
  const pct = Math.round((compliant / total) * 100);

  const circumference = 2 * Math.PI * 28;
  const arcLength = (compliant / total) * circumference;
  const dash = `${arcLength} ${circumference}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-4">
        <svg width="70" height="70" viewBox="0 0 70 70" aria-label="Compliance ring">
          <g transform="rotate(-90 35 35)">
            <circle cx="35" cy="35" r="28" stroke="#e5e7eb" strokeWidth="7" fill="none" />
            <circle
              cx="35"
              cy="35"
              r="28"
              stroke="#639922"
              strokeWidth="7"
              fill="none"
              strokeDasharray={dash}
              strokeLinecap="round"
            />
          </g>
          <text x="35" y="40" textAnchor="middle" className="fill-gray-900" style={{ fontSize: 14, fontWeight: 600 }}>
            {pct}%
          </text>
        </svg>

        <div className="space-y-1 text-[12px]">
          <LegendRow color="#639922" label="Compliant" value={compliant} />
          <LegendRow color="#f5c842" label="Pending" value={pending} />
          <LegendRow color="#ef4444" label="Flagged" value={flagged} />
          <LegendRow color="#9ca3af" label="Unchecked" value={unchecked} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {checklistItems.map((i) => (
          <div key={i.label} className="flex items-center justify-between gap-3">
            <div className="text-[12px] text-gray-700">{i.label}</div>
            <div className="flex items-center gap-2">
              <div className="w-[70px] h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-[#639922]" style={{ width: `${Math.max(0, Math.min(100, i.pct))}%` }} />
              </div>
              <div className="font-mono text-[11px] text-gray-600">{Math.round(i.pct)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-gray-700">{label}:</span>
      <span className="font-mono text-gray-700">{value}</span>
    </div>
  );
}

