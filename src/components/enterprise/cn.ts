/** Minimal className merge — avoids pulling clsx/tailwind-merge for pilot bundle size. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
