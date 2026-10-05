// Storefront presentation of categories: types and built-in defaults. Safe for
// client components. The key (URL + product.category) is fixed; ad feeds and
// analytics keep using the technical titles from src/lib/products.ts.
import { CATALOG_GROUPS, CATEGORY_IMAGES, type CatalogGroup } from "@/lib/catalog-taxonomy";
import { CATEGORIES, type CategoryKey } from "@/lib/products";

export type CategoryGroupKey = CatalogGroup["key"];

export type StoreCategory = {
  key: CategoryKey;
  title: string;
  short: string;
  subtitle: string;
  seoTitle: string;
  metaDescription: string;
  seoText: string;
  image: string;
  group: CategoryGroupKey;
  sort: number;
  hidden: boolean;
};

const DEFAULT_SUBTITLES: Record<CategoryKey, string> = {
  "reverse-osmosis":
    "Чиста питна вода для дому та офісу — багатоступенева очистка зі збалансованим мінеральним складом.",
  "flow-filters": "Компактні проточні фільтри під мийку для щоденного приготування та пиття.",
  "filtration-systems": "Помʼякшення, знезалізнення та механічне очищення води для квартири й будинку.",
  "mainline-filters": "Захист сантехніки, котла й техніки — очищення води на вході в будинок.",
  "ro-cartridges": "Оригінальні змінні картриджі та мембрани для систем зворотного осмосу.",
  "mainline-cartridges": "Змінні картриджі для магістральних фільтрів холодної та гарячої води.",
  "filter-media": "Засипки, таблетована сіль, іонообмінні смоли та вугілля для фільтрів.",
  horeca: "Підготовка води для кавʼярень, ресторанів і готелів — стабільна якість напоїв.",
};

const groupOf = (key: CategoryKey): CategoryGroupKey =>
  CATALOG_GROUPS.find((g) => g.categories.includes(key))?.key ?? "drinking";

export const DEFAULT_CATEGORIES: StoreCategory[] = CATEGORIES.map((c, i) => ({
  key: c.key,
  title: c.title,
  short: c.short,
  subtitle: DEFAULT_SUBTITLES[c.key],
  seoTitle: "",
  metaDescription: "",
  seoText: "",
  image: CATEGORY_IMAGES[c.key],
  group: groupOf(c.key),
  sort: (i + 1) * 10,
  hidden: false,
}));

export const CATEGORY_GROUPS: { key: CategoryGroupKey; title: string }[] = CATALOG_GROUPS.map((g) => ({
  key: g.key,
  title: g.title,
}));

export type CategoryRow = {
  key: string;
  title: string;
  short_title: string;
  subtitle: string;
  seo_title: string;
  meta_description: string;
  seo_text: string;
  image: string | null;
  group_key: CategoryGroupKey;
  sort: number;
  is_hidden: boolean;
};

/** Stored rows over defaults; unknown keys are ignored, missing ones keep defaults. */
export function mergeCategories(rows: CategoryRow[]): StoreCategory[] {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return DEFAULT_CATEGORIES.map((d) => {
    const r = byKey.get(d.key);
    if (!r) return d;
    return {
      key: d.key,
      title: r.title?.trim() || d.title,
      short: r.short_title?.trim() || d.short,
      subtitle: r.subtitle?.trim() || d.subtitle,
      seoTitle: r.seo_title?.trim() ?? "",
      metaDescription: r.meta_description?.trim() ?? "",
      seoText: r.seo_text?.trim() ?? "",
      image: r.image?.trim() || d.image,
      group: r.group_key ?? d.group,
      sort: Number.isFinite(r.sort) ? r.sort : d.sort,
      hidden: Boolean(r.is_hidden),
    };
  }).sort((a, b) => a.sort - b.sort);
}
