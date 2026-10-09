import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { href?: string; label: string };

/**
 * Compact catalogue header: breadcrumbs and the section title only, no banner,
 * so the first row of products is visible as soon as the page opens.
 */
export function CatalogHeader({ title, crumbs }: { title: string; crumbs: Crumb[] }) {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1600px] px-4 py-4 md:px-8 md:py-5">
        <nav aria-label="Хлібні крихти" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {c.href ? (
                <Link href={c.href} className="transition-colors hover:text-primary">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
              {i < crumbs.length - 1 && <ChevronRight className="size-3" aria-hidden />}
            </span>
          ))}
        </nav>
        <h1 className="mt-1.5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
      </div>
    </section>
  );
}
