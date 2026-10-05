"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { useCart } from "./cart-context";
import { pushAddToCart } from "@/utils/gtmEcommerce";
import type { Product } from "@/lib/products";
import { getProductDisplayImage } from "@/lib/product-identity";

export function AddToCartButton({
  product,
  quantity = 1,
  className,
  children,
}: {
  product: Product;
  /** Units to add (the product page has a quantity stepper; cards add one). */
  quantity?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <button
      type="button"
      aria-label={`Додати «${product.name}» в кошик`}
      className={className}
      onClick={() => {
        add({
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          price: product.price,
          image: getProductDisplayImage(product),
          category: product.category,
          subcategory: product.subcategory,
        }, quantity);
        // GA4 / Meta: add_to_cart with the quantity actually added
        pushAddToCart(product, quantity);
        setAdded(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1400);
      }}
    >
      {added ? (
        <>
          <Check className="size-4" />
          Додано
        </>
      ) : (
        children
      )}
    </button>
  );
}
