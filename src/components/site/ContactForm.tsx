"use client";

import { useRef, useState } from "react";

import { ArrowRight, Check } from "@/components/site/icons";
import { CONTACT_EMAIL, ENGAGEMENT_MODELS } from "@/lib/site/content";

type Field = "name" | "organisation" | "email" | "message";
type Values = Record<Field | "role" | "country" | "interest", string>;

const REQUIRED: Record<Field, string> = {
  name: "Enter your name.",
  organisation: "Enter your organisation.",
  email: "Enter an email address we can reply to.",
  message: "Tell us briefly about the programme or question.",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(field: Field, v: string): string | null {
  const value = v.trim();
  if (!value) return REQUIRED[field];
  if (field === "email" && !EMAIL_RE.test(value)) return "Enter an email address in the format name@organisation.org.";
  if (field === "message" && value.length < 20) return "Add a little more detail (at least 20 characters).";
  return null;
}

/**
 * Contact form with no backend: on submit it composes an email in the
 * visitor's own mail app (mailto). Nothing is sent to or stored by this site.
 * Labels are always visible; errors appear on blur and in a summary on submit.
 */
export default function ContactForm() {
  // Static prefix: one form per page, and ids appear in #fragment links from the error summary.
  const id = "contact";
  const [values, setValues] = useState<Values>({ name: "", organisation: "", role: "", email: "", country: "", interest: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const summary = useRef<HTMLDivElement>(null);
  const done = useRef<HTMLDivElement>(null);

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = e.target.value;
    setValues((s) => ({ ...s, [k]: v }));
    if (k in REQUIRED && errors[k as Field]) setErrors((s) => ({ ...s, [k]: validate(k as Field, v) ?? undefined }));
  };
  const blur = (k: Field) => () => setErrors((s) => ({ ...s, [k]: validate(k, values[k]) ?? undefined }));

  const body = () => {
    const optional: [string, string][] = [
      ["Role", values.role.trim()],
      ["Country", values.country.trim()],
      ["Interested in", values.interest],
    ];
    return [
      `Name: ${values.name.trim()}`,
      `Organisation: ${values.organisation.trim()}`,
      `Email: ${values.email.trim()}`,
      ...optional.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
      "",
      values.message.trim(),
    ].join("\n");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    (Object.keys(REQUIRED) as Field[]).forEach((f) => {
      const err = validate(f, values[f]);
      if (err) next[f] = err;
    });
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    const subject = `Conversation request — ${values.organisation.trim()}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body())}`;
    setSubmitted(true);
    requestAnimationFrame(() => done.current?.focus());
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const errorList = (Object.entries(errors) as [Field, string | undefined][]).filter(([, v]) => v);

  if (submitted) {
    return (
      <div ref={done} tabIndex={-1} role="status" className="avs-card p-7 outline-none md:p-9">
        <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--av-emerald)/0.15)] text-[rgb(var(--av-emerald-ink))]">
          <Check className="h-5 w-5" />
        </span>
        <h2 className="avs-h3 mt-5">Your email is ready to send.</h2>
        <p className="avs-body mt-3 text-[1.0625rem]">
          We opened a message to <strong className="font-medium text-[rgb(var(--av-forest))]">{CONTACT_EMAIL}</strong> in your
          email app. Send it from there and we will reply from the same address.
        </p>
        <p className="avs-body mt-3 text-[1.0625rem]">If nothing opened, copy your message and email it to us directly.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={copy} className="avs-btn avs-btn-primary">
            {copied ? "Message copied" : "Copy message"}
          </button>
          <button type="button" onClick={() => setSubmitted(false)} className="avs-btn avs-btn-ghost">
            Edit message
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {copied ? "Message copied to the clipboard." : ""}
        </p>
      </div>
    );
  }

  const input =
    "mt-2 block min-h-[48px] w-full rounded-[12px] border bg-white px-4 text-[1rem] text-[rgb(var(--av-forest))] outline-none transition-colors placeholder:text-[rgb(var(--av-slate)/0.7)] focus:border-[rgb(var(--av-emerald-ink))] focus:ring-2 focus:ring-[rgb(var(--av-emerald)/0.25)]";
  const border = (f?: Field) => (f && errors[f] ? "border-[rgb(var(--av-rust))]" : "border-[rgb(var(--av-line)/0.22)]");
  const describedBy = (f: Field, hint?: boolean) => [hint ? `${id}-${f}-hint` : "", errors[f] ? `${id}-${f}-err` : ""].filter(Boolean).join(" ") || undefined;
  const Err = ({ f }: { f: Field }) =>
    errors[f] ? (
      <p id={`${id}-${f}-err`} className="mt-2 flex items-center gap-2 text-[0.9375rem] text-[rgb(var(--av-rust))]">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--av-rust))]" />
        {errors[f]}
      </p>
    ) : null;
  const Label = ({ f, children, optional }: { f: string; children: React.ReactNode; optional?: boolean }) => (
    <label htmlFor={`${id}-${f}`} className="text-[0.9375rem] font-medium text-[rgb(var(--av-forest))]">
      {children}
      {optional ? <span className="ml-1.5 font-normal text-[rgb(var(--av-slate))]">(optional)</span> : null}
    </label>
  );

  return (
    <form noValidate onSubmit={onSubmit} aria-describedby={`${id}-privacy`} className="avs-card p-6 md:p-9">
      {errorList.length ? (
        <div
          ref={summary}
          tabIndex={-1}
          role="alert"
          className="mb-8 rounded-[12px] border border-[rgb(var(--av-rust)/0.4)] bg-[rgb(var(--av-rust)/0.06)] p-5 outline-none"
        >
          <p className="font-medium text-[rgb(var(--av-rust))]">Please check {errorList.length === 1 ? "one field" : `${errorList.length} fields`}:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem]">
            {errorList.map(([f, msg]) => (
              <li key={f}>
                <a href={`#${id}-${f}`} className="avs-link text-[rgb(var(--av-rust))]">
                  {msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label f="name">Name</Label>
          <input id={`${id}-name`} name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={describedBy("name")} value={values.name} onChange={set("name")} onBlur={blur("name")} className={`${input} ${border("name")}`} />
          <Err f="name" />
        </div>
        <div>
          <Label f="organisation">Organisation</Label>
          <input id={`${id}-organisation`} name="organisation" autoComplete="organization" required aria-invalid={!!errors.organisation} aria-describedby={describedBy("organisation")} value={values.organisation} onChange={set("organisation")} onBlur={blur("organisation")} className={`${input} ${border("organisation")}`} />
          <Err f="organisation" />
        </div>
        <div>
          <Label f="email">Work email</Label>
          <input id={`${id}-email`} name="email" type="email" inputMode="email" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={describedBy("email")} value={values.email} onChange={set("email")} onBlur={blur("email")} className={`${input} ${border("email")}`} />
          <Err f="email" />
        </div>
        <div>
          <Label f="role" optional>
            Role
          </Label>
          <input id={`${id}-role`} name="role" autoComplete="organization-title" value={values.role} onChange={set("role")} className={`${input} ${border()}`} />
        </div>
        <div>
          <Label f="country" optional>
            Country
          </Label>
          <input id={`${id}-country`} name="country" autoComplete="country-name" value={values.country} onChange={set("country")} className={`${input} ${border()}`} />
        </div>
        <div>
          <Label f="interest" optional>
            Interested in
          </Label>
          <select id={`${id}-interest`} name="interest" value={values.interest} onChange={set("interest")} className={`${input} ${border()} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10`} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234A5B50' stroke-width='1.6'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")" }}>
            <option value="">Not sure yet</option>
            {ENGAGEMENT_MODELS.map((m) => (
              <option key={m.n} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Label f="message">Message</Label>
          <p id={`${id}-message-hint`} className="mt-1 text-[0.875rem] text-[rgb(var(--av-slate))]">
            The programme, the institution, and where it runs today.
          </p>
          <textarea id={`${id}-message`} name="message" required rows={6} aria-invalid={!!errors.message} aria-describedby={describedBy("message", true)} value={values.message} onChange={set("message")} onBlur={blur("message")} className={`${input} ${border("message")} min-h-[160px] py-3`} />
          <Err f="message" />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-5 border-t border-[rgb(var(--av-line)/0.12)] pt-6 md:flex-row md:items-center md:justify-between">
        <p id={`${id}-privacy`} className="max-w-[28rem] text-[0.875rem] leading-relaxed text-[rgb(var(--av-slate))]">
          Submitting opens a pre-filled email in your own mail app. Nothing you type here is sent to or stored by this
          website.
        </p>
        <button type="submit" className="avs-btn avs-btn-primary shrink-0">
          Compose email <ArrowRight />
        </button>
      </div>
    </form>
  );
}
