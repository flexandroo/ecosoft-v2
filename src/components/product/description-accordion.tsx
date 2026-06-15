"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function DescriptionAccordion({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > 280;
  const visible = open || !isLong ? text : text.slice(0, 280) + "…";

  return (
    <div className="space-y-4">
      <p className="text-base leading-relaxed text-foreground whitespace-pre-line">{visible}</p>
      {isLong && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {open ? "Згорнути" : "Показати більше"}
          <ChevronDown
            className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
