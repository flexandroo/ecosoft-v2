// Catalogue structure and filters modelled on ecosoft.ua: the facets each
// category shows (names and values as on the manufacturer's site) and the
// subcategories from its menu, which are simply preset filter selections.
//
// Values are derived from the product data we already have (source filters,
// name, SKU and the characteristics from the Ecosoft export); nothing is
// invented — a product without the data simply has no value for that facet.
import type { CategoryKey, Product } from "@/lib/products";
import { formatSpecValue } from "@/lib/spec-format";

export type FacetDef = {
  key: string;
  label: string;
  /** Fixed option order; otherwise options sort naturally (uk, numeric). */
  order?: string[];
};

export type Subcategory = {
  key: string;
  label: string;
  /** Facet selection this subcategory stands for (facet key → values). */
  filter: Record<string, string[]>;
};

const spec = (p: Product, re: RegExp): string | undefined => p.details?.specs?.find((s) => re.test(s.label))?.value;
const f = (p: Product, key: string): string[] => p.filters?.[key] ?? [];
const has = (p: Product, key: string, value: string) => f(p, key).includes(value);
const uniq = (values: (string | undefined | false)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))];

// --- Reverse osmosis ---------------------------------------------------------

function roLine(p: Product): string[] {
  return uniq(f(p, "line").map((l) => (l.startsWith("Standard") ? "Standard" : l)));
}

// Tank, pump and mineraliser are independent properties: each gets its own
// facet so that choosing several of them narrows the list (AND), instead of
// widening it as options of one group would (OR).
const roTank = (p: Product) => [has(p, "systemType", "З баком") ? "З баком" : "Без бака"];
const roPump = (p: Product) => [has(p, "pump", "Є") ? "З помпою" : "Без помпи"];
const roMineral = (p: Product) => [has(p, "mineralization", "Є") ? "З мінералізатором" : "Без мінералізатора"];

function roFeatures(p: Product): string[] {
  return uniq([
    has(p, "systemType", "Розумна") && "SMART-індикація",
    has(p, "systemType", "Прямоточна") && "Прямоточний",
    has(p, "systemType", "Компактна") && "Компактний",
    /станин/i.test(p.name) && "Металева станина",
  ]);
}

// --- Filtration systems ------------------------------------------------------

const FS_TYPE: Record<string, string> = {
  "Знезалізнення та пом'якшення": "Для знезалізнення і пом'якшення",
  "Пом'якшення": "Для пом'якшення води",
  "Видалення хлору": "Для видалення хлору",
  "Видалення сірководню": "Для видалення сірководню",
  "Механічне очищення": "Для механічного очищення",
};

/** "FK1054CIMIXP" → 10, 54, "CI"; "FU1035CABCEMVTA" → 10, 35, "CE"; "FP 1054CT" → 10, 54, "CT". */
function fsSku(p: Product): { size?: string; valve?: string } {
  const m = (p.sku ?? "").toUpperCase().match(/^F[A-Z]{1,2}\s?(\d{2})(\d{2})(?:CAB)?G?(CI|CE|CT)/);
  if (!m) return {};
  return { size: `${m[1]}" × ${m[2]}"`, valve: `Clack ${m[3]}` };
}

function fsMedia(p: Product): string[] {
  const source = spec(p, /^Фільтрувальний матеріал$/) ?? f(p, "media").join(" ");
  if (/centaur/i.test(source)) return ["Centaur (каталітичний)"];
  if (/ecomix/i.test(source)) return ["Ecomix"];
  if (/смол/i.test(source)) return ["Іонообмінна смола"];
  if (/filter-ag/i.test(source)) return ["Filter-Ag"];
  if (/вугілл/i.test(source)) return ["Активоване вугілля"];
  return [];
}

function fsWhere(p: Product): string[] {
  const text = (spec(p, /^Застосування$/) ?? "").toLowerCase();
  return uniq([
    text.includes("квартир") && "Квартира",
    text.includes("будинок") && "Приватний будинок",
    text.includes("котедж") && "Котедж",
    text.includes("дач") && "Дача",
  ]);
}

const FS_REMOVES: Record<string, string> = {
  Жорсткість: "Жорсткість",
  Залізо: "Залізо",
  Хлор: "Хлор",
  Сірководень: "Сірководень",
  "Механічні домішки": "Механічні домішки",
};

// --- Mainline filters --------------------------------------------------------

function mfType(p: Product): string[] {
  const t = f(p, "type")[0] ?? "";
  if (t === "Від накипу") return ["Фільтр від накипу"];
  if (t === "Дисковий") return ["Дисковий"];
  if (t === "Самопромивний" || /промивн/i.test(spec(p, /^Тип продукту$/) ?? "")) return ["Промивний"];
  if (t.startsWith("Колба")) return ["Колба Big Blue"];
  return ["Картриджний"];
}

function mfSize(p: Product): string[] {
  if (/BB10/i.test(p.name)) return ['4,5" × 10"'];
  if (/BB20/i.test(p.name)) return ['4,5" × 20"'];
  const s = spec(p, /^Типорозмір$/);
  if (s && /2,5/.test(s)) return ['2,5" × 10"'];
  return [];
}

function mfConnection(p: Product): string[] {
  return f(p, "connection").map((c) => c.replace(/"$/, "″"));
}

// --- Cartridges for drinking-water filters -----------------------------------

function rcType(p: Product): string[] {
  const n = p.name;
  if (/^Мембрана/i.test(n)) return ["Мембрана"];
  if (/^Мінералізатор/i.test(n)) return ["Мінералізатор"];
  if (/постфільтр/i.test(n)) return ["Вугільний постфільтр"];
  if (/річний запас|"12 місяців"/i.test(n)) return ["Річний запас"];
  if (/"6 місяців"/i.test(n)) return ["Комплект на 6 місяців"];
  return ["Комплект картриджів"];
}

const RC_COMPAT: Record<string, string> = {
  Standard: "Standard",
  "Standard PRO": "Standard PRO",
  Absolute: "Absolute",
  AquaCalcium: "PURE AquaCalcium",
  Balance: "PURE Balance",
  Alkafuse: "PURE Alkafuse",
  "Потрійний фільтр": "Потрійний фільтр",
};

function rcCompat(p: Product): string[] {
  return uniq(f(p, "compatibility").map((c) => RC_COMPAT[c]));
}

function rcPeriod(p: Product): string[] {
  if (/річний запас|"12 місяців"/i.test(p.name)) return ["12 місяців"];
  if (/"6 місяців"/i.test(p.name)) return ["6 місяців"];
  return f(p, "period");
}

// --- Cartridges for mainline filters -----------------------------------------

function mcType(p: Product): string[] {
  if (/SCALEX/i.test(p.name)) return ["Від накипу"];
  const material = f(p, "material")[0] ?? "";
  const task = f(p, "task")[0] ?? "";
  if (task === "Залізо") return ["Від заліза"];
  if (task === "Сірководень") return ["Від сірководню"];
  if (task === "Пом'якшення") return ["Для пом'якшення води"];
  if (material.startsWith("Гранульоване")) return ["Вугільний (гранульований)"];
  if (material.startsWith("Пресоване")) return ["Карбон-блок"];
  if (material === "Поліпропіленова нитка") return ["З поліпропіленової нитки"];
  if (material === "Спінений поліпропілен") return ["Поліпропіленовий"];
  return [];
}

function mcRemoves(p: Product): string[] {
  if (/SCALEX/i.test(p.name)) return ["Накип"];
  const task = f(p, "task")[0] ?? "";
  if (task === "Хлор та запах") return ["Хлор", "Органіка"];
  if (task === "Механічне очищення" || task === "Бактерії") return ["Механічні домішки"];
  if (task === "Пом'якшення") return ["Жорсткість"];
  return task ? [task] : [];
}

function mcSize(p: Product): string[] {
  if (/SCALEX/i.test(p.name)) return [];
  return f(p, "size").map((s) => s.replace("×", " × "));
}

// --- Filter media ------------------------------------------------------------

const FM_TYPE: Record<string, string> = {
  ECOMIX: "Ecomix",
  Сіль: "Таблетована сіль",
  "Активоване вугілля": "Активоване вугілля",
  "Іонообмінна смола": "Іонообмінні смоли",
  "Кварцовий пісок": "Для механічної фільтрації",
  "Filter-Ag": "Для механічної фільтрації",
};

// --- HoReCa ------------------------------------------------------------------

const HORECA_CAPACITY: Record<string, string> = {
  ROBUST1000STD: "60 л/год",
  ROBUSTCOFFEE: "75 л/год",
  ROBUST1500ECO: "100 л/год",
  ROBUST3000MAX: "160 л/год",
  ROBUST4000: "180 л/год",
};

// -----------------------------------------------------------------------------

type Facet = FacetDef & { values: (p: Product) => string[] };

const pass = (key: string) => (p: Product) => f(p, key);

const FACETS: Record<CategoryKey, Facet[]> = {
  "reverse-osmosis": [
    { key: "line", label: "Лінійка фільтра", values: roLine, order: ["PURE", "Absolute", "Standard", "CROSS"] },
    { key: "tank", label: "Накопичувальний бак", values: roTank, order: ["З баком", "Без бака"] },
    { key: "pump", label: "Помпа", values: roPump, order: ["З помпою", "Без помпи"] },
    { key: "mineral", label: "Мінералізація", values: roMineral, order: ["З мінералізатором", "Без мінералізатора"] },
    {
      key: "stages",
      label: "Ступені очищення",
      values: (p) => uniq([spec(p, /ступен/i)?.replace(/\D/g, "")]),
    },
    { key: "features", label: "Особливості моделі", values: roFeatures },
  ],
  "flow-filters": [],
  "filtration-systems": [
    { key: "type", label: "Тип фільтра", values: (p) => uniq(f(p, "task").map((t) => FS_TYPE[t])) },
    { key: "body", label: "Тип корпусу", values: (p) => (has(p, "format", "Кабінетна") ? ["Компактний (кабінет)"] : has(p, "format", "Колонна") ? ["Колона"] : []) },
    { key: "removes", label: "Від чого чистимо?", values: (p) => uniq(f(p, "problem").map((x) => FS_REMOVES[x])) },
    { key: "where", label: "Де очищуємо?", values: fsWhere },
    { key: "media", label: "Фільтруючий матеріал", values: fsMedia },
    { key: "line", label: "Лінійка фільтра", values: (p) => f(p, "series").filter((s) => ["Core", "Anthracite", "A-Soft", "Titanium"].includes(s)) },
    { key: "valve", label: "Клапан", values: (p) => uniq([fsSku(p).valve]) },
    { key: "size", label: "Типорозмір", values: (p) => uniq([fsSku(p).size]) },
  ],
  "mainline-filters": [
    { key: "type", label: "Тип продукту", values: mfType },
    { key: "temperature", label: "Температура води", values: (p) => (has(p, "temperature", "Гаряча") ? ["Для гарячої води"] : ["Для холодної води"]) },
    { key: "connection", label: "Діаметр підключення", values: mfConnection, order: ["1/2″", "3/4″", "1″"] },
    { key: "size", label: "Типорозмір", values: mfSize },
    { key: "brand", label: "Бренд", values: (p) => [/BWT/.test(p.name) ? "BWT" : "Ecosoft"] },
  ],
  "ro-cartridges": [
    { key: "compat", label: "Сумісність з фільтром", values: rcCompat },
    { key: "type", label: "Тип картриджа", values: rcType },
    { key: "period", label: "Частота заміни", values: rcPeriod, order: ["6 місяців", "12 місяців"] },
    { key: "gpd", label: "Продуктивність мембрани", values: pass("gpd") },
    { key: "elements", label: "Кількість картриджів", values: pass("elements") },
  ],
  "mainline-cartridges": [
    { key: "size", label: "Типорозмір", values: mcSize, order: ['2,5" × 10"', '4,5" × 10"', '4,5" × 20"'] },
    { key: "type", label: "Тип картриджа", values: mcType },
    { key: "removes", label: "Від чого чистимо?", values: mcRemoves },
    { key: "micron", label: "Рейтинг фільтрації", values: pass("micron"), order: ["1 мкм", "5 мкм", "10 мкм", "20 мкм", "20-5 мкм"] },
    { key: "qty", label: "Кількість у комплекті", values: (p) => f(p, "qty").map((q) => `${q} шт.`) },
  ],
  "filter-media": [
    { key: "type", label: "Тип", values: (p) => uniq(f(p, "materialType").map((m) => FM_TYPE[m])) },
    { key: "purpose", label: "Призначення", values: pass("purpose") },
    { key: "brand", label: "Марка", values: pass("brand") },
    { key: "volume", label: "Обʼєм / вага", values: pass("volume") },
  ],
  horeca: [
    {
      key: "capacity",
      label: "Продуктивність",
      values: (p) => uniq([HORECA_CAPACITY[p.sku ?? ""]]),
      order: ["60 л/год", "75 л/год", "100 л/год", "160 л/год", "180 л/год"],
    },
  ],
};

/** Facets for the whole-catalogue and search pages (shared by every category). */
const UNIVERSAL: Facet[] = [
  { key: "purpose", label: "Призначення", values: pass("purpose") },
  { key: "problem", label: "Проблема води", values: pass("problem") },
];

export const SUBCATEGORIES: Record<CategoryKey, Subcategory[]> = {
  "reverse-osmosis": [
    { key: "pure", label: "Фільтри PURE з мінералами", filter: { line: ["PURE"] } },
    { key: "absolute", label: "Покращені фільтри Absolute", filter: { line: ["Absolute"] } },
    { key: "standard", label: "Базові фільтри Standard", filter: { line: ["Standard"] } },
    { key: "cross", label: "Смарт фільтри CROSS", filter: { line: ["CROSS"] } },
  ],
  "flow-filters": [],
  "filtration-systems": [
    { key: "compact", label: "Компактні фільтри", filter: { body: ["Компактний (кабінет)"] } },
    { key: "iron", label: "Фільтри від заліза та твердості", filter: { type: ["Для знезалізнення і пом'якшення"] } },
    { key: "column", label: "Фільтри колонного типу", filter: { body: ["Колона"] } },
    { key: "softening", label: "Фільтри пом'якшення води", filter: { type: ["Для пом'якшення води"] } },
    { key: "chlorine", label: "Фільтри для видалення хлору", filter: { type: ["Для видалення хлору"] } },
    { key: "sulfide", label: "Фільтри для видалення сірководню", filter: { type: ["Для видалення сірководню"] } },
    { key: "mechanical", label: "Фільтри механічного очищення", filter: { type: ["Для механічного очищення"] } },
  ],
  "mainline-filters": [
    { key: "backwash", label: "Промивні", filter: { type: ["Промивний", "Дисковий"] } },
    { key: "cartridge", label: "Картриджні", filter: { type: ["Картриджний", "Колба Big Blue"] } },
    { key: "antiscale", label: "Від накипу", filter: { type: ["Фільтр від накипу"] } },
    { key: "hot", label: "Для гарячої води", filter: { temperature: ["Для гарячої води"] } },
    { key: "cold", label: "Для холодної води", filter: { temperature: ["Для холодної води"] } },
  ],
  "ro-cartridges": [
    { key: "standard", label: "Для зворотних осмосів Standard", filter: { compat: ["Standard", "Standard PRO"] } },
    { key: "absolute", label: "Для зворотних осмосів Absolute", filter: { compat: ["Absolute"] } },
    { key: "pure", label: "Для зворотних осмосів PURE", filter: { compat: ["PURE AquaCalcium", "PURE Balance", "PURE Alkafuse"] } },
    { key: "flow", label: "Для проточних фільтрів", filter: { compat: ["Потрійний фільтр"] } },
  ],
  "mainline-cartridges": [
    { key: "2510", label: 'Для стандартного фільтра (2,5"×10")', filter: { size: ['2,5" × 10"'] } },
    { key: "bb10", label: 'Для фільтра BB10 (4,5"×10")', filter: { size: ['4,5" × 10"'] } },
    { key: "bb20", label: 'Для фільтра BB20 (4,5"×20")', filter: { size: ['4,5" × 20"'] } },
    { key: "antiscale", label: "Для фільтрів від накипу", filter: { type: ["Від накипу"] } },
    { key: "mechanical", label: "Від механічних домішок", filter: { removes: ["Механічні домішки"] } },
    { key: "iron", label: "Від заліза", filter: { type: ["Від заліза"] } },
    { key: "chlorine", label: "Від хлору", filter: { removes: ["Хлор"] } },
    { key: "softening", label: "Для пом'якшення", filter: { type: ["Для пом'якшення води"] } },
  ],
  "filter-media": [
    { key: "ecomix", label: "Фільтрувальний матеріал Ecomix", filter: { type: ["Ecomix"] } },
    { key: "salt", label: "Таблетована сіль", filter: { type: ["Таблетована сіль"] } },
    { key: "carbon", label: "Вугілля", filter: { type: ["Активоване вугілля"] } },
    { key: "resin", label: "Іонообмінні смоли", filter: { type: ["Іонообмінні смоли"] } },
    { key: "mechanical", label: "Для механічної фільтрації", filter: { type: ["Для механічної фільтрації"] } },
  ],
  horeca: [],
};

function facetsOf(category?: CategoryKey): Facet[] {
  return category ? FACETS[category] : UNIVERSAL;
}

/** Facet definitions (key, label, order) shown for a category, or the universal ones. */
export function facetsForCategory(category?: CategoryKey): FacetDef[] {
  return facetsOf(category).map(({ key, label, order }) => ({ key, label, order }));
}

/** A product's values for a facet of the given scope (a category, or undefined for the universal facets). */
export function facetValues(product: Product, key: string, scope?: CategoryKey): string[] {
  const facet = facetsOf(scope).find((x) => x.key === key);
  return facet ? facet.values(product) : [];
}

/** Every facet value of a product (for search). */
export function allFacetValues(product: Product): string[] {
  return FACETS[product.category].flatMap((facet) => facet.values(product));
}

/** Subcategory query string, e.g. "?line=PURE" or "?compat=Standard&compat=Standard+PRO". */
export function subcategoryQuery(sub: Subcategory): string {
  const params = new URLSearchParams();
  for (const [key, values] of Object.entries(sub.filter)) for (const v of values) params.append(key, v);
  return `?${params.toString()}`;
}

// --- Key characteristics (product cards, product page, comparison) -----------

export type KeySpec = { label: string; value: string };

type KeySpecDef = { label: string; value: (p: Product) => string | undefined };

/** A facet's values as text ("Так"/"Ні" style facets are handled by their own defs). */
const facetText = (key: string) => (p: Product) => facetValues(p, key, p.category).join(", ") || undefined;
const specText = (re: RegExp, suffix = "") => (p: Product) => {
  const v = spec(p, re)?.trim();
  return v ? `${v}${suffix}` : undefined;
};
const yesNo = (key: string) => (p: Product) => (f(p, key)[0] === "Є" ? "Так" : f(p, key)[0] === "Немає" ? "Ні" : undefined);

/** "7 л" when the volume is known, otherwise one of "З баком" / "Без бака". */
function roTankSpec(p: Product): string {
  const raw = spec(p, /^Накопичувальний бак$/)?.trim();
  if (raw && /\d/.test(raw)) return raw;
  if (raw && /без/i.test(raw)) return "Без бака";
  return has(p, "systemType", "З баком") || (raw && !/без/i.test(raw)) ? "З баком" : "Без бака";
}

const KEY_SPECS: Record<CategoryKey, KeySpecDef[]> = {
  "reverse-osmosis": [
    { label: "Ступенів очищення", value: (p) => spec(p, /ступен/i)?.replace(/\D/g, "") || undefined },
    { label: "Мінералізація", value: yesNo("mineralization") },
    { label: "Помпа", value: yesNo("pump") },
    { label: "Накопичувальний бак", value: roTankSpec },
    { label: "Лінійка", value: facetText("line") },
    { label: "Монтаж", value: specText(/^Монтаж$/) },
  ],
  "flow-filters": [
    { label: "Ступенів очищення", value: (p) => f(p, "stages")[0] },
    { label: "Лінійка", value: (p) => f(p, "line")[0] },
    { label: "Монтаж", value: (p) => f(p, "installation")[0] },
  ],
  "filtration-systems": [
    { label: "Тип фільтра", value: facetText("type") },
    { label: "Тип корпусу", value: facetText("body") },
    { label: "Типорозмір", value: facetText("size") },
    { label: "Клапан", value: facetText("valve") },
    { label: "Продуктивність, м³/год", value: specText(/^Продуктивність робоча(\s*\/\s*максимальна)?, м3\/год$/) },
    { label: "Фільтруючий матеріал", value: facetText("media") },
  ],
  "mainline-filters": [
    { label: "Тип", value: facetText("type") },
    { label: "Підключення", value: facetText("connection") },
    { label: "Температура води", value: facetText("temperature") },
    { label: "Типорозмір", value: facetText("size") },
    { label: "Бренд", value: facetText("brand") },
  ],
  "ro-cartridges": [
    { label: "Тип", value: facetText("type") },
    { label: "Сумісність", value: facetText("compat") },
    { label: "Частота заміни", value: facetText("period") },
    { label: "Картриджів у комплекті", value: facetText("elements") },
    { label: "Продуктивність мембрани", value: facetText("gpd") },
  ],
  "mainline-cartridges": [
    { label: "Типорозмір", value: facetText("size") },
    { label: "Тип", value: facetText("type") },
    { label: "Рейтинг фільтрації", value: facetText("micron") },
    { label: "У комплекті", value: facetText("qty") },
  ],
  "filter-media": [
    { label: "Тип", value: facetText("type") },
    { label: "Обʼєм / вага", value: facetText("volume") },
    { label: "Призначення", value: facetText("purpose") },
    { label: "Марка", value: facetText("brand") },
  ],
  horeca: [
    { label: "Продуктивність", value: facetText("capacity") },
    { label: "Лінійка", value: (p) => f(p, "line")[0] },
    { label: "Призначення", value: (p) => (has(p, "forCoffee", "Так") ? "Кавомашини" : "Кафе, ресторани, готелі") },
  ],
};

/** Up to `limit` known characteristics of a product, in the category's order of importance. */
export function keySpecs(product: Product, limit = 6): KeySpec[] {
  const out: KeySpec[] = [];
  for (const def of KEY_SPECS[product.category]) {
    const value = def.value(product);
    if (value) out.push({ label: def.label, value: formatSpecValue(value) });
    if (out.length === limit) break;
  }
  return out;
}

/** Labels compared across products of a category. */
export function keySpecLabels(category: CategoryKey): string[] {
  return KEY_SPECS[category].map((d) => d.label);
}

/** Value of one key characteristic by label ("" when unknown). */
export function keySpecValue(product: Product, label: string): string {
  const value = KEY_SPECS[product.category].find((d) => d.label === label)?.value(product);
  return value ? formatSpecValue(value) : "";
}

const MEDIA_BRANDS: Record<string, string> = {
  ECOMIX: "Ecosoft",
  Ecolite: "Ecosoft",
  Sanitabs: "BWT",
  Dowex: "Dowex",
  Amberlite: "Amberlite",
  Centaur: "Calgon Carbon",
  Filtrasorb: "Calgon Carbon",
  "Filter-Ag": "Clack",
};

/** Manufacturer shown above the product name (omitted when the data doesn't say). */
export function productBrand(product: Product): string | undefined {
  if (/\bBWT\b/.test(product.name)) return "BWT";
  if (product.category === "filter-media") {
    const brand = f(product, "brand")[0];
    if (brand) return MEDIA_BRANDS[brand];
    return /Ecosoft/i.test(product.name) ? "Ecosoft" : undefined;
  }
  return "Ecosoft";
}
