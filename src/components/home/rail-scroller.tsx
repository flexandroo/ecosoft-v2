"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Horizontal product rail with arrow buttons (arrows on desktop, swipe on phones). */
export function RailScroller({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div
        ref={ref}
        role="list"
        aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="pointer-events-none absolute -top-16 right-0 hidden gap-2 md:flex">
        <button
          type="button"
          aria-label="Прокрутити назад"
          onClick={() => scroll(-1)}
          className="pointer-events-auto grid size-11 place-items-center rounded-full border border-border bg-card hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Прокрутити вперед"
          onClick={() => scroll(1)}
          className="pointer-events-auto grid size-11 place-items-center rounded-full border border-border bg-card hover:bg-muted"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
