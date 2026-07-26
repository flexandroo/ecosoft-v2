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
