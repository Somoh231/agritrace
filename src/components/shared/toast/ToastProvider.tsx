"use client";

import * as React from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export type Toast = {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
  createdAt: number;
};

type ToastContextValue = {
  push: (t: Omit<Toast, "id" | "createdAt"> & { id?: string }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (t: Omit<Toast, "id" | "createdAt"> & { id?: string }) => {
      const toast: Toast = {
        id: t.id ?? uid(),
        tone: t.tone,
        title: t.title,
        message: t.message,
        createdAt: Date.now(),
      };
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      window.setTimeout(() => remove(toast.id), 4500);
    },
    [remove],
  );

  const api = React.useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, message) => push({ tone: "success", title, message }),
      error: (title, message) => push({ tone: "error", title, message }),
      info: (title, message) => push({ tone: "info", title, message }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] w-[340px] max-w-[calc(100vw-32px)] space-y-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icon =
    toast.tone === "success" ? (
      <CheckCircle2 className="h-4 w-4 text-green-700 mt-0.5" />
    ) : toast.tone === "error" ? (
      <XCircle className="h-4 w-4 text-red-700 mt-0.5" />
    ) : (
      <CheckCircle2 className="h-4 w-4 text-gray-700 mt-0.5" />
    );

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-3">
      <div className="flex items-start gap-2">
        {icon}
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-gray-900">{toast.title}</div>
          {toast.message ? <div className="text-[11px] text-gray-500">{toast.message}</div> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-md hover:bg-gray-50 grid place-items-center text-gray-500"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

