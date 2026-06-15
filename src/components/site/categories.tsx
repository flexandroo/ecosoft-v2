import Link from "next/link";
import { ArrowUpRight, Droplet, Waves, Filter, Layers, Factory } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Category = {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  span?: string;
  featured?: boolean;
};

const CATEGORIES: Category[] = [
  {
    href: "/catalog/osmos",
    title: "Зворотний осмос",
    desc: "5–7-ступеневі системи з мінералізатором. 99.5% очищення.",
    icon: Droplet,
    span: "md:col-span-2 md:row-span-2",
    featured: true,
  },
  {
    href: "/catalog/softeners",
    title: "Помʼякшувачі води",
    desc: "Для котлів, бойлерів, побутової техніки.",
    icon: Waves,
  },
  {
    href: "/catalog/filters",
    title: "Магістральні фільтри",
    desc: "Очищення на вході в будинок.",
    icon: Filter,
  },
  {
    href: "/catalog/cartridges",
    title: "Картриджі",
    desc: "Змінні елементи до всіх систем.",
    icon: Layers,
    span: "md:col-span-2",
  },
  {
    href: "/catalog/industrial",
    title: "Промислові системи",
    desc: "Рішення для бізнесу та виробництва.",
    icon: Factory,
  },
];

export function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
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

      <div className="grid auto-rows-[200px] grid-cols-1 gap-4 sm:auto-rows-[220px] sm:grid-cols-2 md:grid-cols-3">
        {CATEGORIES.map((c) => (
          <CategoryCard key={c.href} {...c} />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ href, title, desc, icon: Icon, span, featured }: Category) {
  return (
    <Link
      href={href}
      className={[
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5",
        featured ? "bg-primary text-primary-foreground" : "",
        span ?? "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <span
          className={[
            "inline-flex size-10 items-center justify-center rounded-lg",
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
      <div>
        <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight md:text-2xl">
          {title}
        </h3>
        <p
          className={[
            "mt-1 max-w-md text-sm",
            featured ? "text-white/80" : "text-muted-foreground",
          ].join(" ")}
        >
          {desc}
        </p>
      </div>
    </Link>
  );
}
