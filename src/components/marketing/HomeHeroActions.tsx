"use client";

import * as React from "react";
import Link from "next/link";

import { track } from "@/lib/analytics/client";

type Props = {
  variant: "control" | "authority";
  primaryLabel: string;
  secondaryLabel: string;
};

export default function HomeHeroActions({ variant, primaryLabel, secondaryLabel }: Props) {
  React.useEffect(() => {
    track("experiment_exposure", {
      experiment: "homepage_hero_copy_v1",
      variant,
    });
  }, [variant]);

  const click = (label: string) => track("cta_click", { label, placement: "homepage_hero", variant });

  return (
    <div className="hero-anim-3" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      <Link
        href="/request-demo"
        className="btn-primary"
        style={{ borderRadius: 8, padding: "14px 28px", fontSize: 16 }}
        onClick={() => click("request_demo")}
      >
        {primaryLabel} →
      </Link>
      <Link
        href="/liberia"
        className="btn-outline"
        style={{ borderRadius: 8, padding: "14px 28px", fontSize: 16 }}
        onClick={() => click("see_liberia_pilot")}
      >
        {secondaryLabel} ↓
      </Link>
      <Link
        href="/government"
        className="btn-outline"
        style={{ borderRadius: 8, padding: "14px 28px", fontSize: 16 }}
        onClick={() => click("government_partnership")}
      >
        Government partnership
      </Link>
    </div>
  );
}

