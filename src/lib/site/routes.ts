/** Routes served by the public corporate site ((site) route group). */
export const PUBLIC_SITE_ROUTES = [
  "/",
  "/what-we-do",
  "/products",
  "/programmes",
  "/programmes/liberia",
  "/how-we-work",
  "/governments",
  "/security",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
] as const;

export function isPublicSitePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return (PUBLIC_SITE_ROUTES as readonly string[]).includes(p);
}
