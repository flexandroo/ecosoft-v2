import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES, productsByCategory, type CategoryKey } from "@/lib/products";

// Category banner images (generated) in /public/images/categories.
const IMAGES: Record<CategoryKey, string> = {
  "reverse-osmosis": "/images/categories/reverse-osmosis.png",
  "flow-filters": "/images/categories/flow-filters.jpeg",
  "filtration-systems": "/images/categories/filtration-systems.png",
  "mainline-filters": "/images/categories/mainline-filters.jpeg",
  "ro-cartridges": "/images/categories/ro-cartridges.jpeg",
  "mainline-cartridges": "/images/categories/mainline-cartridges.jpeg",
  "filter-media": "/images/categories/filter-media.jpeg",
  horeca: "/images/categories/horeca.jpeg",
};

export function CatalogCategories() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((c) => {
        const count = productsByCategory(c.key).length;
        return (
          <Link
            key={c.key}
            href={`/catalog/${c.key}`}
            className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-2xl border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMAGES[c.key]}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.14_0.04_220/0.92),oklch(0.15_0.04_220/0.35)_45%,transparent)]" />
            <div className="relative z-10 p-5 text-white">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] md:text-2xl">
                  {c.title}
                </h2>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur-md transition-colors group-hover:bg-white/25">
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
              <p className="mt-1 text-sm text-white/80 tabular">
                {count} {pluralize(count, ["товар", "товари", "товарів"])}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function pluralize(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
