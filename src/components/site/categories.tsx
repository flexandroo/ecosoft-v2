import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Droplet, Waves, Package, Filter, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATEGORY_IMAGES } from "@/lib/catalog-taxonomy";

type Category = {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  span?: string;
  featured?: boolean;
  image?: string;
};

const CATEGORIES: Category[] = [
  {
    href: "/catalog/reverse-osmosis",
    title: "Зворотний осмос",
    desc: "Питна вода для дому та офісу.",
    icon: Droplet,
    span: "md:col-span-2 md:row-span-2",
    featured: true,
    image: CATEGORY_IMAGES["reverse-osmosis"],
  },
  {
    href: "/catalog/mainline-filters",
    title: "Магістральні фільтри",
    desc: "Очищення води на вході в будинок.",
    icon: Filter,
    image: CATEGORY_IMAGES["mainline-filters"],
  },
  {
    href: "/catalog/flow-filters",
    title: "Проточні фільтри",
    desc: "Компактні фільтри під мийку.",
    icon: Waves,
    image: CATEGORY_IMAGES["flow-filters"],
  },
  {
    href: "/catalog/filtration-systems",
    title: "Фільтраційні системи",
    desc: "Помʼякшення, знезалізнення та механічне очищення.",
    icon: Package,
    span: "md:col-span-2",
    image: CATEGORY_IMAGES["filtration-systems"],
  },
  {
    href: "/catalog/ro-cartridges",
    title: "Картриджі",
    desc: "Змінні елементи для обслуговування систем.",
    icon: Layers,
    image: CATEGORY_IMAGES["ro-cartridges"],
  },
];

export function Categories() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 pb-20 pt-8 md:px-8 md:pb-28 md:pt-10">
      <div className="mb-10 flex flex-col gap-3 md:mb-14 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Каталог</p>
          <h2 className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Рішення для будь-якої води
          </h2>
        </div>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Усі категорії <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="grid auto-rows-[210px] grid-cols-1 gap-4 sm:auto-rows-[230px] sm:grid-cols-2 md:grid-cols-3">
        {CATEGORIES.map((c) => (
          <CategoryCard key={c.href + c.title} {...c} />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ href, title, desc, icon: Icon, span, featured, image }: Category) {
  return (
    <Link
      href={href}
      className={[
        "group relative isolate flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/15 active:translate-y-0 active:scale-[0.99]",
        image
          ? "border-primary/10 bg-[oklch(0.965_0.018_222)] text-foreground"
          : featured
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card hover:border-primary/40",
        span ?? "",
      ].join(" ")}
    >
      {image && (
        <>
          <Image
            src={image}
            alt=""
            aria-hidden
            fill
            sizes={featured ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.98_0.008_220)_0%,oklch(0.97_0.014_222/0.96)_38%,oklch(0.96_0.018_222/0.28)_74%,transparent_100%),linear-gradient(0deg,oklch(0.98_0.008_220/0.98)_0%,transparent_62%)] transition-opacity duration-300 group-hover:opacity-90"
          />
        </>
      )}
      <div className="relative z-10 flex items-start justify-between">
        <span
          className={[
            "inline-flex size-11 items-center justify-center rounded-xl backdrop-blur-md",
            image
              ? "bg-white/80 text-primary ring-1 ring-primary/10"
              : featured
                ? "bg-white/15 text-white"
                : "bg-primary/10 text-primary",
          ].join(" ")}
        >
          <Icon className="size-5" />
        </span>
        <ArrowUpRight
          className={[
            "size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            image ? "text-primary" : featured ? "text-white/85" : "text-muted-foreground group-hover:text-primary",
          ].join(" ")}
        />
      </div>
      <div className="relative z-10">
        <h3
          className={[
            "font-[family-name:var(--font-manrope)] font-bold leading-tight tracking-tight",
            featured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl",
            image ? "text-foreground" : "",
          ].join(" ")}
        >
          {title}
        </h3>
        <p
          className={[
            "mt-2 max-w-md text-sm leading-relaxed",
            featured && !image ? "text-white/90" : "text-muted-foreground",
          ].join(" ")}
        >
          {desc}
        </p>
      </div>
    </Link>
  );
}
