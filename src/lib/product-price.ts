import type { Product } from "@/lib/products";

/**
 * "Ціна за запитом": the admin marked the product as request-only, or it has no
 * price. Such products can't go into the cart (the order API refuses them), so
 * the storefront offers a callback instead and leaves them out of price stats
 * and ad feeds.
 */
export function isPriceOnRequest(product: Pick<Product, "ctaType" | "price">): boolean {
  return product.ctaType === "request" || !(product.price > 0);
}
