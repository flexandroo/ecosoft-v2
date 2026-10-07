// Catalog faceted filtering. Facet definitions and how each product's values
// are derived live in catalog-facets.ts (modelled on ecosoft.ua); this module
// computes the available options and matches products. Facets with fewer than
// 2 distinct values are hidden.
import { findCategory, type CategoryKey, type Product } from "@/lib/products";
import { allFacetValues, facetValues, facetsForCategory, type FacetDef } from "@/lib/catalog-facets";

export { facetsForCategory, type FacetDef };

export type FacetOption = { value: string; count: number };

/** Share of the current list a facet must describe to be offered. */
const MIN_FACET_COVERAGE = 0.35;
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
    const inScope = products.filter((product) => matchesFacets(product, otherSelections, scope));
    const counts = new Map<string, number>();
    let covered = 0;
    for (const p of inScope) {
      const values = facetValues(p, def.key, scope);
      if (values.length) covered += 1;
      for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    // Facets that describe only part of the list (membrane GPD, kit size…) appear
    // once the other filters narrow the list to products they apply to; a chosen
    // facet always stays visible so it can be cleared.
    if (!selected[def.key]?.length && covered < inScope.length * MIN_FACET_COVERAGE) continue;
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
    .replace(/ё/g, "е")
    .replace(/[’ʼ`'"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Query words customers type in Russian, transliterated or in Ukrainian, mapped
 * to the forms used in the catalogue (product names are Ukrainian with Latin
 * model names). Keys and values are already normalised (normText).
 */
const SYNONYMS: Record<string, string[]> = {
  фильтр: ["фільтр"],
  фильтры: ["фільтр"],
  железо: ["залізо", "заліза"],
  обезжелезивание: ["знезалізнення"],
  соль: ["сіль"],
  умягчение: ["помякшення"],
  смягчение: ["помякшення"],
  жесткость: ["жорсткість"],
  накипь: ["накип"],
  хлор: ["хлор"],
  сероводород: ["сірководень", "сірководню"],
  уголь: ["вугілля", "вугіль"],
  угольный: ["вугільний"],
  насос: ["помп"],
  помпа: ["помп"],
  бак: ["бак"],
  смола: ["смола", "смоли"],
  колба: ["колба"],
  картриджи: ["картридж"],
  мембраны: ["мембрана"],
  умный: ["розумний"],
  вода: ["вод"],
  воды: ["вод"],
  воду: ["вод"],
  очистка: ["очищення", "очистка"],
  очистки: ["очищення", "очистка"],
  кросс: ["cross"],
  кросс90: ["cross90"],
  кросс60: ["cross60"],
  крос: ["cross"],
  стандарт: ["standard"],
  стандард: ["standard"],
  баланс: ["balance"],
  пур: ["pure"],
  пьюр: ["pure"],
  абсолют: ["absolute"],
  экософт: ["ecosoft"],
  екософт: ["ecosoft"],
  экомикс: ["ecomix"],
  екомікс: ["ecomix"],
  робаст: ["robust"],
  скейлекс: ["scalex"],
  аквакальций: ["aquacalcium"],
  аквакальцій: ["aquacalcium"],
};

/** Alternative spellings of one query word, most specific first. */
function tokenVariants(token: string): string[] {
  const synonyms = SYNONYMS[token];
  if (synonyms) return [token, ...synonyms];
  const variants = new Set([token]);
  // Russian spelling of shared words: и → і, ы → и, э → е ("фильтр" → "фільтр").
  variants.add(token.replace(/и/g, "і").replace(/ы/g, "и").replace(/э/g, "е"));
  // Ukrainian inflection: "помпа" should find "з помпою", "осмосис" → "осмос".
  if (token.length >= 5 && /[а-яіїєґ]$/.test(token)) variants.add(token.slice(0, -1));
  if (token.length >= 7 && /[а-яіїєґ]{2}$/.test(token)) variants.add(token.slice(0, -2));
  return [...variants];
}

/** True when `a` and `b` differ by at most one edit (insert, delete, substitute or swap). */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length || i === b.length) return Math.abs(a.length - b.length) <= 1;
  const restA = a.slice(i + 1);
  const restB = b.slice(i + 1);
  return (
    restA === restB || // substitution
    a.slice(i) === b.slice(i + 1) || // insertion into a
    a.slice(i + 1) === b.slice(i) || // deletion from a
    (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) // swap
  );
}

type SearchIndex = { name: string; sku: string; hay: string; words: string[] };
const indexCache = new WeakMap<Product, SearchIndex>();

function searchIndex(p: Product): SearchIndex {
  let index = indexCache.get(p);
  if (!index) {
    const hay = productSearchText(p);
    index = { name: normText(p.name), sku: normText(p.sku ?? ""), hay, words: hay.split(/[\s,/()«»-]+/) };
    indexCache.set(p, index);
  }
  return index;
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

/** How well one query word matches a product: 0 = not at all. */
function tokenScore(index: SearchIndex, token: string): number {
  let best = 0;
  for (const variant of tokenVariants(token)) {
    if (index.sku && index.sku === variant) return 100;
    if (index.sku.startsWith(variant) && variant.length >= 3) best = Math.max(best, 40);
    if (index.name.includes(variant)) best = Math.max(best, variant === token ? 10 : 8);
    else if (index.hay.includes(variant)) best = Math.max(best, variant === token ? 3 : 2);
  }
  // One typo in a longer word ("ecosft", "мембрна") still finds it, ranked low.
  // Model codes and SKUs (anything with digits) must match exactly.
  if (!best && token.length >= 5 && !/\d/.test(token) && index.words.some((w) => withinOneEdit(w, token))) best = 1;
  return best;
}

/**
 * Relevance of a product for a free-text query: 0 when any query word is
 * missing (multi-word queries are AND), higher is better. An empty query
 * matches everything with score 1.
 */
export function searchScore(product: Product, query: string): number {
  const q = normText(query);
  if (!q) return 1;
  const index = searchIndex(product);
  let total = 0;
  for (const token of q.split(" ")) {
    const score = tokenScore(index, token);
    if (!score) return 0;
    total += score;
  }
  if (index.name.startsWith(q)) total += 15;
  else if (index.name.includes(q)) total += 10;
  return total;
}

/** Multi-token AND match: every word in the query must be found in the product. */
export function matchesQuery(product: Product, query: string): boolean {
  return searchScore(product, query) > 0;
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
