import { cookies } from "next/headers";

export type HeroVariant = "control" | "authority";

const HERO_COOKIE = "av_exp_home_hero";

export function isHomepageHeroExperimentEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_HOMEPAGE_EXPERIMENT !== "false";
}

export function getHeroVariant(): HeroVariant {
  if (!isHomepageHeroExperimentEnabled()) return "control";
  try {
    const value = cookies().get(HERO_COOKIE)?.value;
    if (value === "authority") return "authority";
    return "control";
  } catch {
    // Cookies access can fail outside request scope; keep homepage stable.
    return "control";
  }
}

export const HERO_EXPERIMENT = {
  key: "homepage_hero_copy_v1",
  cookie: HERO_COOKIE,
};

