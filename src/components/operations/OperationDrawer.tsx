"use client";

import * as React from "react";
import { X } from "lucide-react";

export default function OperationDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  widthClassName = "max-w-lg",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className={`relative h-full w-full ${widthClassName} bg-slate-950 border-l border-slate-700 shadow-2xl flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="min-w-0">
            <div className="font-display text-[16px] font-semibold text-white">{title}</div>
            {subtitle ? <div className="mt-1 text-[12px] text-slate-400">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 inline-flex items-center justify-center"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
