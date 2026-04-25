export function formatWeight(kg: number): string {
  if (!Number.isFinite(kg)) return "-";
  if (Math.abs(kg) >= 1000) {
    return `${(kg / 1000).toFixed(2)} MT`;
  }
  return `${Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(kg)} kg`;
}

export function formatLossRate(expected: number, actual: number): string {
  if (!Number.isFinite(expected) || expected <= 0 || !Number.isFinite(actual)) return "-";
  const pct = ((expected - actual) / expected) * 100;
  return `${(Math.round(pct * 10) / 10).toFixed(1)}%`;
}

export function formatCounty(county: string): string {
  const c = county.trim().toLowerCase();
  return c ? c.charAt(0).toUpperCase() + c.slice(1) : "";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

