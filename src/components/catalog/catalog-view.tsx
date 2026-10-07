"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X, ChevronDown, Search } from "lucide-react";
import { type CategoryKey, type Product } from "@/lib/products";
import {
  facetsForCategory,
  getAvailableFacets,
  matchesFacets,
  searchScore,
  type AvailableFacet,
  type SelectedFacets,
} from "@/lib/catalog-filters";
import { SUBCATEGORIES, type Subcategory } from "@/lib/catalog-facets";
import { formatUah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStoreCategories } from "@/components/site/categories-context";
import { ProductCard } from "./product-card";

type SortKey = "default" | "price-asc" | "price-desc" | "name";
const PAGE_SIZE = 24;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "За замовчуванням" },
  { key: "price-asc", label: "Дешевші спочатку" },
  { key: "price-desc", label: "Дорожчі спочатку" },
  { key: "name", label: "За назвою" },
];

export function CatalogView({
  products,
  lockedCategory,
  initialQuery = "",
  searchMode = false,
}: {
  products: Product[];
  lockedCategory?: CategoryKey;
  initialQuery?: string;
  searchMode?: boolean;
}) {
  const categories = useStoreCategories();
  const [selected, setSelected] = useState<SelectedFacets>({});
  const [query, setQuery] = useState(initialQuery);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchRef = useRef<HTMLInputElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterDialogRef = useRef<HTMLDivElement>(null);
  const filterCloseRef = useRef<HTMLButtonElement>(null);

  // Restore search, filters, price, stock and sort from the URL after hydration
  // (shareable links such as ?q=… or ?line=PURE, reload) and on Back/Forward.
  useEffect(() => {
    const applyUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const fromUrl: SelectedFacets = {};
      for (const facet of facetsForCategory(lockedCategory)) {
        const values = params.getAll(facet.key).filter(Boolean);
        if (values.length) fromUrl[facet.key] = values;
      }
      const urlSort = params.get("sort");
      setQuery(params.get("q") ?? initialQuery);
      setSelected(fromUrl);
      setPriceMin(params.get("min") ?? "");
      setPriceMax(params.get("max") ?? "");
      setInStockOnly(params.get("stock") === "1");
      setSort(SORT_OPTIONS.some((o) => o.key === urlSort) ? (urlSort as SortKey) : "default");
    };
    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [lockedCategory, initialQuery]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("focus") === "search") {
      searchRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileFiltersOpen(false);
        window.requestAnimationFrame(() => filterTriggerRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = filterDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    window.requestAnimationFrame(() => filterCloseRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileFiltersOpen]);

  // Keep the whole filter state in the URL (write-only, no re-render / no dynamic rendering),
  // so a reload or a shared link shows the same list.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const put = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key));
    put("q", query.trim() ? query : "");
    for (const facet of facetsForCategory(lockedCategory)) {
      params.delete(facet.key);
      for (const value of selected[facet.key] ?? []) params.append(facet.key, value);
    }
    put("min", priceMin);
    put("max", priceMax);
    put("stock", inStockOnly ? "1" : "");
    put("sort", sort === "default" ? "" : sort);
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", qs ? `?${qs}` : window.location.pathname);
  }, [query, selected, lockedCategory, priceMin, priceMax, inStockOnly, sort]);

  // Available facets are driven by config + the products in scope; facets with
  // fewer than 2 distinct values are dropped automatically.
  const availableFacets = useMemo(
    () => getAvailableFacets(products, facetsForCategory(lockedCategory), selected, lockedCategory),
    [products, lockedCategory, selected],
  );

  const filtered = useMemo(() => {
    const scores = new Map(products.map((p) => [p, searchScore(p, query)]));
    let list = products.filter((p) => scores.get(p)! > 0 && matchesFacets(p, selected, lockedCategory));

    if (inStockOnly) list = list.filter((p) => p.inStock);
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
        // With a search query, most relevant first (stable: ties keep catalogue order).
        return query.trim() ? [...list].sort((a, b) => scores.get(b)! - scores.get(a)!) : list;
    }
  }, [products, query, selected, inStockOnly, priceMin, priceMax, sort, lockedCategory]);

  const showResults = !searchMode || query.trim().length > 0;
  const visibleProducts = showResults ? filtered.slice(0, visibleCount) : [];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE_SIZE);
  }, [query, selected, inStockOnly, priceMin, priceMax, sort]);

  const toggleFacet = (key: string, value: string) => {
    setSelected((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const updated = { ...prev, [key]: next };
      if (next.length === 0) delete updated[key];
      return updated;
    });
  };

  const removeFacet = (key: string, value: string) => {
    setSelected((prev) => {
      const next = (prev[key] ?? []).filter((item) => item !== value);
      const updated = { ...prev, [key]: next };
      if (next.length === 0) delete updated[key];
      return updated;
    });
  };

  const resetAll = () => {
    setSelected({});
    setQuery("");
    setInStockOnly(false);
    setPriceMin("");
    setPriceMax("");
    setSort("default");
  };

  const closeMobileFilters = () => {
    setMobileFiltersOpen(false);
    window.requestAnimationFrame(() => filterTriggerRef.current?.focus());
  };

  const selectedCount = Object.values(selected).reduce((s, v) => s + v.length, 0);
  const hasActiveFilters =
    selectedCount > 0 ||
    query.trim() !== "" ||
    inStockOnly ||
    priceMin !== "" ||
    priceMax !== "";
  const activeBadge = selectedCount + (inStockOnly ? 1 : 0) + (priceMin || priceMax ? 1 : 0);

  const minPriceOfAll = products.length ? Math.min(...products.map((p) => p.price)) : 0;
  const maxPriceOfAll = products.length ? Math.max(...products.map((p) => p.price)) : 0;
  const facetLabels = new Map(
    facetsForCategory(lockedCategory).map((facet) => [facet.key, facet.label]),
  );
  const activeSelections = Object.entries(selected).flatMap(([key, values]) =>
    values.map((value) => ({ key, value, label: facetLabels.get(key) ?? key })),
  );

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-14">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <FiltersPanel
            facets={availableFacets}
            selected={selected}
            toggleFacet={toggleFacet}
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

        {/* min-w-0: the subcategory chips row must scroll, not widen the column. */}
        <div className="min-w-0">
          {lockedCategory && (
            <SubcategoryChips
              subcategories={SUBCATEGORIES[lockedCategory]}
              products={products}
              scope={lockedCategory}
              selected={selected}
              onPick={(sub) => setSelected(sub && !isActiveSub(sub, selected) ? sub.filter : {})}
            />
          )}
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук: CROSS, PURE, BB20, мембрана 75 GPD, помʼякшення…"
              aria-label="Пошук по каталогу"
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            {query && (
              <button
                type="button"
                aria-label="Очистити пошук"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="tabular font-semibold text-foreground">
                {showResults ? filtered.length : 0}
              </span>{" "}
              {pluralize(showResults ? filtered.length : 0, ["товар", "товари", "товарів"])}
            </p>

            <div className="flex items-center gap-2">
              <button
                ref={filterTriggerRef}
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                aria-expanded={mobileFiltersOpen}
                aria-controls="mobile-catalog-filters"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:hidden"
              >
                <SlidersHorizontal className="size-4" /> Фільтри
                {activeBadge > 0 && (
                  <span className="ml-1 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {activeBadge}
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

          {hasActiveFilters && (
            <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Активні фільтри">
              {activeSelections.map((item) => (
                <button
                  key={`${item.key}-${item.value}`}
                  type="button"
                  onClick={() => removeFacet(item.key, item.value)}
                  aria-label={`Прибрати фільтр ${item.label}: ${item.value}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  <span className="text-muted-foreground">{item.label}:</span> {item.value}
                  <X className="size-3.5 text-primary" aria-hidden />
                </button>
              ))}
              {inStockOnly && (
                <button
                  type="button"
                  onClick={() => setInStockOnly(false)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  В наявності <X className="size-3.5 text-primary" aria-hidden />
                </button>
              )}
              {(priceMin || priceMax) && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceMin("");
                    setPriceMax("");
                  }}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  Ціна: {priceMin || "0"}–{priceMax || "∞"} ₴
                  <X className="size-3.5 text-primary" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={resetAll}
                className="min-h-9 px-2 text-xs font-semibold text-primary hover:underline"
              >
                Скинути всі
              </button>
            </div>
          )}

          {!showResults ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Search className="mx-auto size-8 text-primary" aria-hidden />
              <h2 className="mt-4 font-[family-name:var(--font-manrope)] text-xl font-bold">
                Знайдіть товар за назвою або моделлю
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                Наприклад: CROSS, PURE, BB20, FU1054 або мембрана 75 GPD.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold">
                Нічого не знайдено
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                За вашим запитом нічого не знайдено. Спробуйте змінити пошук або скинути фільтри.
              </p>
              <button
                onClick={resetAll}
                className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
              >
                Скинути пошук і фільтри
              </button>
              {!lockedCategory && categories.length > 0 && (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-sm text-muted-foreground">Або перегляньте категорії:</p>
                  <ul className="mt-3 flex flex-wrap justify-center gap-2">
                    {categories.map((c) => (
                      <li key={c.key}>
                        <Link
                          href={`/catalog/${c.key}`}
                          className="inline-flex h-9 items-center rounded-full border border-border px-3.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                        >
                          {c.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
          {showResults && visibleCount < filtered.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
              >
                Показати ще {Math.min(PAGE_SIZE, filtered.length - visibleCount)}
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div
          ref={filterDialogRef}
          id="mobile-catalog-filters"
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-catalog-filters-title"
        >
          <button
            type="button"
            aria-label="Закрити фільтри"
            onClick={closeMobileFilters}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="mobile-catalog-filters-title"
                className="font-[family-name:var(--font-manrope)] text-lg font-bold"
              >
                Фільтри
              </h2>
              <button
                ref={filterCloseRef}
                type="button"
                aria-label="Закрити"
                onClick={closeMobileFilters}
                className="grid size-9 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <FiltersPanel
              facets={availableFacets}
              selected={selected}
              toggleFacet={toggleFacet}
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
              type="button"
              onClick={closeMobileFilters}
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
  facets,
  selected,
  toggleFacet,
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
  facets: AvailableFacet[];
  selected: SelectedFacets;
  toggleFacet: (key: string, value: string) => void;
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

      {facets.map(({ def, options }) => (
        <FilterGroup key={def.key} title={def.label}>
          {options.map((opt) => {
            const checked = (selected[def.key] ?? []).includes(opt.value);
            const unavailable = opt.count === 0 && !checked;
            return (
              <label
                key={opt.value}
                className={[
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                  unavailable ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:bg-muted",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={unavailable}
                    onChange={() => toggleFacet(def.key, opt.value)}
                    className="size-4 rounded border-border text-primary focus:ring-2 focus:ring-ring/30"
                  />
                  <span className="text-foreground">{opt.value}</span>
                </span>
                <span className="text-xs text-muted-foreground tabular">{opt.count}</span>
              </label>
            );
          })}
        </FilterGroup>
      ))}

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
    <details open className="group border-b border-border/70 pb-5 last:border-b-0">
      <summary className="mb-2 flex cursor-pointer list-none items-center justify-between gap-3 rounded-md py-1 text-sm font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div>{children}</div>
    </details>
  );
}

function isActiveSub(sub: Subcategory, selected: SelectedFacets): boolean {
  const keys = Object.keys(sub.filter);
  if (keys.length !== Object.keys(selected).length) return false;
  return keys.every((key) => {
    const a = [...(selected[key] ?? [])].sort();
    const b = [...sub.filter[key]].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  });
}

/** Ecosoft-style subcategory shortcuts: each one is a preset filter selection. */
function SubcategoryChips({
  subcategories,
  products,
  scope,
  selected,
  onPick,
}: {
  subcategories: Subcategory[];
  products: Product[];
  scope: CategoryKey;
  selected: SelectedFacets;
  onPick: (sub: Subcategory | null) => void;
}) {
  const withProducts = subcategories.filter((sub) => products.some((p) => matchesFacets(p, sub.filter, scope)));
  if (withProducts.length < 2) return null;
  const anyActive = withProducts.some((sub) => isActiveSub(sub, selected));
  const chip = "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors";
  return (
    <nav aria-label="Підкатегорії" className="-mx-4 mb-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-2 pb-1 lg:flex-wrap">
        <li>
          <button
            type="button"
            onClick={() => onPick(null)}
            aria-pressed={!anyActive && Object.keys(selected).length === 0}
            className={cn(
              chip,
              !anyActive && Object.keys(selected).length === 0
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            Усі
          </button>
        </li>
        {withProducts.map((sub) => {
          const active = isActiveSub(sub, selected);
          return (
            <li key={sub.key}>
              <button
                type="button"
                onClick={() => onPick(sub)}
                aria-pressed={active}
                className={cn(
                  chip,
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                {sub.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function pluralize(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
