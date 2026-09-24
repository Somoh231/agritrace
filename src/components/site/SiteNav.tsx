"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { AgriVaultLockup } from "@/components/site/AgriVaultMark";
import { ArrowRight, Chevron, CloseIcon, MenuIcon } from "@/components/site/icons";
import { NAV, type NavGroup } from "@/lib/site/content";

const HOVER_OPEN_MS = 110;
const HOVER_CLOSE_MS = 220;

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const headerRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  // How the current menu was opened. A click on a hover-opened menu pins it open
  // instead of toggling it shut (hover-intent can fire just before the click lands).
  const openedBy = useRef<"hover" | "click">("click");
  const panelId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [pathname]);

  const close = useCallback((returnFocus: boolean) => {
    setOpen((current) => {
      if (returnFocus && current) triggers.current[current]?.focus();
      return null;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  const scheduleHover = (id: string | null, delay: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      openedBy.current = "hover";
      setOpen(id);
    }, delay);
  };

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowDown") return;
    e.preventDefault();
    if (e.key === "ArrowDown") {
      openedBy.current = "click";
      setOpen(NAV[index].id);
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLAnchorElement>(`#${CSS.escape(panelId)} a`)?.focus();
      });
      return;
    }
    const next = (index + (e.key === "ArrowRight" ? 1 : NAV.length - 1)) % NAV.length;
    triggers.current[NAV[next].id]?.focus();
    if (open) setOpen(NAV[next].id);
  };

  const solid = scrolled || open !== null;
  const active = NAV.find((g) => g.id === open) ?? null;

  return (
    <header
      ref={headerRef}
      className="avs-on-dark fixed inset-x-0 top-0 z-50"
      onMouseLeave={() => open && scheduleHover(null, HOVER_CLOSE_MS)}
    >
      <div
        className={`transition-[background-color,border-color,backdrop-filter] duration-300 ${
          solid ? "border-b border-white/10 bg-[rgb(7_21_45/0.92)] backdrop-blur-md" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="avs-container flex h-[var(--av-header-h)] items-center gap-6">
          <Link href="/" aria-label="AgriVault Data — home" className="shrink-0 rounded-md">
            <AgriVaultLockup tone="light" />
          </Link>

          <nav aria-label="Primary" className="hidden xl:ml-8 xl:block">
            <ul className="flex items-center gap-0.5">
              {NAV.map((group, i) => {
                const isOpen = open === group.id;
                const current = pathname === group.href || pathname?.startsWith(`${group.href}/`);
                return (
                  <li key={group.id}>
                    <button
                      ref={(el) => {
                        triggers.current[group.id] = el;
                      }}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={isOpen ? panelId : undefined}
                      onClick={() => {
                        window.clearTimeout(hoverTimer.current);
                        const pinHoverOpened = isOpen && openedBy.current === "hover";
                        openedBy.current = "click";
                        setOpen(isOpen && !pinHoverOpened ? null : group.id);
                      }}
                      onMouseEnter={() => scheduleHover(group.id, open ? 0 : HOVER_OPEN_MS)}
                      onKeyDown={(e) => onTriggerKey(e, i)}
                      className={`group inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[0.9375rem] transition-colors ${
                        isOpen ? "bg-white/10 text-white" : current ? "text-white" : "text-white/80 hover:text-white"
                      }`}
                    >
                      {group.label}
                      <Chevron className={`h-3.5 w-3.5 opacity-70 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Link href="/login" className="hidden rounded-full px-3.5 py-2 text-[0.9375rem] text-white/80 transition-colors hover:text-white xl:inline-flex">
              Sign in
            </Link>
            <Link href="/contact" className="avs-btn avs-btn-primary !min-h-[44px] !px-5 !text-[0.9375rem]">
              Start a conversation
            </Link>
          </div>

          <button
            type="button"
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white md:ml-2 xl:hidden"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {active ? (
        <MegaPanel
          id={panelId}
          group={active}
          onMouseEnter={() => window.clearTimeout(hoverTimer.current)}
          onNavigate={() => setOpen(null)}
        />
      ) : null}

      {mobileOpen ? <MobileNav onClose={() => setMobileOpen(false)} /> : null}
    </header>
  );
}

function MegaPanel({
  id,
  group,
  onMouseEnter,
  onNavigate,
}: {
  id: string;
  group: NavGroup;
  onMouseEnter: () => void;
  onNavigate: () => void;
}) {
  return (
    <div
      id={id}
      onMouseEnter={onMouseEnter}
      className="avs-megamenu absolute inset-x-0 top-full hidden border-b border-white/10 bg-[rgb(7_21_45/0.98)] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] backdrop-blur-xl xl:block"
    >
      <div className="avs-container grid grid-cols-12 gap-8 py-10">
        <div className="col-span-3 border-r border-white/10 pr-8">
          <p className="avs-label text-[rgb(var(--av-gold))]">{group.label}</p>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/80">{group.intro}</p>
          <Link href={group.href} onClick={onNavigate} className="avs-arrow-link mt-6 text-[0.9375rem]">
            Overview <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className={`${group.feature ? "col-span-6" : "col-span-9"} grid gap-8 ${group.columns.length > 1 ? "grid-cols-2" : ""}`}>
          {group.columns.map((col) => (
            <div key={col.title}>
              <p className="avs-label mb-3 text-white/55">{col.title}</p>
              <ul className={`grid gap-x-8 ${col.items.length > 4 && group.columns.length === 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className="group -mx-3 block rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="flex items-center gap-2 text-[0.975rem] font-medium text-white">
                        {item.label}
                        <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
                      </span>
                      {item.description ? (
                        <span className="mt-1 block text-[0.875rem] leading-snug text-white/65">{item.description}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {group.feature ? (
          <Link
            href={group.feature.href}
            onClick={onNavigate}
            className="group relative col-span-3 overflow-hidden rounded-2xl border border-white/10 bg-[rgb(var(--av-forest))] p-6"
          >
            <span className="avs-label block text-[rgb(var(--av-gold))]">{group.feature.eyebrow}</span>
            <span className="mt-8 block text-[1.375rem] font-medium leading-tight tracking-[-0.02em] text-white">{group.feature.title}</span>
            <span className="mt-3 block text-[0.9rem] leading-snug text-white/75">{group.feature.body}</span>
            <span className="avs-arrow-link mt-6 text-[0.9rem]">
              {group.feature.cta} <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function MobileNav({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="fixed inset-0 z-[60] flex flex-col bg-[rgb(var(--av-navy))] text-white xl:hidden"
    >
      <div className="avs-container flex h-[var(--av-header-h)] shrink-0 items-center justify-between border-b border-white/10">
        <Link href="/" onClick={onClose} aria-label="AgriVault Data — home">
          <AgriVaultLockup tone="light" />
        </Link>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      <nav aria-label="Primary" className="avs-container flex-1 overflow-y-auto py-4">
        <ul>
          {NAV.map((group) => {
            const isOpen = expanded === group.id;
            return (
              <li key={group.id} className="border-b border-white/10">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : group.id)}
                  className="flex w-full items-center justify-between py-5 text-left text-[1.375rem] font-medium tracking-[-0.02em]"
                >
                  {group.label}
                  <Chevron className={`h-5 w-5 opacity-70 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen ? (
                  <ul className="pb-5">
                    <li>
                      <Link href={group.href} onClick={onClose} className="avs-arrow-link block py-2.5 text-[1rem]">
                        {group.label} overview <ArrowRight className="h-4 w-4" />
                      </Link>
                    </li>
                    {group.columns.flatMap((c) => c.items).map((item) => (
                      <li key={item.label}>
                        <Link href={item.href} onClick={onClose} className="block py-2.5 text-[1rem] text-white/80">
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="avs-container grid shrink-0 grid-cols-2 gap-3 border-t border-white/10 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Link href="/login" onClick={onClose} className="avs-btn avs-btn-ghost">
          Sign in
        </Link>
        <Link href="/contact" onClick={onClose} className="avs-btn avs-btn-primary">
          Start a conversation
        </Link>
      </div>
    </div>
  );
}
