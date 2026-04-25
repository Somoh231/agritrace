import * as React from "react";

export default function Drawer({
  title,
  isOpen,
  onClose,
  children,
  widthClass = "w-[380px]",
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="relative">
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-soft">
        <div className="h-12 px-5 border-b border-gray-100 flex items-center justify-between">
          <div className="font-display text-[15px] text-ink-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="av-btn-secondary h-9 px-3"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>

      <div className={`hidden ${widthClass}`} />
    </div>
  );
}

