"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_TICK, CHART_COLORS, CHART_MARGIN, TOOLTIP_STYLE } from "@/components/enterprise/analytics/chart-theme";

export type BarSeries = { dataKey: string; fill: string; name?: string; stackId?: string };

export default function EnterpriseBarChart({
  data,
  xKey,
  series,
  height = 240,
  layout = "horizontal",
  valueFormatter,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: BarSeries[];
  height?: number;
  layout?: "horizontal" | "vertical";
  valueFormatter?: (v: number) => string;
}) {
  const vertical = layout === "vertical";

  return (
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN} layout={vertical ? "vertical" : "horizontal"}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={!vertical} horizontal={vertical} />
          {vertical ? (
            <>
              <XAxis type="number" tick={AXIS_TICK} tickFormatter={valueFormatter} />
              <YAxis type="category" dataKey={xKey} tick={AXIS_TICK} width={72} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={AXIS_TICK} interval={0} angle={data.length > 6 ? -28 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 56 : 28} />
              <YAxis tick={AXIS_TICK} tickFormatter={valueFormatter} width={48} />
            </>
          )}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => {
              const n = typeof v === "number" ? v : Number(v ?? 0);
              return valueFormatter ? valueFormatter(n) : String(v ?? "");
            }}
          />
          {series.map((s) => (
            <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.fill} name={s.name ?? s.dataKey} stackId={s.stackId} radius={[4, 4, 0, 0]} maxBarSize={40} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
