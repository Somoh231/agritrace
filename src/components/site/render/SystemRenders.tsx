import type { ReactNode } from "react";

/*
 * Coded product renders for the public site. They mirror real platform
 * structures (record lineage, district/county review queue, offline capture
 * queue) with synthetic sample data only:
 *   - identifiers read "Sample farmer 01", "Sample plot 01", "Warehouse A → B"
 *     so they cannot be mistaken for production IDs (F-10492 style);
 *   - places are "District A/B", never real counties;
 *   - no counts, acreage, production values, timestamps or "live" markers.
 * Every render carries the visible label SAMPLE_LABEL. Renders are exposed to
 * assistive tech as one image with a plain description, not as fake data.
 */

export const SAMPLE_LABEL = "Illustrative system view · Sample data";

export type RecordState = "verified" | "synced" | "queued" | "review" | "pending" | "returned" | "transit";

const STATE: Record<RecordState, { label: string; cls: string }> = {
  verified: { label: "Verified", cls: "bg-[#DDEFE4] text-[#0A5A3A]" },
  synced: { label: "Synced", cls: "bg-[#DDEFE4] text-[#0A5A3A]" },
  queued: { label: "Queued offline", cls: "bg-[#E7EAF0] text-[#2E3F5C]" },
  review: { label: "In review", cls: "bg-[#F3E8CF] text-[#6B4F1C]" },
  pending: { label: "Pending", cls: "bg-[#ECECE3] text-[#4A5B50]" },
  returned: { label: "Returned", cls: "bg-[#F2DEDA] text-[#7A2A22]" },
  transit: { label: "In transit", cls: "bg-[#F3E8CF] text-[#6B4F1C]" },
};

export function StatusChip({ state, label }: { state: RecordState; label?: string }) {
  const s = STATE[state];
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-[2px] px-1.5 py-0.5 avs-meta text-[0.625rem] font-medium uppercase tracking-[0.06em] ${s.cls}`}>
      {label ?? s.label}
    </span>
  );
}

/** The visible sample label. `tone` follows the surface it sits on. */
export function SampleLabel({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <p
      className={`avs-label text-[0.6875rem] ${tone === "dark" ? "text-[rgb(var(--av-gold))]" : "text-[rgb(var(--av-gold-deep))]"} ${className}`}
      data-sample-label
    >
      {SAMPLE_LABEL}
    </p>
  );
}

export type LineageStep = { step: string; actor: string; status: "done" | "current" | "pending"; label: string };

/** A record and its lineage, as the platform shows it (sample data). */
export function RecordPanel({
  title,
  state = "synced",
  facts,
  steps,
  className = "",
}: {
  title: string;
  state?: RecordState;
  facts?: { k: string; v: string }[];
  steps: LineageStep[];
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--av-radius)] border border-[rgb(var(--av-line)/0.14)] bg-white text-[rgb(var(--av-forest))] shadow-[0_22px_44px_-26px_rgba(7,21,45,0.5)] ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--av-line)/0.1)] px-4 py-3">
        <p className="text-[0.875rem] font-semibold leading-tight">{title}</p>
        <StatusChip state={state} />
      </div>
      {facts?.length ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b border-[rgb(var(--av-line)/0.08)] px-4 py-2.5">
          {facts.map((f) => (
            <div key={f.k} className="contents">
              <dt className="avs-label pt-0.5 text-[0.625rem] text-[rgb(var(--av-slate))]">{f.k}</dt>
              <dd className="text-[0.8125rem] font-medium">{f.v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <ol className="px-4 py-2">
        {steps.map((s) => (
          <li key={s.step} className="flex items-center gap-3 py-1.5">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                s.status === "done"
                  ? "border-[rgb(var(--av-emerald-ink))] bg-[rgb(var(--av-emerald-ink))]"
                  : s.status === "current"
                    ? "border-[rgb(var(--av-gold-ink))] bg-white"
                    : "border-[rgb(var(--av-line)/0.3)] bg-white"
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] font-medium leading-tight">{s.step}</span>
              <span className="avs-meta block text-[0.6875rem] text-[rgb(var(--av-slate))]">{s.actor}</span>
            </span>
            <span
              className={`avs-meta shrink-0 text-[0.6875rem] uppercase tracking-[0.06em] ${
                s.status === "pending" ? "text-[rgb(var(--av-slate))]" : s.status === "current" ? "text-[rgb(var(--av-gold-ink))]" : "text-[rgb(var(--av-emerald-ink))]"
              }`}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="border-t border-[rgb(var(--av-line)/0.08)] bg-[rgb(var(--av-paper))] px-4 py-2 avs-meta text-[0.625rem] uppercase tracking-[0.08em] text-[rgb(var(--av-slate))]">
        {SAMPLE_LABEL}
      </p>
    </div>
  );
}

/** Tablet bezel for product renders. The only element on the site with a lifted shadow. */
export function TabletFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[var(--av-radius-lg)] bg-[#101C30] p-2 shadow-[0_28px_60px_-32px_rgba(7,21,45,0.7)] ring-1 ring-white/5 sm:p-2.5 ${className}`}
    >
      <div className="overflow-hidden rounded-[10px] bg-[#F4F5F0]">{children}</div>
    </div>
  );
}

const QUEUE: { id: string; kind: string; state: RecordState }[] = [
  { id: "Sample farmer 01", kind: "District A · registration", state: "review" },
  { id: "Sample plot 01", kind: "District B · plot outline", state: "verified" },
  { id: "Warehouse A → B", kind: "Transfer", state: "transit" },
  { id: "Sample farmer 02", kind: "District A · registration", state: "returned" },
];

/** County review queue, as the platform's reviewer workspace lays it out. */
export function ReviewQueueScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid min-h-[260px] grid-cols-1 text-[rgb(var(--av-forest))] sm:grid-cols-[7.5rem_1fr]" aria-hidden="true">
      <div className="hidden flex-col gap-2 bg-[rgb(var(--av-navy))] p-3 text-[0.6875rem] text-[rgb(var(--av-mist-2))] sm:flex">
        <span className="mb-1 text-[0.75rem] font-semibold text-white">AgriVault</span>
        <span>Overview</span>
        <span className="text-[rgb(var(--av-mint))]">Review queue</span>
        <span>Farmers</span>
        <span>Plots</span>
        <span>Transfers</span>
        <span>Reports</span>
      </div>
      <div className="grid content-start gap-3 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.8125rem] font-semibold">County review queue</p>
          <span className="avs-meta text-[0.625rem] uppercase tracking-[0.08em] text-[rgb(var(--av-gold-deep))]">Sample data</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Awaiting review", "Returned", "Approved"].map((k) => (
            <div key={k} className="rounded-[6px] border border-[rgb(var(--av-line)/0.12)] bg-white px-2 py-1.5">
              <span className="block text-[0.625rem] leading-tight text-[rgb(var(--av-slate))]">{k}</span>
              <span className="mt-1 block h-1.5 w-8 rounded-full bg-[rgb(var(--av-line)/0.12)]" />
            </div>
          ))}
        </div>
        <ul className="overflow-hidden rounded-[6px] border border-[rgb(var(--av-line)/0.12)] bg-white">
          {(compact ? QUEUE.slice(0, 3) : QUEUE).map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-2 border-b border-[rgb(var(--av-line)/0.08)] px-2.5 py-2 last:border-0">
              <span className="min-w-0">
                <span className="block truncate text-[0.75rem] font-medium">{q.id}</span>
                <span className="avs-meta block truncate text-[0.625rem] text-[rgb(var(--av-slate))]">{q.kind}</span>
              </span>
              <StatusChip state={q.state} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Field capture on a device: offline, with the queue visible to the officer. */
export function FieldCaptureScreen() {
  return (
    <div className="grid gap-3 p-3 text-[rgb(var(--av-forest))] sm:p-4" aria-hidden="true">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.8125rem] font-semibold">Register farmer</p>
        <StatusChip state="queued" label="Offline" />
      </div>
      <div className="grid gap-2">
        {[
          ["Farmer", "Sample farmer 01"],
          ["Area", "District A"],
          ["Plot", "Sample plot 01 · outline walked"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[6px] border border-[rgb(var(--av-line)/0.14)] bg-white px-2.5 py-1.5">
            <span className="avs-label block text-[0.5625rem] text-[rgb(var(--av-slate))]">{k}</span>
            <span className="block text-[0.75rem] font-medium">{v}</span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 200 84" className="h-auto w-full rounded-[6px] bg-[rgb(var(--av-linen))]">
        <path d="M0 64 C 50 56, 90 72, 200 58" fill="none" stroke="#B4564A" strokeWidth="2" opacity="0.7" />
        <path d="M70 18 L128 12 L140 50 L82 60 Z" fill="rgba(15,163,107,0.16)" stroke="#0A7D50" strokeWidth="2" strokeLinejoin="round" />
        {[
          [70, 18],
          [128, 12],
          [140, 50],
          [82, 60],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill="#F7F7F2" stroke="#0A7D50" strokeWidth="1.6" />
        ))}
      </svg>
      <div className="flex items-center justify-between rounded-[6px] bg-[rgb(var(--av-navy))] px-2.5 py-2 text-[0.6875rem] text-white">
        <span>Waiting to sync</span>
        <span className="avs-meta text-[rgb(var(--av-mint))]">Queued on device</span>
      </div>
    </div>
  );
}
