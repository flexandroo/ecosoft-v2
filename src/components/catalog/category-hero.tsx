import Link from "next/link";
import { ChevronRight } from "lucide-react";

function pluralize(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** Compact category header: breadcrumbs, title, short description and product count — no banner. */
export function CategoryHero({ title, subtitle, count }: { title: string; subtitle: string; count: number }) {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1600px] px-4 py-5 md:px-8 md:py-6">
        <nav aria-label="Хлібні крихти" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">
            Головна
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <Link href="/catalog" className="transition-colors hover:text-primary">
            Каталог
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-foreground">{title}</span>
        </nav>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="tabular font-semibold text-foreground">{count}</span>{" "}
            {pluralize(count, ["товар", "товари", "товарів"])}
          </p>
        </div>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </section>
  );
}
