"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/products";

export function CategoryPills() {
  const pathname = usePathname();
  const active = pathname.startsWith("/catalog/")
    ? pathname.split("/")[2]
    : null;

  const items: { href: string; label: string; key: string | null }[] = [
    { href: "/catalog", label: "Усі", key: null },
    ...CATEGORIES.map((c) => ({
      href: `/catalog/${c.key}`,
      label: c.short,
      key: c.key,
    })),
  ];

  return (
    <nav
      aria-label="Категорії"
      className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
    >
      <div className="flex gap-2 pb-1">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
