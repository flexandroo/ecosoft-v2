import Link from "next/link";
import {
  ArrowUpRight,
  Droplet,
  Waves,
  Package,
  Filter,
  Layers,
  Boxes,
  FlaskConical,
  Coffee,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATEGORIES, productsByCategory, type CategoryKey } from "@/lib/products";

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

export function CategoryGrid({ activeKey }: { activeKey?: CategoryKey }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {CATEGORIES.map((c) => {
        const Icon = ICON_BY_CATEGORY[c.key];
        const count = productsByCategory(c.key).length;
        const active = c.key === activeKey;
        return (
          <Link
            key={c.key}
            href={`/catalog/${c.key}`}
            aria-current={active ? "page" : undefined}
            className={[
              "group relative flex items-center gap-3 rounded-2xl border p-4 transition-all duration-200",
              "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10",
              active
                ? "border-primary bg-primary/5"
                : "border-border bg-card",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
                active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
              ].join(" ")}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-[family-name:var(--font-manrope)] text-sm font-bold leading-snug tracking-tight text-foreground">
                {c.title}
              </span>
              <span className="text-xs text-muted-foreground tabular">
                {count} {pluralize(count, ["товар", "товари", "товарів"])}
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
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
