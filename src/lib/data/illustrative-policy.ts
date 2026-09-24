/**
 * Illustrative (fixture / demo / canonical sample) data policy.
 *
 * AgriVault is used for real operations: by default operators see only live
 * records, and an empty table renders an honest empty state. Illustrative
 * datasets may be shown only in an explicitly configured training or
 * walkthrough environment:
 *
 *   NEXT_PUBLIC_ILLUSTRATIVE_DATA=enabled
 *
 * Never enable this on a deployment that real operators use.
 */
export const ILLUSTRATIVE_DATA_ENABLED = process.env.NEXT_PUBLIC_ILLUSTRATIVE_DATA === "enabled";

/** Returns the illustrative value only when the environment explicitly allows it. */
export function illustrativeOr<T>(illustrative: T, live: T): T {
  return ILLUSTRATIVE_DATA_ENABLED ? illustrative : live;
}

/**
 * Live-safe stand-in for an illustrative metrics object: numbers become 0,
 * text becomes an explicit "no data" marker, lists become empty. Used so that
 * disabling illustrative data can never surface fabricated figures.
 */
export function zeroedIllustrative<T>(value: T): T {
  if (Array.isArray(value)) return [] as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, v]) => [
        key,
        typeof v === "number" ? 0 : typeof v === "string" ? "No data recorded" : zeroedIllustrative(v),
      ]),
    ) as T;
  }
  return value;
}

/** Caption helper: marks text as illustrative only when illustrative data can actually be shown. */
export function illustrativeCaption(live: string, illustrative: string = `${live} (illustrative)`): string {
  return ILLUSTRATIVE_DATA_ENABLED ? illustrative : live;
}
