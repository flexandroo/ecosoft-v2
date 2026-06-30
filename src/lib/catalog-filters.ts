// Config-driven catalog faceted filters. Each facet reads values from
// `product.filters[key]`. The UI computes available options dynamically and
// hides any facet with fewer than 2 distinct values.
import type { CategoryKey, Product } from "@/lib/products";

export type FacetDef = { key: string; label: string };

/** Universal facets for the all-catalog page (kept intentionally small). */
export const UNIVERSAL_FACETS: FacetDef[] = [
  { key: "purpose", label: "Призначення" },
  { key: "problem", label: "Проблема води" },
  { key: "installation", label: "Тип встановлення" },
  { key: "level", label: "Рівень" },
];

/** Per-category facets, ordered most → least important. */
export const CATEGORY_FACETS: Record<CategoryKey, FacetDef[]> = {
  "reverse-osmosis": [
    { key: "line", label: "Лінійка" },
    { key: "systemType", label: "Тип системи" },
    { key: "level", label: "Рівень" },
    { key: "mineralization", label: "Мінералізація" },
    { key: "pump", label: "Помпа" },
  ],
  "flow-filters": [
    { key: "type", label: "Тип" },
    { key: "stages", label: "Ступенів" },
  ],
  "filtration-systems": [
    { key: "task", label: "Завдання" },
    { key: "format", label: "Формат" },
    { key: "series", label: "Серія" },
    { key: "media", label: "Завантаження" },
    { key: "level", label: "Рівень" },
  ],
  "mainline-filters": [
    { key: "type", label: "Тип" },
    { key: "temperature", label: "Температура" },
    { key: "connection", label: "Підключення" },
    { key: "body", label: "Корпус" },
    { key: "purpose", label: "Призначення" },
  ],
  "ro-cartridges": [
    { key: "type", label: "Тип" },
    { key: "compatibility", label: "Сумісність" },
    { key: "period", label: "Термін заміни" },
    { key: "gpd", label: "Мембрана (GPD)" },
    { key: "elements", label: "Кількість картриджів" },
  ],
  "mainline-cartridges": [
    { key: "size", label: "Типорозмір" },
    { key: "material", label: "Матеріал" },
    { key: "task", label: "Завдання" },
    { key: "micron", label: "Рейтинг фільтрації" },
    { key: "qty", label: "Кількість у комплекті" },
  ],
  "filter-media": [
    { key: "materialType", label: "Тип матеріалу" },
    { key: "purpose", label: "Призначення" },
    { key: "brand", label: "Бренд / серія" },
    { key: "volume", label: "Обʼєм / вага" },
  ],
  horeca: [
    { key: "capacity", label: "Продуктивність" },
    { key: "forCoffee", label: "Для кави" },
  ],
};

export function facetsForCategory(category?: CategoryKey): FacetDef[] {
  return category ? CATEGORY_FACETS[category] ?? UNIVERSAL_FACETS : UNIVERSAL_FACETS;
}

export type FacetOption = { value: string; count: number };
export type AvailableFacet = { def: FacetDef; options: FacetOption[] };

/**
 * Distinct values (with counts) for each facet across `products`.
 * Facets with fewer than 2 distinct values are omitted.
 */
export function getAvailableFacets(
  products: Product[],
  defs: FacetDef[],
): AvailableFacet[] {
  const result: AvailableFacet[] = [];
  for (const def of defs) {
    const counts = new Map<string, number>();
    for (const p of products) {
      const vals = p.filters?.[def.key];
      if (!vals) continue;
      for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    if (counts.size < 2) continue;
    const options = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value, "uk", { numeric: true }));
    result.push({ def, options });
  }
  return result;
}

export type SelectedFacets = Record<string, string[]>;

/** A product matches when, for every active facet, it has at least one selected value. */
export function matchesFacets(product: Product, selected: SelectedFacets): boolean {
  for (const key in selected) {
    const values = selected[key];
    if (!values || values.length === 0) continue;
    const pv = product.filters?.[key] ?? [];
    if (!values.some((v) => pv.includes(v))) return false;
  }
  return true;
}
