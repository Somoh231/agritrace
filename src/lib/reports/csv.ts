/** Escapes a CSV cell and neutralizes spreadsheet formula execution. */
export function escapeCsvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const safe = /^[\t\r ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  const needsQuotes = /[,"\n\r]/.test(safe);
  return needsQuotes ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  const keys = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );

  const lines = [
    keys.map(escapeCsvCell).join(","),
    ...rows.map((r) => keys.map((k) => escapeCsvCell(r[k])).join(",")),
  ];
  return lines.join("\n");
}
