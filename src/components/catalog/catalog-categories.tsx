import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CATALOG_GROUPS, CATEGORY_IMAGES } from "@/lib/catalog-taxonomy";
import { findCategory, productsByCategory } from "@/lib/products";

export function CatalogCategories() {
  return (
    <div className="space-y-12 md:space-y-16">
      {CATALOG_GROUPS.map((group) => (
        <section key={group.key} aria-labelledby={`catalog-group-${group.key}`}>
          <div className="mb-5 max-w-2xl">
            <h2
              id={`catalog-group-${group.key}`}
              className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-foreground md:text-3xl"
            >
              {group.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base">
              {group.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.categories.map((key) => {
              const category = findCategory(key);
              if (!category) return null;
              const count = productsByCategory(key).length;
              return (
                <Link
                  key={key}
                  href={`/catalog/${key}`}
                  className="group relative flex aspect-[16/10] min-h-52 flex-col justify-end overflow-hidden rounded-2xl border border-border bg-[oklch(0.18_0.04_220)] text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 active:translate-y-0"
                >
                  <Image
                    src={CATEGORY_IMAGES[key]}
                    alt=""
                    aria-hidden
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.10_0.04_220/0.94),oklch(0.12_0.04_220/0.32)_58%,transparent)] transition-opacity duration-300 group-hover:opacity-90" />
                  <div className="relative z-10 p-5 md:p-6">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] md:text-2xl">
                          {category.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-white/80 tabular">
                          {count} {pluralize(count, ["товар", "товари", "товарів"])}
                        </p>
                      </div>
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/15 transition-colors group-hover:bg-white/25">
                        <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
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
