import Link from "next/link";
import { ArrowUpRight, Droplet, ShieldCheck, Package, Filter, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
    href: "/catalog/osmos",
    title: "Зворотні осмоси",
    desc: "Питна вода для дому та офісу.",
    icon: Droplet,
    span: "md:col-span-2 md:row-span-2",
    featured: true,
    image: "/images/osmos-kitchen.png",
  },
  {
    href: "/catalog/softeners",
    title: "Фільтри від заліза та жорсткості",
    desc: "Захист сантехніки, котлів і техніки.",
    icon: ShieldCheck,
  },
  {
    href: "/catalog",
    title: "Компактні системи",
    desc: "Готові рішення для квартири та будинку.",
    icon: Package,
  },
  {
    href: "/catalog/filters",
    title: "Магістральні фільтри",
    desc: "Очищення води на вході в будинок.",
    icon: Filter,
    span: "md:col-span-2",
  },
  {
    href: "/catalog/cartridges",
    title: "Картриджі",
    desc: "Змінні елементи для обслуговування систем.",
    icon: Layers,
  },
];

export function Categories() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-20 md:px-8 md:py-28">
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
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5",
        featured
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/40",
        span ?? "",
      ].join(" ")}
    >
      {image && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
          />
          <span
            aria-hidden
            className="absolute inset-0 -z-10 bg-[oklch(0.30_0.12_252)]/55"
          />
        </>
      )}
      <div className="relative flex items-start justify-between">
        <span
          className={[
            "inline-flex size-11 items-center justify-center rounded-xl backdrop-blur-md",
            featured ? "bg-white/15 text-white" : "bg-primary/10 text-primary",
          ].join(" ")}
        >
          <Icon className="size-5" />
        </span>
        <ArrowUpRight
          className={[
            "size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            featured ? "text-white/80" : "text-muted-foreground group-hover:text-primary",
          ].join(" ")}
        />
      </div>
      <div className="relative">
        <h3
          className={[
            "font-[family-name:var(--font-manrope)] font-bold leading-tight tracking-tight",
            featured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl",
            image ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]" : "",
          ].join(" ")}
        >
          {title}
        </h3>
        <p
          className={[
            "mt-2 max-w-md text-sm leading-relaxed",
            featured ? "text-white/85" : "text-muted-foreground",
            image ? "drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]" : "",
          ].join(" ")}
        >
          {desc}
        </p>
      </div>
    </Link>
  );
}
