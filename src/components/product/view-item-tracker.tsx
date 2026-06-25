"use client";

import { useEffect, useRef } from "react";
import { pushViewItem, type GA4ItemInput } from "@/utils/gtmEcommerce";

/**
 * Fires a GA4 `view_item` event once when a product page mounts.
 * Renders nothing. The ref guard prevents duplicate pushes on re-render
 * (and on React StrictMode's double-invoke in development).
 */
export function ViewItemTracker({ product }: { product: GA4ItemInput }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    pushViewItem(product);
    // Fire once per mount; `product` is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
