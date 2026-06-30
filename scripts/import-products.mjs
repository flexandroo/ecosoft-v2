// Imports the real Ecosoft catalogue (originally an XML export, parsed by the
// ecosoftweb project into JSON) and regenerates src/lib/products.ts in the
// ecosoft-v2 schema. Re-run with: node scripts/import-products.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "source");
const OUT = path.join(__dirname, "..", "src", "lib", "products.ts");

const products = JSON.parse(
  fs.readFileSync(path.join(SRC, "products.data.json"), "utf8"),
);
const details = JSON.parse(
  fs.readFileSync(path.join(SRC, "product-details.data.json"), "utf8"),
);

// ---- real Ecosoft taxonomy: keep the source category as the CategoryKey ----
const VALID_CATEGORIES = new Set([
  "reverse-osmosis",
  "flow-filters",
  "filtration-systems",
  "mainline-filters",
  "ro-cartridges",
  "mainline-cartridges",
  "filter-media",
  "horeca",
]);
function mapCategory(p) {
  return VALID_CATEGORIES.has(p.category) ? p.category : "filtration-systems";
}

function parseDocSize(title) {
  // "pasproall-_11_.pdf (17817.56 kb)" -> { name, size }
  const m = title.match(/^(.*?)\s*\(([\d.,]+)\s*(kb|mb|kB|KB|MB)\)\s*$/i);
  if (!m) return { name: title.trim(), size: undefined };
  const name = m[1].trim();
  const num = parseFloat(m[2].replace(",", "."));
  const unit = m[3].toLowerCase();
  let size;
  if (unit === "kb") {
    size = num >= 1024 ? `${(num / 1024).toFixed(1)} MB` : `${Math.round(num)} KB`;
  } else {
    size = `${num.toFixed(1)} MB`;
  }
  return { name: name || title.trim(), size };
}

function clamp(str, max) {
  if (!str) return undefined;
  const t = String(str).trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

const seenSlugs = new Set();
function uniqueSlug(slug) {
  let s = slug;
  let i = 2;
  while (seenSlugs.has(s)) s = `${slug}-${i++}`;
  seenSlugs.add(s);
  return s;
}

// ---- Spec normalisation: keep clean "Параметр — Значення" rows only ----
function cleanSpecs(rawSpecs) {
  if (!Array.isArray(rawSpecs)) return [];
  const seen = new Set();
  const out = [];
  for (const s of rawSpecs) {
    if (!s) continue;
    const label = String(s.name || "").replace(/\s+/g, " ").trim();
    const value = String(s.value || "").replace(/\s+/g, " ").trim();
    if (!label || !value) continue; // drop empty
    if (value.length > 70) continue; // drop description fragments
    if (value.includes(" | ")) continue; // drop merged comparison cells
    if (label.length > 55) continue; // drop sentence-like labels
    if (label.toLowerCase() === value.toLowerCase()) continue; // drop label==value
    const key = label.toLowerCase();
    if (seen.has(key)) continue; // dedupe by label
    seen.add(key);
    out.push({ label, value });
  }
  return out;
}

// ---- Classification: derive line/type/purpose/problem/installation/tags + facet filters ----
function norm(s) {
  return String(s || "").toLowerCase().replace(/[’ʼ`]/g, "'");
}

function classify(p, category) {
  const name = String(p.name || "");
  const n = norm(name);
  const sku = String(p.sku || "").toUpperCase();
  const sub = String(p.subcategory || "");
  const o = {
    line: undefined,
    type: undefined,
    purpose: [],
    problem: [],
    installation: undefined,
    level: undefined,
    tags: [],
    filters: {},
    needsReview: false,
    note: "",
  };
  const F = o.filters;
  const setF = (k, v) => {
    const arr = F[k] || (F[k] = []);
    (Array.isArray(v) ? v : [v]).forEach((x) => {
      if (x && !arr.includes(x)) arr.push(x);
    });
  };
  const add = (arr, ...vals) => vals.forEach((v) => v && !arr.includes(v) && arr.push(v));

  if (category === "reverse-osmosis") {
    o.installation = "Під мийку";
    add(o.purpose, "Питна вода");
    if (/cross/i.test(name)) o.line = "CROSS";
    else if (/pure|aquacalcium|balance|alkafuse/i.test(name)) o.line = "PURE";
    else if (/standard\s*pro/i.test(name)) o.line = "Standard PRO";
    else if (/absolute/i.test(name)) o.line = "Absolute";
    else if (/standard/i.test(name)) o.line = "Standard";
    if (o.line === "CROSS") {
      setF("systemType", ["Компактна", "Розумна"]);
      if (/прямоточн/.test(n)) setF("systemType", "Прямоточна");
    } else {
      setF("systemType", "З баком");
    }
    setF("mineralization", /мінераліз|aquacalcium|balance/i.test(name) ? "Є" : "Немає");
    setF("pump", /помп|pump|pomp/i.test(name) ? "Є" : "Немає");
    if (o.line === "PURE" || o.line === "CROSS") o.level = "Преміальний";
    else if (o.line === "Standard PRO" || o.line === "Absolute") o.level = "Покращений";
    else if (o.line === "Standard") o.level = "Базовий";
  } else if (category === "flow-filters") {
    o.installation = "Під мийку";
    o.type = "Потрійний фільтр";
    if (/standard/i.test(name)) o.line = "Standard";
    add(o.purpose, "Питна вода");
    setF("type", "Потрійний фільтр");
    if (/потрійн/.test(n)) setF("stages", "3");
  } else if (category === "filtration-systems") {
    const isCompact = /CABC/.test(sku) || /компактн|кабінетн/.test(n);
    o.installation = isCompact ? "Кабінетний" : "Колонний";
    add(o.purpose, "Весь будинок");
    setF("format", isCompact ? "Кабінетна" : "Колонна");
    let series, task;
    if (/^FPA/.test(sku)) { series = "FPA"; task = "Видалення хлору"; add(o.problem, "Хлор"); }
    else if (/^FPC/.test(sku)) { series = "FPC"; task = "Видалення сірководню"; add(o.problem, "Сірководень"); }
    else if (/^FP/.test(sku)) { series = "FP"; task = "Механічне очищення"; add(o.problem, "Механічні домішки"); }
    else if (/^FK/.test(sku)) { series = "FK"; task = "Знезалізнення та пом'якшення"; add(o.problem, "Залізо", "Жорсткість"); }
    else if (/^FU/.test(sku)) { series = "FU"; task = "Пом'якшення"; add(o.problem, "Жорсткість"); }
    if (series) setF("series", series);
    if (task) { o.type = task; setF("task", task); }
    const subMap = { FP: "mechanical-systems", FU: "softening-systems", FK: "iron-softening-systems", FPA: "chlorine-removal-systems", FPC: "hydrogen-sulfide-removal-systems" };
    if (series && subMap[series]) o.subcategory = subMap[series];
    add(o.tags, isCompact ? "cabinet-systems" : "column-systems");
    let mline;
    if (/titanium/i.test(name)) mline = "Titanium";
    else if (/anthracite/i.test(name)) mline = "Anthracite";
    else if (/core/i.test(name)) mline = "Core";
    else if (/a-soft/i.test(name)) mline = "A-Soft";
    if (mline) { o.line = mline; setF("series", mline); add(o.tags, mline); }
    else if (series) o.line = series;
    let media;
    if (/MIX/.test(sku) || /ecomix/i.test(name)) media = "ECOMIX";
    else if (series === "FU") media = "Іонообмінна смола";
    else if (series === "FPA") media = "Активоване вугілля";
    else if (series === "FP") media = "Filter-Ag";
    if (media) setF("media", media);
    o.level = /titanium|anthracite|gold/i.test(name) ? "Преміум" : "Стандарт";
  } else if (category === "mainline-filters") {
    o.installation = "Магістральний";
    let type, body, temp;
    if (/scalex|накип/.test(n)) { type = "Від накипу"; body = "Стандартний"; add(o.problem, "Накип"); }
    else if (/самопромивн/.test(n)) { type = "Самопромивний"; body = "Самопромивний"; add(o.problem, "Механічні домішки"); }
    else if (/дисков/.test(n)) { type = "Дисковий"; body = "Дисковий"; add(o.problem, "Механічні домішки"); }
    else if (/aquapoint/.test(n)) { type = "Для всього будинку"; body = "Стандартний"; add(o.problem, "Механічні домішки"); }
    else if (/protector|bwt/.test(n)) { type = "Захисний (BWT)"; body = "Стандартний"; add(o.problem, "Механічні домішки"); }
    else if (/bb10|4510/.test(n) || /4510/.test(sku)) { type = "Колба BB10"; body = "Big Blue"; add(o.problem, "Механічні домішки"); }
    else if (/bb20|4520/.test(n) || /4520/.test(sku)) { type = "Колба BB20"; body = "Big Blue"; add(o.problem, "Механічні домішки"); }
    else if (/високого тиску/.test(n)) { type = "Високого тиску"; body = "Високого тиску"; add(o.problem, "Механічні домішки"); }
    else { type = "Механічний"; body = "Стандартний"; add(o.problem, "Механічні домішки"); }
    if (/високого тиску/.test(n) && body === "Стандартний") body = "Високого тиску";
    o.type = type;
    setF("type", type);
    setF("body", body);
    temp = /гаряч|hot|hws.*hr|\bhr\b/.test(n) ? "Гаряча" : "Холодна";
    setF("temperature", temp);
    const conn = [];
    if (/1\/2"|½/.test(name)) conn.push('1/2"');
    if (/3\/4"|¾/.test(name)) conn.push('3/4"');
    if (/\b1"/.test(name)) conn.push('1"');
    conn.forEach((c) => setF("connection", c));
    if (/пральн|посудомийн/.test(n)) { add(o.purpose, "Пральна машина", "Посудомийна машина"); }
    else if (/бойлер|кот[ел]/.test(n)) { add(o.purpose, "Бойлер", "Котел"); }
    else { add(o.purpose, "Будинок"); }
    o.purpose.forEach((x) => setF("purpose", x));
  } else if (category === "ro-cartridges") {
    o.installation = "Змінний картридж";
    add(o.purpose, "Сервіс");
    let type;
    if (/мембран/.test(n) || /CSV.*GPD/.test(sku)) type = "Мембрана";
    else if (/постфільтр/.test(n)) type = "Постфільтр";
    else if (/мінералізатор/.test(n)) type = "Мінералізатор";
    else if (/річний запас/.test(n)) type = "Річний запас";
    else type = "Комплект картриджів";
    o.type = type;
    setF("type", type);
    const compat = [];
    if (sub === "roc-standard") { compat.push("Standard"); if (/standard\s*pro/i.test(name)) compat.push("Standard PRO"); }
    else if (sub === "roc-absolute") compat.push("Absolute");
    else if (sub === "roc-pure") {
      compat.push("PURE");
      if (/balance/i.test(name)) compat.push("Balance");
      if (/aquacalcium/i.test(name)) compat.push("AquaCalcium");
      if (/alkafuse/i.test(name)) compat.push("Alkafuse");
    } else if (sub === "roc-flow") { compat.push("Потрійний фільтр"); add(o.tags, "flow-filters"); }
    compat.forEach((c) => setF("compatibility", c));
    if (/6 місяц/.test(n)) setF("period", "6 місяців");
    else if (/12 місяц/.test(n) || /річний запас/.test(n)) setF("period", "12 місяців");
    const gpd = name.match(/(\d+)\s*GPD/i);
    if (gpd) setF("gpd", `${gpd[1]} GPD`);
    let elements;
    if (/1-2-3/.test(name)) elements = "3";
    else { const m = n.match(/з\s*(\d+)\s*картридж/); if (m) elements = m[1]; }
    if (elements) setF("elements", elements);
  } else if (category === "mainline-cartridges") {
    o.installation = "Змінний картридж";
    const nn = name.replace(/х/g, "x").replace(/\s+/g, "");
    let size;
    if (/2,5"?x10/i.test(nn)) size = '2,5"×10"';
    else if (/4,5"?x10/i.test(nn)) size = '4,5"×10"';
    else if (/4,5"?x20/i.test(nn) || /45"x20/i.test(nn)) size = '4,5"×20"';
    if (size) setF("size", size);
    let material, task;
    if (/спіненого поліпропілену|спіненого пп/.test(n)) { material = "Спінений поліпропілен"; task = "Механічне очищення"; }
    else if (/поліпропіленової нитки/.test(n)) { material = "Поліпропіленова нитка"; task = "Механічне очищення"; }
    else if (/гранульованим активованим вугіллям/.test(n)) { material = "Гранульоване вугілля (GAC)"; task = "Хлор та запах"; }
    else if (/спресованого активованого вугілля|cto/.test(n)) { material = "Пресоване вугілля (CTO)"; task = "Хлор та запах"; }
    else if (/пом'якшенн/.test(n)) { material = "Іонообмінна смола"; task = "Пом'якшення"; add(o.problem, "Жорсткість"); }
    else if (/видалення заліза/.test(n)) { material = "Спеціальне завантаження"; task = "Залізо"; add(o.problem, "Залізо"); }
    else if (/видалення сірководню/.test(n)) { material = "Спеціальне завантаження"; task = "Сірководень"; add(o.problem, "Сірководень"); }
    if (/бактеріостат/.test(n)) { task = "Бактерії"; add(o.tags, "bacteriostatic"); }
    if (/градієнтн/.test(n)) add(o.tags, "gradient");
    if (material) setF("material", material);
    if (task) { o.type = task; setF("task", task); }
    const micron = name.match(/(\d+(?:[-–]\d+)?)\s*мкм/);
    if (micron) setF("micron", `${micron[1].replace("–", "-")} мкм`);
    let qty = "1";
    const q = n.match(/(\d+)\s*шт/);
    if (q) qty = q[1];
    else if (/комплект.*?3\s*шт|3 шт/.test(n)) qty = "3";
    setF("qty", qty);
  } else if (category === "filter-media") {
    o.installation = "Засипка";
    let mt, purpose;
    if (sub === "fm-salt") { mt = "Сіль"; purpose = "Регенерація"; }
    else if (sub === "fm-ecomix") { mt = "ECOMIX"; purpose = "Комплексна очистка"; }
    else if (sub === "fm-carbon") { mt = "Активоване вугілля"; purpose = "Дехлорування"; }
    else if (sub === "fm-resin") {
      mt = "Іонообмінна смола";
      purpose = /demin|mb-?20/i.test(name) ? "Демінералізація" : "Пом'якшення";
    } else if (sub === "fm-mechanical") {
      if (/кварцов/.test(n)) { mt = "Кварцовий пісок"; purpose = "Підкладка"; }
      else { mt = "Filter-Ag"; purpose = "Механічна фільтрація"; }
    }
    if (mt) setF("materialType", mt);
    if (purpose) { add(o.purpose, purpose); }
    const vol = name.match(/(\d+[.,]?\d*)\s*(л|кг)/i);
    if (vol) setF("volume", `${vol[1].replace(".", ",")} ${vol[2].toLowerCase()}`);
    let brand;
    for (const b of ["ECOMIX", "Dowex", "Ecolite", "Amberlite", "Filter-Ag", "Centaur", "Filtrasorb", "Sanitabs", "BWT"]) {
      if (new RegExp(b, "i").test(name)) { brand = b; break; }
    }
    if (brand) setF("brand", brand);
  } else if (category === "horeca") {
    o.line = "RObust";
    o.installation = "Стаціонарна";
    add(o.purpose, "Бізнес");
    add(o.tags, "reverse-osmosis");
    let cap;
    if (/mini|1000/i.test(name + sku)) cap = "Mini";
    else if (/1500/.test(name + sku)) cap = "1500";
    else if (/3000/.test(name + sku)) cap = "3000";
    else if (/4000/.test(name + sku)) cap = "4000";
    if (cap) setF("capacity", cap);
    setF("forCoffee", /coffee/i.test(name + sku) ? "Так" : "Ні");
    setF("line", "RObust");
  }

  // Mirror normalised fields into the facet map for the universal catalog filters.
  if (o.purpose.length) F.purpose = Array.from(new Set([...(F.purpose || []), ...o.purpose]));
  if (o.problem.length) F.problem = Array.from(new Set([...(F.problem || []), ...o.problem]));
  if (o.installation) setF("installation", o.installation);
  if (o.level) setF("level", o.level);
  if (o.line && !F.line) setF("line", o.line);

  return o;
}

const out = [];
for (const p of products) {
  const d = details[p.slug] || {};
  const category = mapCategory(p);
  const slug = uniqueSlug(p.slug);
  const cls = classify(p, category);

  const specs = cleanSpecs(d.specs);

  const documents = Array.isArray(d.documents)
    ? d.documents
        .filter((doc) => doc && doc.url && doc.title)
        .map((doc) => {
          const { name, size } = parseDocSize(doc.title);
          return size ? { name, href: doc.url, size } : { name, href: doc.url };
        })
    : [];

  const images = Array.isArray(d.images)
    ? [...new Set(d.images.filter(Boolean))].slice(0, 6)
    : [];
  const image = p.image || images[0];

  const features = Array.isArray(p.features)
    ? p.features.map((f) => String(f).trim()).filter(Boolean)
    : [];

  const longDescription = clamp(d.description, 1800);

  const details_obj = {};
  if (specs.length) details_obj.specs = specs;
  if (documents.length) details_obj.documents = documents;
  if (longDescription) details_obj.longDescription = longDescription;

  const product = {
    slug,
    name: String(p.name).trim(),
    category,
    price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
    inStock: p.inStock !== false,
    ctaType: "buy",
    description:
      clamp(p.shortDescription, 220) ||
      clamp(longDescription, 220) ||
      `${p.name}.`,
  };
  if (p.sku) product.sku = String(p.sku).trim();
  // subcategory: task-based for filtration-systems, otherwise the source slug.
  const subcategory = cls.subcategory || (p.subcategory ? String(p.subcategory).trim() : undefined);
  if (subcategory) product.subcategory = subcategory;
  if (cls.line) product.line = cls.line;
  if (cls.type) product.type = cls.type;
  if (cls.purpose.length) product.purpose = cls.purpose;
  if (cls.problem.length) product.problem = cls.problem;
  if (cls.installation) product.installation = cls.installation;
  if (cls.tags.length) product.tags = cls.tags;
  if (Object.keys(cls.filters).length) product.filters = cls.filters;
  if (cls.needsReview) {
    product.needsReview = true;
    if (cls.note) product.reviewNote = cls.note;
  }
  if (features.length) product.features = features.slice(0, 6);
  if (image) product.image = image;
  if (images.length > 1) product.images = images;
  if (Object.keys(details_obj).length) product.details = details_obj;

  out.push(product);
}

// stable order: by category (as in CATEGORIES), then price asc
const CAT_ORDER = [
  "reverse-osmosis",
  "flow-filters",
  "filtration-systems",
  "mainline-filters",
  "ro-cartridges",
  "mainline-cartridges",
  "filter-media",
  "horeca",
];
out.sort(
  (a, b) =>
    CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category) ||
    a.price - b.price,
);

const counts = out.reduce((acc, p) => ((acc[p.category] = (acc[p.category] || 0) + 1), acc), {});

const header = `// AUTO-GENERATED by scripts/import-products.mjs — do not edit by hand.
// Source: real Ecosoft catalogue (XML export -> ecosoftweb JSON).
// Re-run: node scripts/import-products.mjs

export type CategoryKey =
  | "reverse-osmosis"
  | "flow-filters"
  | "filtration-systems"
  | "mainline-filters"
  | "ro-cartridges"
  | "mainline-cartridges"
  | "filter-media"
  | "horeca";

export type HighlightIcon =
  | "shield"
  | "sparkles"
  | "wrench"
  | "leaf"
  | "gauge"
  | "box"
  | "clock"
  | "award"
  | "zap";

export type ProductDetails = {
  audience?: string[];
  highlights?: { icon: HighlightIcon; title: string; desc: string }[];
  specs?: { label: string; value: string }[];
  removes?: { name: string; pct?: string }[];
  bundle?: string[];
  maintenance?: { period: string; cost?: string; description: string };
  installation?: {
    time: string;
    complexity: "easy" | "medium" | "pro";
    description: string;
  };
  documents?: { name: string; href: string; size?: string }[];
  longDescription?: string;
};

export type Product = {
  slug: string;
  sku?: string;
  name: string;
  category: CategoryKey;
  subcategory?: string;
  /** Marketing line / series, e.g. "Standard PRO", "CROSS", "FK", "RObust". */
  line?: string;
  /** Normalised product/system type within the category. */
  type?: string;
  /** What the product is for: drinking water / whole house / appliance protection / business / service. */
  purpose?: string[];
  /** Water problems it addresses: hardness / iron / chlorine / hydrogen sulfide / etc. */
  problem?: string[];
  /** Installation type: under-sink / mainline / column / cabinet / replacement-cartridge / media. */
  installation?: string;
  tags?: string[];
  /** Faceted-filter values consumed by categoryFiltersConfig (facetKey -> values). */
  filters?: Record<string, string[]>;
  /** Set when automatic classification is uncertain. */
  needsReview?: boolean;
  reviewNote?: string;
  price: number;
  oldPrice?: number;
  capacityLpd?: number;
  stages?: number;
  features?: string[];
  inStock: boolean;
  ctaType: "buy" | "request";
  description: string;
  image?: string;
  images?: string[];
  details?: ProductDetails;
};

export const CATEGORIES: { key: CategoryKey; title: string; short: string }[] = [
  { key: "reverse-osmosis", title: "Фільтри зворотного осмосу", short: "Зворотний осмос" },
  { key: "flow-filters", title: "Проточні фільтри", short: "Проточні" },
  { key: "filtration-systems", title: "Фільтраційні системи", short: "Системи" },
  { key: "mainline-filters", title: "Магістральні фільтри", short: "Магістральні" },
  { key: "ro-cartridges", title: "Картриджі для фільтрів води", short: "Картриджі осмос" },
  { key: "mainline-cartridges", title: "Картриджі магістральні", short: "Картриджі магістр." },
  { key: "filter-media", title: "Матеріали для фільтрів", short: "Матеріали" },
  { key: "horeca", title: "Для кафе, ресторанів, готелів", short: "HoReCa" },
];

`;

const footer = `
export function findCategory(key: string | undefined): (typeof CATEGORIES)[number] | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export function productsByCategory(key: CategoryKey): Product[] {
  return PRODUCTS.filter((p) => p.category === key);
}

export function findProduct(category: string, slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.category === category && p.slug === slug);
}

export function relatedProducts(p: Product, limit = 4): Product[] {
  return PRODUCTS.filter((x) => x.category === p.category && x.slug !== p.slug)
    .sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price))
    .slice(0, limit);
}
`;

const body = `export const PRODUCTS: Product[] = ${JSON.stringify(out, null, 2)};\n`;

fs.writeFileSync(OUT, header + body + footer, "utf8");
console.log(`Wrote ${out.length} products to ${path.relative(process.cwd(), OUT)}`);
console.log("By category:", counts);
