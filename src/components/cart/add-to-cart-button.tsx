"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { useCart } from "./cart-context";
import type { Product } from "@/lib/products";

export function AddToCartButton({
  product,
  className,
  children,
}: {
  product: Product;
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
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
        });
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
