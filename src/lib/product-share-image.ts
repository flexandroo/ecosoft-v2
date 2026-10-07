import "server-only";
import { PRODUCTS, type Product } from "@/lib/products";
import { getProductImagePath, getProductItemId } from "@/lib/product-identity";

/** SKUs that have a prepared 1200×1200 photo in /public/images/meta-products. */
const PREPARED = new Set(PRODUCTS.map((p) => getProductItemId(p)));

/**
 * Image for ads, social previews, structured data and the sitemap: the prepared
 * SKU photo when one exists, otherwise the product's own (admin-uploaded) photo.
 * Products created in the admin have no prepared file.
 */
export function productShareImage(product: Product): string {
  if (PREPARED.has(getProductItemId(product))) return getProductImagePath(product);
  return product.image || product.images?.[0] || getProductImagePath(product);
}

/** Absolute URL of productShareImage() for feeds and JSON-LD. */
export function productShareImageUrl(product: Product, siteUrl: string): string {
  const src = productShareImage(product);
  return /^https?:\/\//.test(src) ? src : new URL(src, siteUrl).href;
}
