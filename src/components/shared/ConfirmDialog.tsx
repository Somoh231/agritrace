"use client";

import * as React from "react";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  isOpen,
  onCancel,
  onConfirm,
  isBusy,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
  isOpen: boolean;
  isBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;
  const confirmCls =
    tone === "danger"
      ? "bg-red-700 hover:bg-red-800 text-white"
      : "bg-forest-800 hover:bg-forest-900 text-white";

  return (
    <div className="fixed inset-0 z-[120] bg-black/30 flex items-center justify-center px-4">
      <div className="w-full max-w-[440px] rounded-2xl border border-gray-200 bg-white shadow-lift overflow-hidden">
        <div className="p-5">
          <div className="font-display text-[17px] text-ink-900">{title}</div>
          <div className="mt-2 text-[13px] text-slate-600 leading-relaxed">{message}</div>
        </div>
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="av-btn-secondary h-10 px-4 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`h-10 px-4 rounded-xl text-[12px] font-medium shadow-sm disabled:opacity-50 ${confirmCls}`}
          >
            {isBusy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

