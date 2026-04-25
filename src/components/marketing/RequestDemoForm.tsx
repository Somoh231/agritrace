"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { track } from "@/lib/analytics/client";

export default function RequestDemoForm() {
  const [full_name, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/demo-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name,
          email,
          organization,
          phone,
          message,
          source: "request_demo",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Request failed.");
        return;
      }
      track("demo_request_submitted", { source: "request_demo" });
      setDone(true);
      setFullName("");
      setEmail("");
      setOrganization("");
      setPhone("");
      setMessage("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/"
        className="inline-flex text-[12px] text-forest-700 hover:underline underline-offset-2 mb-6"
      >
        ← Back to home
      </Link>

      <div className="av-card p-6 sm:p-8">
        <h1 className="font-display text-2xl sm:text-[30px] text-ink-900">Request a demo</h1>
        <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
          Ministry teams, exporters, and cooperatives use Agrivault for traceability and compliance.
          We will respond within two business days.
        </p>

        {done ? (
          <div className="mt-6 rounded-xl border border-forest-200 bg-forest-50 p-5 text-[13px] text-forest-900">
            Thank you. Your request was received. Our team will contact you shortly.
            <div className="mt-4">
              <Link href="/login" className="text-forest-800 font-medium underline underline-offset-2">
                Go to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error ? <AlertBanner severity="danger" message={error} /> : null}

            <Field label="Full name" required>
              <input
                required
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                className="av-input"
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Work email" required>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="av-input"
                placeholder="you@ministry.gov.lr"
              />
            </Field>
            <Field label="Organization">
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="av-input"
                placeholder="Ministry / cooperative / exporter"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="av-input"
                placeholder="+231 …"
              />
            </Field>
            <Field label="What would you like to see?">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="min-h-[110px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-50"
                placeholder="Rice visibility, cocoa chain of custody, EUDR, pilot rollout…"
              />
            </Field>

            <button
              type="submit"
              disabled={busy || !full_name.trim() || !email.trim()}
              className="av-btn-primary w-full h-12 text-[14px] disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Submit request"
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              By submitting, you agree we may contact you about Agrivault. We do not sell your data.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
