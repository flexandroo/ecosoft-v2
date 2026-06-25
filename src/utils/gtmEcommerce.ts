// GA4 ecommerce events pushed to window.dataLayer (GTM/GA4 datalayer pattern).
// Every push first clears the previous ecommerce object, then dispatches the
// event. All functions are client-only and safe to call during SSR (no-op).
import { findCategory } from "@/lib/products";

type DataLayerObject = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerObject[];
  }
}

const CURRENCY = "UAH";
const DEFAULT_BRAND = "Ecosoft";

/** Loose input that any product/cart-line shape can satisfy. */
export type GA4ItemInput = {
  sku?: string | null;
  id?: string | null;
  slug?: string | null;
  name: string;
  /** Category key or readable name. */
  category?: string | null;
  subcategory?: string | null;
  price: number;
  brand?: string | null;
};

export type GA4Item = {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: string;
  item_category2: string;
  price: number;
  quantity: number;
};

export type GA4OrderInput = {
  transactionId: string;
  total: number;
  shipping?: number;
  tax?: number;
  items: (GA4ItemInput & { quantity: number })[];
};

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Resolve a category key to its readable title (falls back to the raw value). */
function categoryName(category?: string | null): string {
  if (!category) return "";
  return findCategory(category)?.title ?? category;
}

/** Normalise a product / cart line into a GA4 ecommerce item. */
export function mapProductToGA4Item(
  product: GA4ItemInput,
  quantity: number,
): GA4Item {
  const qty = Math.max(1, Math.floor(quantity) || 1);
  return {
    item_id: String(product.sku || product.id || product.slug || ""),
    item_name: product.name,
    item_brand: product.brand || DEFAULT_BRAND,
    item_category: categoryName(product.category),
    item_category2: product.subcategory ?? "",
    price: round2(product.price),
    quantity: qty,
  };
}

/** Low-level push: clears ecommerce, then dispatches the event (client only). */
function pushEcommerce(event: string, ecommerce: DataLayerObject): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ecommerce });
}

export function pushViewItem(product: GA4ItemInput): void {
  pushEcommerce("view_item", {
    currency: CURRENCY,
    value: round2(product.price),
    items: [mapProductToGA4Item(product, 1)],
  });
}

export function pushAddToCart(product: GA4ItemInput, quantity = 1): void {
  const qty = Math.max(1, Math.floor(quantity) || 1);
  pushEcommerce("add_to_cart", {
    currency: CURRENCY,
    value: round2(product.price * qty),
    items: [mapProductToGA4Item(product, qty)],
  });
}

export function pushBeginCheckout(
  items: (GA4ItemInput & { quantity: number })[],
  cartTotal: number,
): void {
  pushEcommerce("begin_checkout", {
    currency: CURRENCY,
    value: round2(cartTotal),
    items: items.map((it) => mapProductToGA4Item(it, it.quantity)),
  });
}

// Guards against duplicate purchase pushes for the same transaction_id, both
// within the page lifetime and across reloads of the success view.
const firedPurchases = new Set<string>();
const PURCHASE_STORAGE_KEY = "ga4_purchases";

function alreadyPurchased(id: string): boolean {
  if (firedPurchases.has(id)) return true;
  try {
    const raw = sessionStorage.getItem(PURCHASE_STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return list.includes(id);
  } catch {
    return false;
  }
}

function markPurchased(id: string): void {
  firedPurchases.add(id);
  try {
    const raw = sessionStorage.getItem(PURCHASE_STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(id)) {
      list.push(id);
      sessionStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    /* ignore storage errors */
  }
}

export function pushPurchase(order: GA4OrderInput): void {
  if (typeof window === "undefined") return;
  if (!order.transactionId) return;
  if (alreadyPurchased(order.transactionId)) return;
  markPurchased(order.transactionId);
  pushEcommerce("purchase", {
    transaction_id: order.transactionId,
    currency: CURRENCY,
    value: round2(order.total),
    shipping: round2(order.shipping || 0),
    tax: round2(order.tax || 0),
    items: order.items.map((it) => mapProductToGA4Item(it, it.quantity)),
  });
}
