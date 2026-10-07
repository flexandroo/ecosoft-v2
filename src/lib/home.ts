import "server-only";
import { getBanners, type Banner } from "@/lib/banners";
import { getProducts, type StoreProduct } from "@/lib/catalog";
import { categoryImage } from "@/lib/catalog-taxonomy";
import { getStoreCategories } from "@/lib/categories";
import { getCollections } from "@/lib/collections";
import type { CategoryKey } from "@/lib/products";

/** Rails used when the collections from the admin are unavailable. */
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
  /** Purpose-made banner from the admin (wide art with room for text on the left). */
  bannerArt?: boolean;
  /** Promo tile colour: "accent" uses the brand blue to stand out (sales). */
  tone?: "default" | "accent";
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
  /** Product rails in display order ("Підбірки" shown on the homepage). */
  rails: HomeRail[];
  categories: HomeCategory[];
};

export type HomeRail = {
  id: string;
  title: string;
  eyebrow: string;
  href: string;
  hrefLabel: string;
  products: StoreProduct[];
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
    bannerArt: true,
  };
}

/** Art for the two homepage promo tiles (3:2, subject on the right); replace the files to change them. */
const CARTRIDGES_TILE_IMAGE = "/images/home/cartridges-tile.png";
const PROMO_TILE_IMAGE = "/images/home/promo-tile.png";

function pluralUk(n: number, [one, few, many]: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

const uah = (n: number) => `${Math.round(n).toLocaleString("uk-UA")} ₴`;

export async function getHomeData(): Promise<HomeData> {
  const [products, banners, storeCategories, collections] = await Promise.all([
    getProducts(),
    getBanners(),
    getStoreCategories(),
    getCollections(),
  ]);

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
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const inStock = (list: (StoreProduct | undefined)[]) => list.filter((p): p is StoreProduct => Boolean(p && p.inStock));

  const rails: HomeRail[] = collections?.length
    ? collections
        .filter((c) => c.showOnHome)
        .map((c) => ({
          id: c.slug,
          title: c.title,
          eyebrow: c.eyebrow,
          href: c.linkHref,
          hrefLabel: c.linkLabel,
          products: inStock(c.productSlugs.map((slug) => bySlug.get(slug))),
        }))
        .filter((rail) => rail.products.length > 0)
    : [
        {
          id: "hits",
          title: "Хіти продажів",
          eyebrow: "",
          href: "/catalog",
          hrefLabel: "Весь каталог",
          products: inStock(FALLBACK_HIT_SKUS.map((sku) => bySku.get(sku))),
        },
        {
          id: "promo",
          title: "Акційні пропозиції",
          eyebrow: "",
          href: "/catalog",
          hrefLabel: "Весь каталог",
          products: inStock(FALLBACK_PROMO_SKUS.map((sku) => bySku.get(sku))),
        },
        {
          id: "cartridges",
          title: "Картриджі на заміну",
          eyebrow: "Обслуговування",
          href: "/catalog/ro-cartridges",
          hrefLabel: "Усі картриджі",
          products: products.filter((p) => p.category === "ro-cartridges" && p.inStock).slice(0, 10),
        },
      ];

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

  const promoCount = rails.find((r) => r.id === "promo")?.products.length ?? 0;
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
          imageDesktop: CARTRIDGES_TILE_IMAGE,
          imageMobile: CARTRIDGES_TILE_IMAGE,
          theme: "light",
        },
        {
          id: "promo",
          eyebrow: "Акції",
          title: "Акційні пропозиції",
          subtitle: promoCount ? `${promoCount} ${pluralUk(promoCount, ["пропозиція", "пропозиції", "пропозицій"])} за вигідною ціною` : "Вигідні ціни на фільтри й картриджі",
          ctaLabel: "Дивитися акції",
          href: "/promo",
          imageDesktop: PROMO_TILE_IMAGE,
          imageMobile: PROMO_TILE_IMAGE,
          theme: "dark",
          tone: "accent",
        },
      ];

  return {
    slides,
    sideTiles,
    rails,
    categories,
  };
}
