import "server-only";
import { getBanners, type Banner } from "@/lib/banners";
import { getProducts, type StoreProduct } from "@/lib/catalog";
import { categoryImage } from "@/lib/catalog-taxonomy";
import { getStoreCategories } from "@/lib/categories";
import type { CategoryKey } from "@/lib/products";

/** Bestsellers shown until managers mark products as "Хіт" in the admin. */
const FALLBACK_HIT_SKUS = [
  "MO550MECOSTD",
  "MO650MECOSTD",
  "MO1500PECO",
  "FMV3ECOSTD",
  "CPV3ECOSTD",
  "FOSE100ECO",
  "FPV34ECO",
  "FK1054CIMIXP",
];

/**
 * Shown in "Акційні пропозиції" until managers mark products as "Акція" in the
 * admin (regular prices for now; promo prices are set later via "Стара ціна").
 */
const FALLBACK_PROMO_SKUS = [
  "MO675MECO",
  "MO550MPECOSTD",
  "FU1054CI",
  "FOSE200ECO",
  "FPV12ECO",
  "CHV3ECO",
  "CPV4POST",
  "ROBUST1000STD",
];

export type HomeSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  imageDesktop: string;
  imageMobile: string;
  theme: "dark" | "light";
};

export type HomeCategory = {
  key: CategoryKey;
  title: string;
  short: string;
  count: number;
  minPrice: number;
  image: string;
};

export type HomeData = {
  slides: HomeSlide[];
  sideTiles: HomeSlide[];
  hits: StoreProduct[];
  promo: StoreProduct[];
  cartridges: StoreProduct[];
  categories: HomeCategory[];
  featured: StoreProduct | undefined;
};

function fromBanner(b: Banner): HomeSlide {
  return {
    id: b.id,
    eyebrow: b.eyebrow,
    title: b.title,
    subtitle: b.subtitle,
    ctaLabel: b.ctaLabel || "Детальніше",
    href: b.href,
    imageDesktop: b.imageDesktop ?? "",
    imageMobile: b.imageMobile || b.imageDesktop || "",
    theme: b.theme,
  };
}

const uah = (n: number) => `${Math.round(n).toLocaleString("uk-UA")} ₴`;

export async function getHomeData(): Promise<HomeData> {
  const [products, banners, storeCategories] = await Promise.all([getProducts(), getBanners(), getStoreCategories()]);

  const categories: HomeCategory[] = storeCategories
    .filter((c) => !c.hidden)
    .map((c) => {
      const list = products.filter((p) => p.category === c.key);
      return {
        key: c.key,
        title: c.title,
        short: c.short,
        count: list.length,
        minPrice: list.length ? Math.min(...list.map((p) => p.price)) : 0,
        image: c.image,
      };
    })
    .filter((c) => c.count > 0);
  const minPrice = (key: CategoryKey) => categories.find((c) => c.key === key)?.minPrice ?? 0;

  const bySku = new Map(products.map((p) => [p.sku, p]));
  const marked = products.filter((p) => p.isHit && p.inStock);
  const hits = marked.length
    ? marked
    : FALLBACK_HIT_SKUS.map((sku) => bySku.get(sku)).filter((p): p is StoreProduct => Boolean(p));

  const markedPromo = products.filter((p) => (p.isPromo || p.oldPrice) && p.inStock);
  const promo = markedPromo.length
    ? markedPromo
    : FALLBACK_PROMO_SKUS.map((sku) => bySku.get(sku)).filter((p): p is StoreProduct => Boolean(p && p.inStock));
  const cartridges = products
    .filter((p) => p.category === "ro-cartridges" && p.inStock)
    .slice(0, 10);

  const heroBanners = banners.filter((b) => b.placement === "hero" && b.imageDesktop);
  const sideBanners = banners.filter((b) => b.placement === "side" && b.imageDesktop);

  const slides: HomeSlide[] = heroBanners.length
    ? heroBanners.map(fromBanner)
    : [
        {
          id: "ro",
          eyebrow: "Питна вода на кухні",
          title: "Зворотний осмос Ecosoft",
          subtitle: `Очищення до 99% домішок, мінералізація і монтаж під ключ. Від ${uah(minPrice("reverse-osmosis"))}.`,
          ctaLabel: "Обрати фільтр",
          href: "/catalog/reverse-osmosis",
          imageDesktop: categoryImage("reverse-osmosis"),
          imageMobile: categoryImage("reverse-osmosis"),
          theme: "light",
        },
        {
          id: "house",
          eyebrow: "Вода для всього будинку",
          title: "Пом’якшення і знезалізнення",
          subtitle: `Комплексні системи для будинку і свердловини з підбором під аналіз води. Від ${uah(minPrice("filtration-systems"))}.`,
          ctaLabel: "Переглянути системи",
          href: "/catalog/filtration-systems",
          imageDesktop: categoryImage("filtration-systems"),
          imageMobile: categoryImage("filtration-systems"),
          theme: "light",
        },
        {
          id: "horeca",
          eyebrow: "Для кавʼярень і ресторанів",
          title: "Вода для кави та HoReCa",
          subtitle: "Стабільна якість води для кавомашин, льодогенераторів і кухні.",
          ctaLabel: "Рішення для бізнесу",
          href: "/catalog/horeca",
          imageDesktop: categoryImage("horeca"),
          imageMobile: categoryImage("horeca"),
          theme: "light",
        },
      ];

  const sideTiles: HomeSlide[] = sideBanners.length
    ? sideBanners.slice(0, 2).map(fromBanner)
    : [
        {
          id: "cartridges",
          eyebrow: "Обслуговування",
          title: "Картриджі для осмосу",
          subtitle: `Від ${uah(minPrice("ro-cartridges"))}`,
          ctaLabel: "До картриджів",
          href: "/catalog/ro-cartridges",
          imageDesktop: categoryImage("ro-cartridges"),
          imageMobile: categoryImage("ro-cartridges"),
          theme: "light",
        },
        {
          id: "flow",
          eyebrow: "Під мийку",
          title: "Проточні фільтри",
          subtitle: `Від ${uah(minPrice("flow-filters"))}`,
          ctaLabel: "Переглянути",
          href: "/catalog/flow-filters",
          imageDesktop: categoryImage("flow-filters"),
          imageMobile: categoryImage("flow-filters"),
          theme: "light",
        },
      ];

  return {
    slides,
    sideTiles,
    hits,
    promo,
    cartridges,
    categories,
    featured: hits[0],
  };
}
