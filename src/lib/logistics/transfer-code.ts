import type { TransferOrderView } from "@/lib/logistics/types";

/** WH-NIM-001 → NIM */
export function regionTagFromMinistryCode(ministryCode: string): string {
  const cleaned = ministryCode.replace(/^WH-/i, "").split("-")[0] ?? "UNK";
  return cleaned.toUpperCase().slice(0, 6);
}

export function suggestTransferCode(fromMinistryCode: string, toMinistryCode: string, existingCodes: string[]): string {
  const a = regionTagFromMinistryCode(fromMinistryCode);
  const b = regionTagFromMinistryCode(toMinistryCode);
  const prefix = `TRF-${a}-${b}`;
  let max = 0;
  for (const c of existingCodes) {
    if (!c.startsWith(prefix)) continue;
    const tail = c.slice(prefix.length + 1);
    const n = Number.parseInt(tail, 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  const next = max + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

export function collectExistingCodes(rows: TransferOrderView[]): string[] {
  return rows.map((r) => r.transferCode);
}
