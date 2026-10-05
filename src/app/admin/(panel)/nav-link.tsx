"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNavLink({
  href,
  label,
  icon,
  badge,
  exact,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-4",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
      {badge ? (
        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[11px] leading-none font-semibold text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
