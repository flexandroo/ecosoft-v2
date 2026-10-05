"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, X } from "lucide-react";
import type { MediaAsset } from "@/lib/media-upload";
import { getBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

/** Modal grid of library images; returns the chosen public URLs. */
export function MediaPicker({
  multiple,
  onPick,
  onClose,
}: {
  multiple: boolean;
  onPick: (urls: string[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      let query = getBrowserClient()
        .from("media_assets")
        .select("id, path, url, folder, mime_type, size_bytes, width, height, alt, created_at")
        .order("created_at", { ascending: false })
        .limit(120);
      const term = q.trim().replace(/[%,()*]/g, " ");
      if (term) query = query.or(`path.ilike.%${term}%,alt.ilike.%${term}%`);
      const { data, error: loadError } = await query;
      if (cancelled) return;
      if (loadError) setError(loadError.message);
      else setItems((data ?? []) as MediaAsset[]);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (url: string) => {
    if (!multiple) return onPick([url]);
    setSelected((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  };

  // Portal keeps the dialog outside admin <form>s, so Enter in the search box never submits them.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Медіатека">
      <button aria-label="Закрити" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-4xl flex-col rounded-t-2xl bg-background shadow-xl sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <h2 className="font-semibold">Медіатека</h2>
          <label className="relative ml-auto flex-1 sm:max-w-xs">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Пошук за назвою або описом"
              className="h-9 w-full rounded-lg border bg-background pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <button aria-label="Закрити" onClick={onClose} className="grid size-9 place-items-center rounded-lg hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="text-sm text-rose-700">{error}</p>}
          {!items && !error && <p className="text-sm text-muted-foreground">Завантаження…</p>}
          {items?.length === 0 && <p className="text-sm text-muted-foreground">Нічого не знайдено.</p>}
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {items?.map((item) => {
              const isSelected = selected.includes(item.url);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.url)}
                    className={cn(
                      "relative block aspect-square w-full overflow-hidden rounded-lg border bg-white",
                      isSelected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/40",
                    )}
                    title={item.alt || item.path}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.alt} loading="lazy" className="size-full object-contain" />
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-4" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {multiple && (
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
            <span className="text-sm text-muted-foreground">Вибрано: {selected.length}</span>
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => onPick(selected)}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Додати вибрані
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
