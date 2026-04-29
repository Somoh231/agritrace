import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type PublicContent = {
  homepage: {
    heroBadge: string;
    heroTitleA: string;
    heroTitleB: string;
    heroBody: string;
    ctaPrimary: string;
    ctaSecondary: string;
    contactLine: string;
  };
  platform: {
    heroTitle: string;
    heroBody: string;
    ctaExplore: string;
    ctaDemo: string;
  };
  contact: {
    contactName: string;
    contactRole: string;
    contactEmail: string;
    contactPhone: string;
    contactLocations: string;
  };
};

export const DEFAULT_PUBLIC_CONTENT: PublicContent = {
  homepage: {
    heroBadge: "Pilot live — Ministry of Agriculture, Republic of Liberia · 2025–26",
    heroTitleA: "Agricultural traceability infrastructure for Africa's economy.",
    heroTitleB: "Trusted agricultural data infrastructure for public and export markets.",
    heroBody:
      "Verified farmer registries, GPS-mapped plots, season-by-season production records, and the compliance documentation that unlocks capital, exports, and government services.",
    ctaPrimary: "Request a demo",
    ctaSecondary: "See Liberia pilot",
    contactLine: "Used by ministries, cooperatives, and exporters. No card required.",
  },
  platform: {
    heroTitle: "Explore AgriVault before integrations are switched on.",
    heroBody:
      "Walk through dashboard intelligence, county maps, donor-ready reports, and field workflows with production-grade mock data.",
    ctaExplore: "Explore Platform",
    ctaDemo: "Request Demo",
  },
  contact: {
    contactName: "Mohammed Donzo Soumaoro",
    contactRole: "Founder & CEO, AgriVault Data",
    contactEmail: "msdonzo@agrivaultdata.com",
    contactPhone: "+1 571-427-5538",
    contactLocations: "Sacramento, CA · Monrovia, Liberia",
  },
};

const CONTENT_KEYS = ["homepage", "platform", "contact"] as const;

export async function getPublicContent(): Promise<PublicContent> {
  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch {
    return DEFAULT_PUBLIC_CONTENT;
  }

  try {
    const { data, error } = await admin.from("public_content_blocks").select("key,value").eq("locale", "en");
    if (error || !data) return DEFAULT_PUBLIC_CONTENT;
    const merged: PublicContent = structuredClone(DEFAULT_PUBLIC_CONTENT);
    for (const row of data as any[]) {
      if (CONTENT_KEYS.includes(row.key) && row.value && typeof row.value === "object") {
        (merged as any)[row.key] = { ...(merged as any)[row.key], ...(row.value as Record<string, unknown>) };
      }
    }
    return merged;
  } catch {
    return DEFAULT_PUBLIC_CONTENT;
  }
}

