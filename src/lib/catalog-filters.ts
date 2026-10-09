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

// Keys of the Ukrainian/Russian ЙЦУКЕН layout and the Latin letters on the same
// keys, so "ыефтвфкв" or "іефтвфкв" (typed with the wrong layout) finds "standard".
const CYR_KEYS = "йцукенгшщзхїъфіывапролджєэячсмитьбю";
const LAT_KEYS = "qwertyuiop[]]assdfghjkl;''zxcvbnm,.";
const CYR_TO_LAT = new Map([...CYR_KEYS].map((c, i) => [c, LAT_KEYS[i]]));
// Latin → Ukrainian layout ("s" is "і"); Russian letters are covered by the и/ы/э variants.
const LAT_TO_CYR = new Map(
  [..."qwertyuiop[]asdfghjkl;'zxcvbnm,."].map((l, i) => [l, "йцукенгшщзхїфівапролджєячсмитьбю"[i]]),
);

/** Cyrillic spelling of Latin model names ("кросс" → "kross"/"cross", "екомікс" → "ecomix"). */
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", є: "e", ж: "zh", з: "z", и: "i", і: "i", ї: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h",
  ц: "c", ч: "ch", ш: "sh", щ: "sch", ь: "", ъ: "", ы: "y", э: "e", ю: "u", я: "ya",
};

function swapLayout(token: string, map: Map<string, string>): string | null {
  let out = "";
  for (const ch of token) out += map.get(ch) ?? (/\d/.test(ch) ? ch : "\0");
  return out.includes("\0") ? null : out;
}

function translit(token: string): string {
  return token
    .replace(/дж/g, "j")
    .replace(/кс/g, "x")
    .replace(/./g, (ch) => TRANSLIT[ch] ?? ch);
}

/**
 * How a query word was respelt, best first: as typed, a synonym or Russian
 * spelling, the other script (wrong layout, Cyrillic spelling of a Latin
 * model name), or the word with its ending cut off. A cut-off ending ranks
 * last so a partial word ("станд") prefers "Standard" over "станині".
 */
const enum Spelling {
  Typed = 0,
  Synonym = 1,
  OtherScript = 2,
  Stem = 3,
}
type Variant = { text: string; spelling: Spelling };

const variantCache = new Map<string, Variant[]>();

/** Alternative spellings of one query word, most specific first. */
function tokenVariants(token: string): Variant[] {
  const cached = variantCache.get(token);
  if (cached) return cached;
  const variants = new Map<string, Spelling>([[token, Spelling.Typed]]);
  const add = (text: string | null, spelling: Spelling) => {
    if (text && !variants.has(text)) variants.set(text, spelling);
  };
  for (const synonym of SYNONYMS[token] ?? []) add(synonym, Spelling.Synonym);
  const cyrillic = /^[а-яіїєґ0-9-]+$/.test(token) && /[а-яіїєґ]/.test(token);
  const latin = /^[a-z0-9[\];',.-]+$/.test(token) && /[a-z]/.test(token);
  if (cyrillic) {
    // Russian spelling of shared words: и → і, ы → и, э → е ("фильтр" → "фільтр").
    add(token.replace(/и/g, "і").replace(/ы/g, "и").replace(/э/g, "е"), Spelling.Synonym);
    // Latin model name typed with the Cyrillic layout on, or spelled in Cyrillic.
    const swapped = swapLayout(token, CYR_TO_LAT);
    if (swapped && /^[a-z0-9-]+$/.test(swapped)) add(swapped, Spelling.OtherScript);
    if (token.length >= 2) {
      const lat = translit(token);
      add(lat, Spelling.OtherScript);
      add(lat.replace(/k/g, "c"), Spelling.OtherScript);
    }
    // Ukrainian inflection: "помпа" should find "з помпою", "осмосис" → "осмос".
    if (token.length >= 5 && /[а-яіїєґ]$/.test(token)) add(token.slice(0, -1), Spelling.Stem);
    if (token.length >= 7 && /[а-яіїєґ]{2}$/.test(token)) add(token.slice(0, -2), Spelling.Stem);
  } else if (latin && token.length >= 2) {
    // Ukrainian word typed with the Latin layout on ("askmnh" → "фільтр").
    add(swapLayout(token, LAT_TO_CYR), Spelling.OtherScript);
  }
  const list = [...variants].map(([text, spelling]) => ({ text, spelling }));
  variantCache.set(token, list);
  return list;
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
  for (const { text, spelling } of tokenVariants(token)) {
    // SKUs are Latin codes: a transliterated word ("фильтр" → "filtr") must not hit one.
    if (spelling !== Spelling.OtherScript || /\d/.test(text)) {
      if (index.sku && index.sku === text) return 100;
      if (index.sku.startsWith(text) && text.length >= 3) best = Math.max(best, 40);
    }
    if (index.name.includes(text)) best = Math.max(best, [10, 8, 7, 6][spelling]);
    else if (index.hay.includes(text)) best = Math.max(best, [3, 2, 2, 1][spelling]);
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
