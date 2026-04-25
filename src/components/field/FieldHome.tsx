"use client";

import * as React from "react";

import CreateLotQuick from "@/components/field/forms/CreateLotQuick";
import LogMovementQuick from "@/components/field/forms/LogMovementQuick";
import RegisterFarmerQuick from "@/components/field/forms/RegisterFarmerQuick";

type View = "home" | "register" | "lot" | "movement";

function BigButton({
  label,
  sub,
  onClick,
}: {
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:bg-gray-50 active:scale-[0.99] transition"
    >
      <div className="font-display text-[18px] text-gray-900">{label}</div>
      <div className="mt-1 text-[12px] text-gray-600">{sub}</div>
    </button>
  );
}

function FullscreenFormShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-46px)] bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700"
        >
          Back
        </button>
        <div className="font-display text-[16px] text-gray-900">{title}</div>
        <div className="w-[72px]" />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function FieldHome() {
  const [view, setView] = React.useState<View>("home");

  if (view === "register") {
    return (
      <FullscreenFormShell title="Register farmer" onBack={() => setView("home")}>
        <RegisterFarmerQuick onDone={() => setView("home")} />
      </FullscreenFormShell>
    );
  }
  if (view === "lot") {
    return (
      <FullscreenFormShell title="Create lot" onBack={() => setView("home")}>
        <CreateLotQuick onDone={() => setView("home")} />
      </FullscreenFormShell>
    );
  }
  if (view === "movement") {
    return (
      <FullscreenFormShell title="Log movement" onBack={() => setView("home")}>
        <LogMovementQuick onDone={() => setView("home")} />
      </FullscreenFormShell>
    );
  }

  return (
    <div className="min-h-[calc(100vh-46px)] bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="font-display text-[18px] text-gray-900">Field entry</div>
          <div className="mt-1 text-[12px] text-gray-600">
            Mobile-first workflows with large touch targets.
          </div>
        </div>

        <BigButton
          label="Register Farmer"
          sub="Capture identity + location + cooperative."
          onClick={() => setView("register")}
        />
        <BigButton
          label="Create Lot"
          sub="Create a new cocoa lot with origin and weight."
          onClick={() => setView("lot")}
        />
        <BigButton
          label="Log Movement"
          sub="Record a handoff with dispatched weight + transport details."
          onClick={() => setView("movement")}
        />
      </div>
    </div>
  );
}

