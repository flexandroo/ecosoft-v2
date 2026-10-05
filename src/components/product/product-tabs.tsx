"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ProductTab = { id: string; label: string; content: React.ReactNode };

/**
 * Sticky tab bar (Опис / Характеристики / Документи). All panels stay in the
 * HTML for search engines; inactive ones are hidden. Links to "#specs" etc.
 * open the matching tab.
 */
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) {
        setActive(id);
        document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  return (
    <div id="product-tabs" className="scroll-mt-44 md:scroll-mt-28">
      <div className="sticky top-[121px] z-30 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur-md md:top-[108px] md:-mx-8 md:px-8">
        <div role="tablist" aria-label="Інформація про товар" className="flex gap-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => {
                setActive(t.id);
                window.history.replaceState(null, "", `#${t.id}`);
              }}
              className={cn(
                "relative shrink-0 py-4 text-sm font-semibold whitespace-nowrap transition-colors",
                active === t.id
                  ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id} className="pt-8 md:pt-10">
          {t.content}
        </div>
      ))}
    </div>
  );
}
