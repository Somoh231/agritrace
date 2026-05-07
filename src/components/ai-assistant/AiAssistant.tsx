"use client";

import * as React from "react";
import { Bot, ChevronDown, ChevronUp, CornerDownLeft, Maximize2, Minimize2, Trash2 } from "lucide-react";

import type { UserRole } from "@/lib/supabase/types";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

function roleLabel(role: UserRole): string {
  if (role === "warehouse_manager") return "Warehouse intelligence";
  if (role === "district_officer" || role === "field_agent") return "DAO support";
  if (role === "county_officer") return "CAO operations";
  if (role === "donor_partner" || role === "auditor") return "Transparency & audit";
  return "Ministry operations";
}

function quickActionsForRole(role: UserRole): Array<{ label: string; prompt: string }> {
  const base = [
    { label: "Food Security Risks", prompt: "Which counties have the highest food security risk? Provide a ranked list with reasons and recommended actions." },
    { label: "DAO Compliance", prompt: "Summarize DAO reporting compliance. Which DAOs have overdue reports and where should supervision focus?" },
    { label: "Inventory Risks", prompt: "Which warehouses show inventory risk signals (low stock, expiry, loss movements)? Summarize and recommend actions." },
    { label: "County Performance", prompt: "Summarize county performance: production index, DAO compliance, and any deviations or alerts. Provide intervention priorities." },
    { label: "Generate Briefing", prompt: "Generate a minister-ready briefing for this week: Situation, Risks, Recommended actions." },
    { label: "Warehouse Alerts", prompt: "Identify warehouse utilization pressure, delays, and stockout risk. Which hubs need immediate redistribution?" },
    { label: "Subsidy Progress", prompt: "Show subsidy distribution progress and flag potential fraud/anomalies. Recommend audit checks." },
  ];

  if (role === "donor_partner" || role === "auditor") {
    return [
      { label: "Donor Summary", prompt: "Summarize programme utilization and delivery verification posture. Include what evidence chains are available and what is redacted." },
      { label: "Audit Chain", prompt: "Explain the subsidy verification chain and how to validate it across distribution_logs, geo_locations, and audit_log." },
      ...base.filter((x) => x.label !== "Generate Briefing"),
      { label: "Generate Briefing", prompt: "Generate a donor-ready programme briefing: posture, delivery progress, risks, and recommended audit checks." },
    ];
  }

  if (role === "warehouse_manager") {
    return [
      { label: "Stockout forecast", prompt: "Which SKUs are at risk of stockout and what is the estimated runway? Recommend inbound transfers and receipts prioritization." },
      { label: "Expiry risks", prompt: "Which inventory lines have expiry risk within 90 days? Provide a mitigation plan." },
      ...base,
    ];
  }

  return base;
}

function storageKey(profileId: string, role: UserRole) {
  return `agrivault-ai-assistant:${profileId}:${role}`;
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function AiAssistant({
  profileId,
  role,
  pathname,
}: {
  profileId: string;
  role: UserRole;
  pathname: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [maximized, setMaximized] = React.useState(false);
  const [minimized, setMinimized] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [showActions, setShowActions] = React.useState(true);

  const key = storageKey(profileId, role);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ChatMsg[];
      if (Array.isArray(parsed)) setMessages(parsed);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(messages.slice(-80)));
    } catch {
      /* ignore */
    }
  }, [key, messages]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setMinimized(false);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
        setMaximized(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (prompt: string) => {
    const text = prompt.trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);
    setOpen(true);
    setMinimized(false);

    const userMsg: ChatMsg = { id: newId(), role: "user", content: text, createdAt: Date.now() };
    const assistantId = newId();
    const assistantMsg: ChatMsg = { id: assistantId, role: "assistant", content: "", createdAt: Date.now() };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          pathname,
          messages: [...messages, userMsg].map((x) => ({ role: x.role, content: x.content })),
        }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `AI request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: acc } : x)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown AI error");
      setMessages((m) =>
        m.map((x) => (x.id === assistantId ? { ...x, content: "Unable to generate response. Check server configuration and RLS context visibility." } : x)),
      );
    } finally {
      setBusy(false);
    }
  };

  const actions = React.useMemo(() => quickActionsForRole(role), [role]);
  const headerSub = roleLabel(role);

  if (!open && minimized) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setMinimized(false);
        }}
        className="fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full border border-emerald-700/40 bg-emerald-950/60 px-4 py-3 text-[12px] font-medium text-emerald-100 shadow-2xl hover:bg-emerald-950/80"
        aria-label="Open Agrivault AI Assistant"
      >
        <Bot className="h-4 w-4" aria-hidden />
        AI assistant
      </button>
    );
  }

  return (
    <>
      {/* Floating button */}
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          className="fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-4 py-3 text-[12px] font-medium text-white shadow-2xl hover:bg-slate-900"
          aria-label="Open Agrivault AI Assistant"
        >
          <Bot className="h-4 w-4 text-emerald-300" aria-hidden />
          Agrivault AI
          <span className="ml-1 rounded-full border border-white/10 bg-black/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
            Ctrl/⌘K
          </span>
        </button>
      ) : null}

      {/* Drawer */}
      {open ? (
        <div className="fixed inset-0 z-[95]">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close assistant"
            onClick={() => {
              setOpen(false);
              setMaximized(false);
            }}
          />
          <aside
            className={`absolute right-0 top-0 h-full w-[min(96vw,460px)] border-l border-white/10 bg-gradient-to-b from-[#050810] via-slate-950/90 to-black shadow-2xl ${
              maximized ? "md:w-[min(96vw,640px)]" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-emerald-300/75">Operational copilot</div>
                <div className="mt-1 font-display text-[15px] font-semibold text-white">Agrivault AI Assistant</div>
                <div className="mt-1 text-[11px] text-slate-500">{headerSub}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowActions((s) => !s)}
                  className="h-9 w-9 rounded-lg border border-white/10 bg-black/20 text-slate-200 hover:bg-white/[0.06] grid place-items-center"
                  aria-label="Toggle quick actions"
                >
                  {showActions ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMaximized((m) => !m)}
                  className="h-9 w-9 rounded-lg border border-white/10 bg-black/20 text-slate-200 hover:bg-white/[0.06] grid place-items-center"
                  aria-label={maximized ? "Minimize width" : "Maximize width"}
                >
                  {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMinimized(true);
                    setOpen(false);
                    setMaximized(false);
                  }}
                  className="h-9 w-9 rounded-lg border border-white/10 bg-black/20 text-slate-200 hover:bg-white/[0.06] grid place-items-center"
                  aria-label="Minimize assistant"
                >
                  <Minimize2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>

            {showActions ? (
              <div className="border-b border-white/10 px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => void send(a.prompt)}
                      disabled={busy}
                      className="rounded-full border border-emerald-900/35 bg-emerald-950/25 px-3 py-1.5 text-[11px] text-emerald-100 hover:bg-emerald-950/40 disabled:opacity-50"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex h-[calc(100%-220px)] flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-4 text-[12px] text-slate-400">
                    Ask operational questions about counties, warehouses, DAO cadence, subsidies, incidents, or briefing generation.
                  </div>
                ) : null}
                {messages.map((m) => (
                  <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={`max-w-[92%] rounded-xl border px-3 py-2 text-[12px] leading-relaxed ${
                        m.role === "user"
                          ? "border-emerald-800/45 bg-emerald-950/25 text-emerald-50"
                          : "border-white/10 bg-black/25 text-slate-200"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                          {m.role === "user" ? "You" : "AI"} · {formatTime(m.createdAt)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{m.content || (m.role === "assistant" && busy ? "…" : "")}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 px-4 py-3">
                {error ? (
                  <div className="mb-2 rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-[12px] text-rose-200">
                    {error}
                  </div>
                ) : null}
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={2}
                    placeholder="Ask an operational question…"
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[12px] text-slate-100 outline-none focus:border-emerald-700/70"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void send(input);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void send(input)}
                    disabled={busy || !input.trim()}
                    className="h-11 rounded-xl bg-emerald-700 px-4 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <CornerDownLeft className="h-4 w-4" aria-hidden />
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-[12px] text-slate-200 hover:bg-white/[0.06] inline-flex items-center gap-2"
                    aria-label="Clear conversation"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
                  <span>Streaming enabled · Ctrl/⌘ + Enter to send</span>
                  <span className="font-mono">No direct DB access from Claude</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

