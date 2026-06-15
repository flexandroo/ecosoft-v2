import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { href?: string; label: string };

export function PageHeader({
  title,
  subtitle,
  crumbs,
}: {
  title?: string;
  subtitle?: string;
  crumbs: Crumb[];
}) {
  const compact = !title;
  return (
    <section className="border-b border-border bg-card">
      <div
        className={`mx-auto max-w-7xl px-4 md:px-8 ${
          compact
            ? "pb-4 pt-24 md:pb-5 md:pt-28"
            : "pb-10 pt-28 md:pb-12 md:pt-32"
        }`}
      >
        <nav
          aria-label="Хлібні крихти"
          className={`flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground ${
            title ? "mb-4" : ""
          }`}
        >
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {c.href ? (
                <Link href={c.href} className="hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
              {i < crumbs.length - 1 && <ChevronRight className="size-3" aria-hidden />}
            </span>
          ))}
        </nav>

        {title && (
          <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {title}
          </h1>
        )}

        {subtitle && (
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
