export type CsvParseResult = {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
};

function splitCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "\"") {
      const next = line[i + 1];
      if (inQuotes && next === "\"") {
        cur += "\"";
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseCsv(text: string, opts?: { maxRows?: number }): CsvParseResult {
  const errors: string[] = [];
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (!lines.length) return { headers: [], rows: [], errors: ["CSV is empty."] };

  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^\uFEFF/, "").trim());
  if (headers.some((h) => !h)) errors.push("CSV header row contains empty column name(s).");

  const seen = new Set<string>();
  for (const h of headers) {
    const key = h.toLowerCase();
    if (seen.has(key)) errors.push(`Duplicate header: "${h}"`);
    seen.add(key);
  }

  const maxRows = opts?.maxRows ?? 1000;
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
    const values = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = values[c] ?? "";
    }
    rows.push(row);
  }

  if (lines.length - 1 > maxRows) {
    errors.push(`Preview limited to first ${maxRows} rows.`);
  }

  return { headers, rows, errors };
}

