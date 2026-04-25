export function toCsv(rows: Array<Record<string, unknown>>): string {
  const keys = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    const needs = /[,"\n]/.test(s);
    const quoted = `"${s.replaceAll('"', '""')}"`;
    return needs ? quoted : s;
  };

  const lines = [
    keys.map(esc).join(","),
    ...rows.map((r) => keys.map((k) => esc(r[k])).join(",")),
  ];
  return lines.join("\n");
}

