import type { CategoryKey } from "@/lib/products";

export const CATEGORY_IMAGES: Record<CategoryKey, string> = {
  "reverse-osmosis": "/images/category-scenes-v3/reverse-osmosis.png",
  "flow-filters": "/images/category-scenes-v3/flow-filters.png",
  "filtration-systems": "/images/category-scenes-v3/filtration-systems.png",
  "mainline-filters": "/images/category-scenes-v3/mainline-filters.png",
  "ro-cartridges": "/images/category-scenes-v3/ro-cartridges.png",
  "mainline-cartridges": "/images/category-scenes-v3/mainline-cartridges.png",
  "filter-media": "/images/category-scenes-v3/filter-media.png",
  horeca: "/images/category-scenes-v3/horeca.png",
};

export type CatalogGroup = {
  key: "drinking" | "household" | "consumables" | "business";
  title: string;
  description: string;
  categories: CategoryKey[];
};

/**
 * Storefront taxonomy follows the four customer-facing catalog sections used
 * by Ecosoft. Product routes stay stable, while the hierarchy makes the first
 * choice about the customer's task instead of technical terminology.
 */
export const CATALOG_GROUPS: CatalogGroup[] = [
  {
    key: "drinking",
    title: "Питна вода",
    description: "Очищення води для пиття, приготування їжі та напоїв.",
    categories: ["reverse-osmosis", "flow-filters"],
  },
  {
    key: "household",
    title: "Побутова вода",
    description: "Очищення всієї води у квартирі або приватному будинку.",
    categories: ["filtration-systems", "mainline-filters"],
  },
  {
    key: "consumables",
    title: "Змінні картриджі та матеріали",
    description: "Усе для планового обслуговування та відновлення фільтрів.",
    categories: ["ro-cartridges", "mainline-cartridges", "filter-media"],
  },
  {
    key: "business",
    title: "Вода для бізнесу",
    description: "Продуктивні рішення для кафе, ресторанів і готелів.",
    categories: ["horeca"],
  },
];

export function categoryImage(key: CategoryKey): string {
  return CATEGORY_IMAGES[key];
}
