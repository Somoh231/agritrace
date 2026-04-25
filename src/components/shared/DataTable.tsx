import * as React from "react";

type Column = {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
};

export default function DataTable({
  columns,
  data,
  onRowClick,
  emptyMessage = "No records.",
}: {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyMessage?: string;
}) {
  return (
    <div className="av-card overflow-hidden">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={c.width ? { width: c.width } : undefined}
                className="text-left font-mono text-[9px] text-slate-400 uppercase tracking-[2px] pt-3 pb-2.5 px-4 border-b border-gray-100 font-medium bg-white"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map((row, idx) => (
              <tr
                key={idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick ? "hover:bg-gray-50 cursor-pointer" : undefined
                }
              >
                {columns.map((c) => {
                  const v = row[c.key];
                  return (
                    <td
                      key={c.key}
                      className="py-3 px-4 text-[13px] text-slate-700 border-b border-gray-100 overflow-hidden text-ellipsis whitespace-nowrap align-middle"
                    >
                      {c.render ? c.render(v, row) : String(v ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="py-10 px-4 text-[13px] text-slate-500"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.length ? (
            <tr className="hidden">
              <td className="border-b-0" />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

