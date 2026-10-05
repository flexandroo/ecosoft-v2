export type ProductIdentityInput = {
  sku?: string | null;
  id?: string | null;
  slug?: string | null;
};

/**
 * Returns the canonical commerce identifier shared by analytics and product
 * feeds. Keep this as the single source of truth so Meta can match Pixel events
 * to catalogue items.
 */
export function getProductItemId(product: ProductIdentityInput): string {
  return String(product.sku || product.id || product.slug || "");
}

export function getProductImagePath(product: ProductIdentityInput): string {
  const itemId = getProductItemId(product);
  return itemId
    ? `/images/meta-products/${itemId.replace(/[^a-zA-Z0-9._-]/g, "_")}.jpg`
    : "";
}

/**
 * Main image shown on the storefront. Uses the product's own image (which the
 * admin can replace) and falls back to the SKU-based file. The Meta catalogue
 * feed keeps using the SKU-based files and is not affected by this.
 */
export function getProductDisplayImage(product: ProductIdentityInput & { image?: string | null }): string {
  return product.image || getProductImagePath(product);
}
