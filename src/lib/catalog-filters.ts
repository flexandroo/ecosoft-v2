// Config-driven catalog faceted filters. Each facet reads values from
// `product.filters[key]`. The UI computes available options dynamically and
// hides any facet with fewer than 2 distinct values.
import { findCategory, type CategoryKey, type Product } from "@/lib/products";

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
