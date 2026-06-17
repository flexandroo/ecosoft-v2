"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { type CategoryKey, type Product } from "@/lib/products";
import { formatUah } from "@/lib/format";
import { ProductCard } from "./product-card";

type SortKey = "default" | "price-asc" | "price-desc" | "name";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "За замовчуванням" },
  { key: "price-asc", label: "Дешевші спочатку" },
  { key: "price-desc", label: "Дорожчі спочатку" },
  { key: "name", label: "За назвою" },
];

export function CatalogView({
  products,
}: {
  products: Product[];
  lockedCategory?: CategoryKey;
}) {
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products;

    if (inStockOnly) {
      list = list.filter((p) => p.inStock);
    }
    const min = Number(priceMin);
    const max = Number(priceMax);
    if (priceMin && !Number.isNaN(min)) list = list.filter((p) => p.price >= min);
    if (priceMax && !Number.isNaN(max)) list = list.filter((p) => p.price <= max);

    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name, "uk"));
      default:
        return list;
    }
  }, [products, inStockOnly, priceMin, priceMax, sort]);

  const resetAll = () => {
    setInStockOnly(false);
    setPriceMin("");
    setPriceMax("");
  };

  const hasActiveFilters = inStockOnly || priceMin !== "" || priceMax !== "";

  const minPriceOfAll = Math.min(...products.map((p) => p.price));
  const maxPriceOfAll = Math.max(...products.map((p) => p.price));

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <FiltersPanel
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            priceMin={priceMin}
            priceMax={priceMax}
            setPriceMin={setPriceMin}
            setPriceMax={setPriceMax}
            minPriceOfAll={minPriceOfAll}
            maxPriceOfAll={maxPriceOfAll}
            hasActiveFilters={hasActiveFilters}
            onReset={resetAll}
          />
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="tabular font-semibold text-foreground">{filtered.length}</span>{" "}
              {pluralize(filtered.length, ["товар", "товари", "товарів"])}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:hidden"
              >
                <SlidersHorizontal className="size-4" /> Фільтри
                {hasActiveFilters && (
                  <span className="ml-1 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {(inStockOnly ? 1 : 0) + (priceMin || priceMax ? 1 : 0)}
                  </span>
                )}
              </button>

              <label className="relative">
                <span className="sr-only">Сортування</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </label>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold">
                Нічого не знайдено
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Спробуйте змінити фільтри або скинути всі обмеження.
              </p>
              <button
                onClick={resetAll}
                className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
              >
                Скинути фільтри
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Закрити фільтри"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold">
                Фільтри
              </h2>
              <button
                aria-label="Закрити"
                onClick={() => setMobileFiltersOpen(false)}
                className="grid size-9 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <FiltersPanel
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              priceMin={priceMin}
              priceMax={priceMax}
              setPriceMin={setPriceMin}
              setPriceMax={setPriceMax}
              minPriceOfAll={minPriceOfAll}
              maxPriceOfAll={maxPriceOfAll}
              hasActiveFilters={hasActiveFilters}
              onReset={resetAll}
            />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
            >
              Показати {filtered.length}{" "}
              {pluralize(filtered.length, ["товар", "товари", "товарів"])}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function FiltersPanel({
  inStockOnly,
  setInStockOnly,
  priceMin,
  priceMax,
  setPriceMin,
  setPriceMax,
  minPriceOfAll,
  maxPriceOfAll,
  hasActiveFilters,
  onReset,
}: {
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  priceMin: string;
  priceMax: string;
  setPriceMin: (v: string) => void;
  setPriceMax: (v: string) => void;
  minPriceOfAll: number;
  maxPriceOfAll: number;
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Фільтри
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Скинути
          </button>
        )}
      </div>

      <FilterGroup title="Ціна, ₴">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(minPriceOfAll)}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(maxPriceOfAll)}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          від {formatUah(minPriceOfAll)} до {formatUah(maxPriceOfAll)}
        </p>
      </FilterGroup>

      <FilterGroup title="Наявність">
        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-2 focus:ring-ring/30"
          />
          <span className="text-foreground">Лише в наявності</span>
        </label>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function pluralize(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
