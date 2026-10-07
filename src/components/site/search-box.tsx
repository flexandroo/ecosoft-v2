"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Package, Search } from "lucide-react";
import type { SearchSuggestion } from "@/app/api/search/route";
import { ProductImage } from "@/components/catalog/product-image";
import { formatUah } from "@/lib/format";
import { cn } from "@/lib/utils";

const MIN_CHARS = 2;

/**
 * Header search with live suggestions: from the second letter it shows the
 * best matches with photo and price (any layout or spelling the catalogue
 * search understands); Enter or the button opens the full results page.
 */
export function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState("");
  const [items, setItems] = useState<SearchSuggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [resultFor, setResultFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const query = value.trim();
  const ready = query.length >= MIN_CHARS;

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data: { total: number; items: SearchSuggestion[] } = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setResultFor(query);
        setActive(-1);
      } catch {
        // Aborted by the next keystroke, or offline: keep the previous list.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, ready]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const showList = open && ready;
  const allHref = `/search?q=${encodeURIComponent(query)}`;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showList || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(items[active].href);
    }
  };

  return (
    <form
      ref={rootRef}
      action="/search"
      role="search"
      onSubmit={() => setOpen(false)}
      className={cn("relative flex h-11 rounded-xl border border-border bg-card", className)}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">
        Пошук товарів
      </label>
      <input
        id={`${listId}-input`}
        name="q"
        type="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Фільтр, картридж, артикул…"
        className="min-w-0 flex-1 rounded-l-xl bg-transparent px-4 text-[15px] outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-r-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden sm:inline">Знайти</span>
      </button>

      {showList && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl shadow-black/10">
          {items.length > 0 ? (
            <>
              <ul id={listId} role="listbox" aria-label="Підказки пошуку" className="max-h-[min(70vh,440px)] overflow-y-auto py-1">
                {items.map((item, i) => (
                  <li key={item.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActive(i)}
                      className={cn("flex items-center gap-3 px-3 py-2 transition-colors", i === active && "bg-muted")}
                    >
                      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white">
                        {item.image ? (
                          <ProductImage src={item.image} alt="" sizes="48px" className="object-contain p-1" />
                        ) : (
                          <Package className="size-5 text-muted-foreground" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm leading-snug">{item.name}</span>
                        {item.sku && <span className="mt-0.5 block text-xs text-muted-foreground">{item.sku}</span>}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="tabular block text-sm font-semibold">{formatUah(item.price)}</span>
                        {item.oldPrice && item.oldPrice > item.price && (
                          <span className="tabular block text-xs text-muted-foreground line-through">{formatUah(item.oldPrice)}</span>
                        )}
                        {!item.inStock && <span className="block text-xs text-muted-foreground">Під замовлення</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={allHref}
                onClick={() => setOpen(false)}
                className="block border-t border-border px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted"
              >
                Показати всі результати ({total})
              </Link>
            </>
          ) : (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              {loading || resultFor !== query ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Шукаємо…
                </>
              ) : (
                <>Нічого не знайдено за «{query}». Спробуйте назву моделі або артикул.</>
              )}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
