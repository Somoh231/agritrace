export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-10">
      <div className="max-w-2xl">
        <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-emerald-300/70">
          Offline operational mode
        </div>
        <h1 className="mt-2 font-display text-[22px] font-semibold tracking-tight">
          Connectivity unavailable
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
          Agrivault is in offline posture. You can keep working on field capture and drafts; queued records
          will synchronize automatically when connection is restored.
        </p>
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-[12px] text-slate-300">
          <div className="font-semibold text-white">Next actions</div>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>· Open <span className="font-mono text-slate-200">/field/mobile</span> to capture offline checklists.</li>
            <li>· Review <span className="font-mono text-slate-200">/field/sync-queue</span> when you are online to push reconciliations.</li>
            <li>· If you just installed the app, keep it open — the service worker will cache core shells.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

