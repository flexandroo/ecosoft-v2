"use client";

import { useState } from "react";
import { Check, Copy, Minus, Plus, ShoppingCart } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { Product } from "@/lib/products";

/** Quantity stepper + "Купити" (adds the chosen quantity to the cart). */
export function BuyBox({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const step = "grid size-12 place-items-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40";
  return (
    <div className="flex gap-3">
      <div className="flex h-12 shrink-0 items-center overflow-hidden rounded-xl border border-border bg-card">
        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Менше" className={step}>
          <Minus className="size-4" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          value={qty}
          onChange={(e) => setQty(Math.min(99, Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
          aria-label="Кількість, шт."
          className="h-full w-10 bg-transparent text-center text-sm font-semibold tabular outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Більше" className={step}>
          <Plus className="size-4" />
        </button>
      </div>
      <AddToCartButton
        product={product}
        quantity={qty}
        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
      >
        <ShoppingCart className="size-4" />
        Купити
      </AddToCartButton>
    </div>
  );
}

export function CopySku({ sku }: { sku: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(sku);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable — nothing to do */
        }
      }}
      aria-label={copied ? "Артикул скопійовано" : "Скопіювати артикул"}
      title="Скопіювати артикул"
      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}
