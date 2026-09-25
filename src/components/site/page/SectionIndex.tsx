"use client";

import { useEffect, useState } from "react";

/** Sticky in-page index (lg+). Highlights the section crossing the middle of the viewport. */
export function SectionIndex({ items, label = "On this page" }: { items: { id: string; n: string; label: string }[]; label?: string }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label={label} className="sticky top-[calc(var(--av-header-h)+32px)]">
      <p className="avs-label text-[rgb(var(--av-slate))]">{label}</p>
      <ol className="mt-4 border-l border-[rgb(var(--av-line)/0.14)]">
        {items.map((i) => {
          const on = i.id === active;
          return (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                aria-current={on ? "location" : undefined}
                className={`-ml-px flex min-h-[40px] items-center gap-3 border-l-2 py-1.5 pl-4 text-[0.9375rem] leading-snug transition-colors ${
                  on
                    ? "border-[rgb(var(--av-emerald))] font-medium text-[rgb(var(--av-forest))]"
                    : "border-transparent text-[rgb(var(--av-slate))] hover:text-[rgb(var(--av-forest))]"
                }`}
              >
                <span className="avs-meta">{i.n}</span>
                {i.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
