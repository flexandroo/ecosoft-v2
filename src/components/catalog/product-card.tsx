import Link from "next/link";
import {
  Droplet,
  Waves,
  Package,
  Filter,
  Layers,
  Boxes,
  FlaskConical,
  Coffee,
  ShoppingCart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatUah } from "@/lib/format";
import type { CategoryKey, Product } from "@/lib/products";
import { keySpecs, productBrand } from "@/lib/catalog-facets";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { getProductDisplayImage } from "@/lib/product-identity";
import { isPriceOnRequest } from "@/lib/product-price";
import { CallbackButton } from "@/components/site/callback-button";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

const ICON_BY_CATEGORY: Record<CategoryKey, LucideIcon> = {
  "reverse-osmosis": Droplet,
  "flow-filters": Waves,
  "filtration-systems": Package,
  "mainline-filters": Filter,
  "ro-cartridges": Layers,
  "mainline-cartridges": Boxes,
  "filter-media": FlaskConical,
  horeca: Coffee,
};

/**
 * Catalogue card: photo, brand, name, three key characteristics, code,
 * availability with price and the cart button — the parts a buyer compares.
 */
export function ProductCard({ product }: { product: Product }) {
  const Icon = ICON_BY_CATEGORY[product.category];
  const image = getProductDisplayImage(product);
  const brand = productBrand(product);
  const specs = keySpecs(product, 3);
  const href = `/catalog/${product.category}/${product.slug}`;
  const onRequest = isPriceOnRequest(product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/15">
      <Link href={href} aria-label={product.name} className="relative grid aspect-square place-items-center overflow-hidden bg-white">
        {image ? (
          <ProductImage
            src={image}
            alt={product.name}
            sizes="(min-width: 1536px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Icon className="size-16 text-primary/40 transition-transform group-hover:scale-110" aria-hidden />
        )}
        {product.oldPrice && (
          <span className="absolute top-3 left-3 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
            Знижка
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col border-t border-border p-4">
        {brand && <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{brand}</p>}
        <h3 className="mt-1 font-[family-name:var(--font-manrope)] text-[15px] leading-snug font-bold tracking-tight text-foreground">
          <Link href={href} title={product.name} className="line-clamp-3 transition-colors hover:text-primary">
            {product.name}
          </Link>
        </h3>

        {specs.length > 0 && (
          <dl className="mt-3 space-y-1.5 text-xs" aria-label="Ключові характеристики">
            {specs.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-1.5 last:border-0 last:pb-0">
                <dt className="text-muted-foreground">{s.label}</dt>
                <dd className="text-right font-semibold text-foreground">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {product.sku && <p className="mt-3 text-[11px] text-muted-foreground tabular">Код: {product.sku}</p>}

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 pb-1 text-xs font-medium",
                product.inStock ? "text-emerald-700" : "text-muted-foreground",
              )}
            >
              <span aria-hidden className={cn("size-2 rounded-full", product.inStock ? "bg-emerald-500" : "bg-muted-foreground/50")} />
              {product.inStock ? "В наявності" : "Під замовлення"}
            </span>
            <span className="text-right tabular">
              {!onRequest && product.oldPrice && (
                <span className="block text-xs text-muted-foreground line-through">{formatUah(product.oldPrice)}</span>
              )}
              <span className="font-[family-name:var(--font-manrope)] text-xl font-bold text-foreground">
                {onRequest ? "Ціна за запитом" : formatUah(product.price)}
              </span>
            </span>
          </div>

          {onRequest ? (
            <CallbackButton
              source={`Ціна за запитом: ${product.name}${product.sku ? ` (${product.sku})` : ""}`}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
            >
              Дізнатися ціну
            </CallbackButton>
          ) : (
            <AddToCartButton
              product={product}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
            >
              <ShoppingCart className="size-4" />
              До кошика
            </AddToCartButton>
          )}
        </div>
      </div>
    </article>
  );
}
