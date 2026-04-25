export function safePct(numer: number, denom: number) {
  if (!Number.isFinite(numer) || !Number.isFinite(denom) || denom === 0) return 0;
  return (numer / denom) * 100;
}

export function seasonLabel(d = new Date()) {
  const year = d.getFullYear();
  // Liberia crop seasons vary; for MVP we use A/B half-year.
  const half = d.getMonth() < 6 ? "A" : "B";
  return `${year}-${half}`;
}

