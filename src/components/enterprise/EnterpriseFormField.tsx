import type { ReactNode } from "react";

import { cn } from "@/components/enterprise/cn";

export function EnterpriseFormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("space-y-4 rounded-xl border border-slate-100 bg-slate-50/40 p-4", className)}>
      <legend className="px-1">
        <span className="ent-section-title text-[14px]">{title}</span>
        {description ? <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{description}</p> : null}
      </legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

export default function EnterpriseFormField({
  id,
  label,
  required,
  helper,
  hint,
  children,
  className,
}: {
  id?: string;
  label: string;
  required?: boolean;
  helper?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="ent-label">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </label>
      {helper ? <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{helper}</p> : null}
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function EnterpriseFormActions({
  onCancel,
  submitLabel,
  saving,
  children,
}: {
  onCancel: () => void;
  submitLabel: string;
  saving?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
      {children}
      <button type="button" onClick={onCancel} className="btn-gov-outline h-10 rounded-lg px-4 text-[13px]">
        Cancel
      </button>
      <button type="submit" disabled={saving} className="btn-emerald h-10 rounded-lg px-5 text-[13px] disabled:opacity-50">
        {saving ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}
