import Link from "next/link";
import { ArrowRight, Droplet, Waves, Filter, Layers, Factory } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatUah } from "@/lib/format";
import type { CategoryKey, Product } from "@/lib/products";

const ICON_BY_CATEGORY: Record<CategoryKey, LucideIcon> = {
  osmos: Droplet,
  softeners: Waves,
  filters: Filter,
  cartridges: Layers,
  industrial: Factory,
};

export function ProductCard({ product }: { product: Product }) {
  const Icon = ICON_BY_CATEGORY[product.category];

  const spec = [
    product.stages != null ? `${product.stages} ступенів` : null,
    product.capacityLpd != null
      ? product.capacityLpd >= 1000
        ? `${product.capacityLpd / 1000} м³/добу`
        : `${product.capacityLpd} л/добу`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/15">
      <Link
        href={`/catalog/${product.category}/${product.slug}`}
        aria-label={product.name}
        className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-white"
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="size-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Icon
            className="size-16 text-primary/40 transition-transform group-hover:scale-110"
            aria-hidden
          />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.oldPrice && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
              Знижка
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
              Під замовлення
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/catalog/${product.category}/${product.slug}`} className="block">
          <h3 className="font-[family-name:var(--font-manrope)] text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        {spec && <p className="mt-1 text-xs text-muted-foreground">{spec}</p>}

        <div className="mt-3 flex items-baseline gap-2 tabular">
          <span className="font-[family-name:var(--font-manrope)] text-xl font-bold text-foreground">
            {formatUah(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatUah(product.oldPrice)}
            </span>
          )}
        </div>

        <div className="mt-4 flex-1" />

        {product.ctaType === "buy" ? (
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]">
            Купити
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        ) : (
          <Link
            href={`/catalog/${product.category}/${product.slug}#request`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.98]"
          >
            Замовити консультацію
          </Link>
        )}
      </div>
    </article>
  );
}
