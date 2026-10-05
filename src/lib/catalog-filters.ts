// Catalog faceted filtering. Facet definitions and how each product's values
// are derived live in catalog-facets.ts (modelled on ecosoft.ua); this module
// computes the available options and matches products. Facets with fewer than
// 2 distinct values are hidden.
import { findCategory, type CategoryKey, type Product } from "@/lib/products";
import { allFacetValues, facetValues, facetsForCategory, type FacetDef } from "@/lib/catalog-facets";

export { facetsForCategory, type FacetDef };

export type FacetOption = { value: string; count: number };
export type AvailableFacet = { def: FacetDef; options: FacetOption[] };

/**
 * Distinct values (with counts) for each facet across `products`.
 * Facets with fewer than 2 distinct values are omitted.
 */
export function getAvailableFacets(
  products: Product[],
  defs: FacetDef[],
  selected: SelectedFacets = {},
  scope?: CategoryKey,
): AvailableFacet[] {
  const result: AvailableFacet[] = [];
  for (const def of defs) {
    const allValues = new Set<string>();
    for (const product of products) {
      for (const value of facetValues(product, def.key, scope)) allValues.add(value);
    }
    if (allValues.size < 2) continue;

    // Ecosoft-style faceting: an option count reflects every active filter
    // except the current group. Values already chosen in this group remain OR'ed.
    const otherSelections = Object.fromEntries(
      Object.entries(selected).filter(([key, values]) => key !== def.key && values.length > 0),
    );
    const counts = new Map<string, number>();
    for (const p of products.filter((product) => matchesFacets(product, otherSelections, scope))) {
      for (const v of facetValues(p, def.key, scope)) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const rank = (value: string) => {
      const i = def.order?.indexOf(value) ?? -1;
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    const options = [...allValues]
      .map((value) => ({ value, count: counts.get(value) ?? 0 }))
      .sort((a, b) => rank(a.value) - rank(b.value) || a.value.localeCompare(b.value, "uk", { numeric: true }));
    result.push({ def, options });
  }
  return result;
}

export type SelectedFacets = Record<string, string[]>;

/** A product matches when, for every active facet, it has at least one selected value. */
export function matchesFacets(product: Product, selected: SelectedFacets, scope?: CategoryKey): boolean {
  for (const key in selected) {
    const values = selected[key];
    if (!values || values.length === 0) continue;
    const pv = facetValues(product, key, scope);
    if (!values.some((v) => pv.includes(v))) return false;
  }
  return true;
}

// ---- Free-text search ----------------------------------------------------
function normText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’ʼ`'"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build the searchable haystack for a product (name, model, sku, category, tags, facets…). */
export function productSearchText(p: Product): string {
  const parts: (string | undefined)[] = [
    p.name,
    p.sku,
    p.line,
    p.type,
    p.category,
    findCategory(p.category)?.title,
    p.subcategory,
    ...(p.tags ?? []),
    ...(p.purpose ?? []),
    ...(p.problem ?? []),
  ];
  if (p.filters) {
    for (const key in p.filters) parts.push(...p.filters[key]);
  }
  parts.push(...allFacetValues(p));
  return normText(parts.filter(Boolean).join(" "));
}

/** Multi-token AND match: every token in the query must appear in the haystack. */
export function matchesQuery(product: Product, query: string): boolean {
  const q = normText(query);
  if (!q) return true;
  const hay = productSearchText(product);
  return q.split(" ").every((token) => hay.includes(token));
}

// ---- Card badges ---------------------------------------------------------
/**
 * Up to 4 short, category-aware badges derived from a product's facets.
 * Never invents data — only emits a badge when the underlying value exists.
 */
export function getProductBadges(p: Product): string[] {
  const f = p.filters ?? {};
  const has = (k: string, v: string) => (f[k] ?? []).includes(v);
  const first = (k: string) => (f[k] ?? [])[0];
  const b: string[] = [];

  switch (p.category) {
    case "reverse-osmosis":
      b.push(has("systemType", "З баком") ? "З баком" : "Без бака");
      if (has("mineralization", "Є")) b.push("Мінералізація");
      if (has("pump", "Є")) b.push("З помпою");
      if (has("systemType", "Прямоточна")) b.push("Прямоточний");
      else if (has("systemType", "Компактна")) b.push("Компактний");
      else if (has("level", "Преміальний")) b.push("Преміум");
      break;
    case "horeca":
      b.push("RObust", "Для бізнесу");
      if (has("forCoffee", "Так")) b.push("Для кави");
      if (has("capacity", "3000") || has("capacity", "4000")) b.push("Висока продуктивність");
      break;
    case "filtration-systems": {
      const taskBadge: Record<string, string> = {
        "Пом'якшення": "Пом'якшення",
        "Знезалізнення та пом'якшення": "Видалення заліза",
        "Видалення хлору": "Від хлору",
        "Видалення сірководню": "Від сірководню",
        "Механічне очищення": "Механічне очищення",
      };
      const tb = taskBadge[first("task") ?? ""];
      if (tb) b.push(tb);
      if (has("format", "Кабінетна")) b.push("Кабінетна система");
      else if (has("format", "Колонна")) b.push("Колонна система");
      if (has("task", "Знезалізнення та пом'якшення")) b.push("Комплексна очистка");
      b.push("Для будинку");
      break;
    }
    case "mainline-filters": {
      const t = first("type");
      if (t) b.push(t === "Колба BB10" ? "BB10" : t === "Колба BB20" ? "BB20" : t);
      if (has("temperature", "Гаряча")) b.push("Гаряча вода");
      b.push("Захист техніки");
      break;
    }
    case "ro-cartridges": {
      b.push("Для осмосу");
      const t = first("type");
      if (t === "Мембрана") b.push("Мембрана");
      else if (t === "Мінералізатор") b.push("Мінералізатор");
      if (has("period", "6 місяців")) b.push("Комплект 6 міс.");
      else if (has("period", "12 місяців")) b.push("Комплект 12 міс.");
      if (has("compatibility", "PURE")) b.push("Сумісно з PURE");
      else if (has("compatibility", "Standard")) b.push("Сумісно з Standard");
      break;
    }
    case "mainline-cartridges": {
      if (has("size", '4,5"×10"')) b.push("BB10");
      else if (has("size", '4,5"×20"')) b.push("BB20");
      const mic = first("micron");
      if (mic) b.push(mic);
      const mat = first("material") ?? "";
      if (/вугілля/i.test(mat)) b.push("Вугілля");
      else if (/поліпропілен/i.test(mat)) b.push("Поліпропілен");
      if (has("task", "Залізо")) b.push("Від заліза");
      else if (has("task", "Хлор та запах")) b.push("Від хлору");
      break;
    }
    case "filter-media": {
      b.push("Засипка");
      const mtBadge: Record<string, string> = {
        ECOMIX: "ECOMIX",
        Сіль: "Сіль",
        "Іонообмінна смола": "Смола",
        "Активоване вугілля": "Вугілля",
        "Кварцовий пісок": "Пісок",
        "Filter-Ag": "Filter-Ag",
      };
      const mtb = mtBadge[first("materialType") ?? ""];
      if (mtb) b.push(mtb);
      if (has("purpose", "Регенерація")) b.push("Для регенерації");
      else if (has("purpose", "Пом'якшення")) b.push("Для пом'якшення");
      break;
    }
    case "flow-filters":
      b.push("Під мийку", "Питна вода");
      break;
  }

  return Array.from(new Set(b)).slice(0, 4);
}
