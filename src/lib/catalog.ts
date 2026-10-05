import "server-only";
import { cache } from "react";
import {
  CATEGORIES,
  PRODUCTS,
  type CategoryKey,
  type Product,
  type ProductDetails,
} from "@/lib/products";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

/** Cache tag shared by every catalogue read; the admin revalidates it on save. */
export const CATALOG_TAG = "catalog";

/** Safety net: even without an explicit revalidation the data refreshes this often. */
const CATALOG_REVALIDATE_SECONDS = 300;

export type StoreProduct = Product & {
  isHit?: boolean;
  isPromo?: boolean;
};

type ProductRow = {
  slug: string;
  sku: string | null;
  category: string;
  name: string;
  price: number | string;
  old_price: number | string | null;
  in_stock: boolean;
  cta_type: "buy" | "request";
  description: string;
  image: string | null;
  images: string[] | null;
  details: ProductDetails | null;
  attributes: Partial<Product> | null;
  is_hit: boolean;
  is_promo: boolean;
};

const CATEGORY_KEYS = new Set<string>(CATEGORIES.map((c) => c.key));

function rowToProduct(row: ProductRow): StoreProduct | null {
  if (!CATEGORY_KEYS.has(row.category)) return null;
  const attributes = row.attributes ?? {};
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
  const details = row.details && Object.keys(row.details).length ? row.details : undefined;
  return {
    ...attributes,
    slug: row.slug,
    sku: row.sku ?? undefined,
    name: row.name,
    category: row.category as CategoryKey,
    price: Number(row.price),
    oldPrice: row.old_price == null ? undefined : Number(row.old_price),
    inStock: row.in_stock,
    ctaType: row.cta_type,
    description: row.description,
    image: row.image ?? undefined,
    images: images.length ? images : undefined,
    details,
    isHit: row.is_hit,
    isPromo: row.is_promo,
  };
}

async function fetchProductsFromDb(): Promise<StoreProduct[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    "?select=slug,sku,category,name,price,old_price,in_stock,cta_type,description,image,images,details,attributes,is_hit,is_promo" +
    "&is_hidden=eq.false&order=sort.asc,name.asc";
  const response = await fetch(url, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
    next: { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`catalog fetch failed: HTTP ${response.status}`);
  const rows = (await response.json()) as ProductRow[];
  return rows.map(rowToProduct).filter((p): p is StoreProduct => p !== null);
}

/**
 * All visible products. Reads the database when configured and falls back to the
 * bundled catalogue if it is not configured, unreachable or (unexpectedly) empty,
 * so the storefront never renders without products.
 */
export const getProducts = cache(async (): Promise<StoreProduct[]> => {
  if (!supabaseConfigured()) return PRODUCTS;
  try {
    const products = await fetchProductsFromDb();
    if (products.length > 0) return products;
    console.error("[catalog] database returned no products, using bundled catalogue");
  } catch (error) {
    console.error("[catalog] falling back to bundled catalogue:", error);
  }
  return PRODUCTS;
});

export async function getProductsByCategory(key: CategoryKey): Promise<StoreProduct[]> {
  return (await getProducts()).filter((p) => p.category === key);
}

export async function getProduct(category: string, slug: string): Promise<StoreProduct | undefined> {
  return (await getProducts()).find((p) => p.category === category && p.slug === slug);
}

export function relatedFrom(products: Product[], product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, limit);
}
