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
    heroBadge: "",
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

    // structuredClone can throw in some edge runtimes; fall back to JSON clone.
    let merged: PublicContent;
    try {
      merged = structuredClone(DEFAULT_PUBLIC_CONTENT);
    } catch {
      merged = JSON.parse(JSON.stringify(DEFAULT_PUBLIC_CONTENT)) as PublicContent;
    }

    for (const row of data as any[]) {
      if (!row) continue;
      const key = typeof row.key === "string" ? row.key : null;
      if (!key) continue;
      if (!CONTENT_KEYS.includes(key as (typeof CONTENT_KEYS)[number])) continue;
      if (!row.value || typeof row.value !== "object") continue;

      const current = (merged as any)[key];
      (merged as any)[key] = {
        ...(typeof current === "object" && current ? current : {}),
        ...(row.value as Record<string, unknown>),
      };
    }
    return merged;
  } catch {
    return DEFAULT_PUBLIC_CONTENT;
  }
}

