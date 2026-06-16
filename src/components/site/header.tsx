"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, ShoppingCart, Search, Menu, X, ChevronDown } from "lucide-react";

const PRIMARY_NAV = [
  { href: "/", label: "Головна" },
  { href: "/catalog", label: "Каталог" },
];

const CUSTOMER_NAV = [
  { href: "/delivery", label: "Доставка і оплата" },
  { href: "/returns", label: "Повернення та обмін" },
  { href: "/about", label: "Про нас" },
];

export function Header() {
  const pathname = usePathname();
  const hasDarkHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);

  useEffect(() => {
    if (!hasDarkHero) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasDarkHero]);

  const onHero = hasDarkHero && !scrolled && !mobileOpen;

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        onHero
          ? "bg-transparent text-white"
          : "bg-background/95 text-foreground border-b border-border backdrop-blur-md",
      ].join(" ")}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Перейти до вмісту
      </a>
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 md:px-8">
        <Link
          href="/"
          aria-label="Ecosoft — головна"
          className={[
            "font-[family-name:var(--font-manrope)] text-2xl font-extrabold lowercase tracking-tight transition-colors",
            onHero ? "text-white" : "text-primary",
          ].join(" ")}
        >
          ecosoft
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative rounded-md px-3 py-2 text-sm transition-colors",
                  isActive ? "font-semibold" : "font-medium",
                  onHero
                    ? isActive
                      ? "text-white"
                      : "text-white/85 hover:text-white"
                    : isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  isActive
                    ? "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-current after:content-['']"
                    : "",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          <div
            className="relative"
            onMouseEnter={() => setCustomerOpen(true)}
            onMouseLeave={() => setCustomerOpen(false)}
          >
            <button
              onClick={() => setCustomerOpen((v) => !v)}
              aria-expanded={customerOpen}
              aria-haspopup="menu"
              className={[
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                onHero
                  ? "text-white/85 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Для клієнта
              <ChevronDown
                className={`size-3.5 transition-transform ${customerOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              role="menu"
              className={[
                "absolute left-1/2 top-full w-60 -translate-x-1/2 pt-2 transition-all duration-200",
                customerOpen
                  ? "visible opacity-100"
                  : "invisible opacity-0 -translate-y-1",
              ].join(" ")}
            >
              <div className="rounded-xl border border-border bg-card p-2 shadow-xl shadow-black/5">
                {CUSTOMER_NAV.map((item) => (
                  <Link
                    key={item.href}
                    role="menuitem"
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/contacts"
            aria-current={pathname.startsWith("/contacts") ? "page" : undefined}
            className={[
              "relative rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/contacts") ? "font-semibold" : "font-medium",
              onHero
                ? pathname.startsWith("/contacts")
                  ? "text-white"
                  : "text-white/85 hover:text-white"
                : pathname.startsWith("/contacts")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              pathname.startsWith("/contacts")
                ? "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-current after:content-['']"
                : "",
            ].join(" ")}
          >
            Контакти
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <a
            href="tel:+380800300999"
            className={[
              "hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors md:flex",
              onHero ? "text-white hover:text-white/80" : "text-foreground hover:bg-muted",
            ].join(" ")}
          >
            <Phone className="size-4" aria-hidden />
            0 800 300 999
          </a>
          <IconButton onHero={onHero} label="Пошук">
            <Search className="size-4" />
          </IconButton>
          <IconButton onHero={onHero} label="Корзина" href="/cart">
            <ShoppingCart className="size-4" />
          </IconButton>
          <button
            aria-label={mobileOpen ? "Закрити меню" : "Меню"}
            onClick={() => setMobileOpen((v) => !v)}
            className={[
              "grid size-9 place-items-center rounded-md transition-colors lg:hidden",
              onHero
                ? "text-white hover:bg-white/10"
                : "text-foreground hover:bg-muted",
            ].join(" ")}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background text-foreground lg:hidden">
          <nav className="mx-auto flex max-w-[1600px] flex-col gap-1 px-4 py-4 md:px-8">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-1 rounded-md bg-muted/40 px-1 py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Для клієнта
              </div>
              {CUSTOMER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href="/contacts"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium transition-colors hover:bg-muted"
            >
              Контакти
            </Link>
            <a
              href="tel:+380800300999"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              <Phone className="size-4" /> 0 800 300 999
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function IconButton({
  children,
  label,
  href,
  onHero,
}: {
  children: React.ReactNode;
  label: string;
  href?: string;
  onHero: boolean;
}) {
  const className = [
    "grid size-9 place-items-center rounded-md transition-colors",
    onHero
      ? "text-white hover:bg-white/10"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  ].join(" ");
  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button aria-label={label} className={className}>
      {children}
    </button>
  );
}

