"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_TICK, CHART_COLORS, CHART_MARGIN, TOOLTIP_STYLE } from "@/components/enterprise/analytics/chart-theme";

export default function EnterpriseAreaChart({
  data,
  xKey,
  yKey,
  height = 220,
  color = CHART_COLORS.forest,
  valueFormatter,
  name,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
  name?: string;
}) {
  const gradId = `area-${yKey}`.replace(/\W/g, "");

  return (
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={AXIS_TICK} />
          <YAxis tick={AXIS_TICK} tickFormatter={valueFormatter} width={44} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => {
              const n = typeof v === "number" ? v : Number(v ?? 0);
              return valueFormatter ? valueFormatter(n) : String(v ?? "");
            }}
          />
          <Area type="monotone" dataKey={yKey} name={name ?? yKey} stroke={color} strokeWidth={2} fill={`url(#${gradId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
